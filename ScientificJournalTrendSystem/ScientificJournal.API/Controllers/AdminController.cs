using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Helpers;
using ScientificJournal.Common.Policies;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/admin")]
[AuthorizeRoles("Admin")]
public class AdminController : ControllerBase
{
    private readonly ISyncService _syncService;
    private readonly ITrendingService _trendingService;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ScientificJournal.Common.Configurations.JwtSettings _jwtSettings;

    public AdminController(
        ISyncService syncService, 
        ITrendingService trendingService, 
        AppDbContext context, 
        IConfiguration configuration,
        Microsoft.Extensions.Options.IOptions<ScientificJournal.Common.Configurations.JwtSettings> jwtSettings)
    {
        _syncService = syncService;
        _trendingService = trendingService;
        _context = context;
        _configuration = configuration;
        _jwtSettings = jwtSettings.Value;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
        var totalPublications = await _context.Publications.CountAsync(p => !p.IsDeleted);
        var lastSync = await _context.SyncLogs
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new
            {
                source = s.SourceApi,
                status = s.Status.ToString(),
                startedAt = s.StartedAt,
                finishedAt = s.FinishedAt,
                recordsSynced = s.RecordsSynced
            })
            .FirstOrDefaultAsync();

        var roleDistribution = await _context.Users
            .Where(u => !u.IsDeleted)
            .GroupBy(u => u.Role)
            .Select(g => new { role = g.Key.ToString(), count = g.Count() })
            .ToListAsync();

        return Ok(new
        {
            totalUsers,
            totalPublications,
            totalKeywords = await _context.Keywords.CountAsync(),
            lastSync,
            roleDistribution,
            apiHealth = new[]
            {
                new { label = "Semantic Scholar", value = "Ready" },
                new { label = "OpenAlex", value = "Ready" }
            }
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = page <= 0 ? 1 : page;
        pageSize = pageSize <= 0 ? 20 : pageSize;

        var query = _context.Users.Where(u => !u.IsDeleted).OrderByDescending(u => u.CreatedAt);
        var totalCount = await query.CountAsync();
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                id = u.Id,
                name = u.FullName,
                fullName = u.FullName,
                email = u.Email,
                role = u.Role.ToString(),
                status = u.IsActive ? "Active" : "Inactive",
                isActive = u.IsActive,
                isPro = u.IsPro,
                plan = u.IsPro ? "Pro" : "Free",
                searchAccuracy = PlanPolicy.GetSearchAccuracy(u.Role, u.IsPro),
                createdAt = u.CreatedAt,
                lastLoginAt = u.CreatedAt,
                avatar = u.FullName.Length >= 2 ? u.FullName.Substring(0, 2).ToUpper() : "ST"
            })
            .ToListAsync();

        return Ok(new { items = users, totalCount, page, pageSize });
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] AdminUserUpsertDto request)
    {
        var email = NormalizeEmail(request.Email);
        var fullName = request.FullName?.Trim();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest(new { message = "Full name and email are required." });
        }

        if (!TryParseRole(request.Role, out var role))
        {
            return BadRequest(new { message = "Invalid role. Role must be Student, Lecturer, Researcher, or Admin." });
        }

        var exists = await _context.Users.AnyAsync(u => u.Email == email && !u.IsDeleted);
        if (exists)
        {
            return Conflict(new { message = "Email already exists." });
        }

        var password = string.IsNullOrWhiteSpace(request.Password)
            ? "ScholarTrend@123"
            : request.Password;

        var user = new User
        {
            Email = email,
            FullName = fullName,
            PasswordHash = PasswordHasher.HashPassword(password),
            Role = role,
            IsActive = request.IsActive ?? string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase),
            IsPro = request.IsPro ?? string.Equals(request.Plan, "Pro", StringComparison.OrdinalIgnoreCase),
            IsDeleted = false,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Created user {user.Email} with role {user.Role}.", "Success", "ADMIN-USER-CREATE");

        return Ok(new { message = "User created.", user = MapAdminUser(user) });
    }

    [AllowAnonymous]
    [HttpPost("users/sync-external")]
    public async Task<IActionResult> SyncExternalUser([FromBody] ExternalUserSyncDto request)
    {
        if (!IsAuthorizedInternalRequest())
        {
            return Unauthorized(new { message = "Invalid internal sync secret." });
        }

        var email = NormalizeEmail(request.Email);
        var fullName = (request.FullName ?? request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest(new { message = "Full name and email are required." });
        }

        if (!TryParseRole(request.Role, out var role))
        {
            role = UserRole.Researcher;
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            user = new User
            {
                Email = email,
                FullName = fullName,
                PasswordHash = PasswordHasher.HashPassword(Guid.NewGuid().ToString("N")),
                Role = role,
                IsActive = true,
                IsDeleted = false,
                IsEmailVerified = true,
                IsPro = request.IsPro ?? string.Equals(request.Plan, "Pro", StringComparison.OrdinalIgnoreCase),
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            await LogAuditAsync("User Management", $"Synced external {request.Provider ?? "OAuth"} user {user.Email}.", "Success", "ADMIN-USER-SYNC");

            var token = ScientificJournal.Common.Helpers.JwtHelper.GenerateAccessToken(user.Id, user.Email, user.FullName, user.Role.ToString(), _jwtSettings.Secret, TimeSpan.FromHours(1));
            var refresh = ScientificJournal.Common.Helpers.JwtHelper.GenerateRefreshToken(user.Id, user.Email, user.FullName, user.Role.ToString(), _jwtSettings.Secret, TimeSpan.FromDays(_jwtSettings.ExpiryInDays));

            return Ok(new { 
                message = "External user synced.", 
                user = MapAdminUser(user),
                accessToken = token,
                refreshToken = refresh
            });
        }

        user.FullName = fullName;
        user.IsActive = true;
        user.IsDeleted = false;
        user.IsEmailVerified = true;
        if (request.IsPro == true || string.Equals(request.Plan, "Pro", StringComparison.OrdinalIgnoreCase))
        {
            user.IsPro = true;
        }

        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Refreshed external {request.Provider ?? "OAuth"} user {user.Email}.", "Success", "ADMIN-USER-SYNC");

        var refreshedToken = ScientificJournal.Common.Helpers.JwtHelper.GenerateAccessToken(user.Id, user.Email, user.FullName, user.Role.ToString(), _jwtSettings.Secret, TimeSpan.FromHours(1));
        var refreshedRefresh = ScientificJournal.Common.Helpers.JwtHelper.GenerateRefreshToken(user.Id, user.Email, user.FullName, user.Role.ToString(), _jwtSettings.Secret, TimeSpan.FromDays(_jwtSettings.ExpiryInDays));

        return Ok(new { 
            message = "External user refreshed.", 
            user = MapAdminUser(user),
            accessToken = refreshedToken,
            refreshToken = refreshedRefresh
        });
    }

    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] AdminUserUpsertDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });

        var email = NormalizeEmail(request.Email);
        var fullName = request.FullName?.Trim();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest(new { message = "Full name and email are required." });
        }

        if (!TryParseRole(request.Role, out var role))
        {
            return BadRequest(new { message = "Invalid role. Role must be Student, Lecturer, Researcher, or Admin." });
        }

        var emailExists = await _context.Users.AnyAsync(u => u.Id != id && u.Email == email && !u.IsDeleted);
        if (emailExists)
        {
            return Conflict(new { message = "Email already exists." });
        }

        user.Email = email;
        user.FullName = fullName;
        user.Role = role;
        user.IsActive = request.IsActive ?? string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
        user.IsPro = request.IsPro ?? string.Equals(request.Plan, "Pro", StringComparison.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = PasswordHasher.HashPassword(request.Password);
        }

        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Updated user {user.Email}.", "Success", "ADMIN-USER-UPDATE");

        return Ok(new { message = "User updated.", user = MapAdminUser(user) });
    }

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });

        user.IsDeleted = true;
        user.IsActive = false;
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Deleted user {user.Email}.", "Success", "ADMIN-USER-DELETE");

        return Ok(new { message = "User deleted." });
    }

    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });

        if (!TryParseRole(request.Role, out var newRole))
        {
            return BadRequest(new { message = "Invalid role. Role must be Student, Lecturer, Researcher, or Admin." });
        }

        var oldRole = user.Role;
        user.Role = newRole;
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Changed role for {user.Email} from {oldRole} to {newRole}.", "Success", "ADMIN-ROLE-CHANGE");

        return Ok(new { message = $"User role updated to '{newRole}'.", user = MapAdminUser(user), role = newRole.ToString() });
    }

    [HttpPut("users/{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Set active status for {user.Email} to {user.IsActive}.", "Success", "ADMIN-USER-ACTIVE");

        return Ok(new { message = $"User status updated. IsActive: {user.IsActive}", user = MapAdminUser(user), isActive = user.IsActive });
    }

    [HttpPut("users/{id:int}/toggle-pro")]
    public async Task<IActionResult> TogglePro(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });

        user.IsPro = !user.IsPro;
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Set Pro status for {user.Email} to {user.IsPro}.", "Success", "ADMIN-USER-PRO");

        return Ok(new { message = $"User premium status updated. IsPro: {user.IsPro}", user = MapAdminUser(user), isPro = user.IsPro });
    }

    [HttpPost("notifications/broadcast")]
    public async Task<IActionResult> BroadcastNotification([FromBody] AdminBroadcastNotificationDto request)
    {
        var message = request.Message?.Trim();
        if (string.IsNullOrWhiteSpace(message))
        {
            return BadRequest(new { message = "Notification message is required." });
        }

        IQueryable<User> query = _context.Users.Where(u => !u.IsDeleted && u.IsActive);
        if (!string.IsNullOrWhiteSpace(request.RecipientRole) &&
            !string.Equals(request.RecipientRole, "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!TryParseRole(request.RecipientRole, out var role))
            {
                return BadRequest(new { message = "Invalid recipient role." });
            }
            query = query.Where(u => u.Role == role);
        }

        var users = await query.ToListAsync();
        var notificationType = ParseNotificationType(request.NotificationType);
        var notifications = users.Select(user => new Notification
        {
            UserId = user.Id,
            Message = message,
            NotificationType = notificationType,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();
        await LogAuditAsync("Notification Management", $"Broadcast notification to {users.Count} users. Target role: {request.RecipientRole ?? "All"}.", "Success", "ADMIN-NOTIFICATION-BROADCAST");

        return Ok(new
        {
            message = "Notification broadcast saved.",
            count = notifications.Count,
            items = notifications.Select(n => new
            {
                n.Id,
                n.Message,
                NotificationType = n.NotificationType.ToString(),
                n.IsRead,
                n.CreatedAt
            })
        });
    }

    [HttpPost("audit-log")]
    public async Task<IActionResult> CreateAuditLog([FromBody] AdminAuditLogRequestDto request)
    {
        await LogAuditAsync(
            string.IsNullOrWhiteSpace(request.Module) ? "Admin" : request.Module,
            string.IsNullOrWhiteSpace(request.Detail) ? "Admin action completed." : request.Detail,
            string.IsNullOrWhiteSpace(request.Severity) ? "Info" : request.Severity,
            string.IsNullOrWhiteSpace(request.Code) ? "ADMIN-AUDIT" : request.Code);

        return Ok(new { message = "Audit log saved." });
    }

    [HttpGet("system-logs")]
    public async Task<IActionResult> GetSystemLogs([FromQuery] int limit = 50)
    {
        limit = limit <= 0 ? 50 : limit;
        var logs = await _context.SyncLogs
            .OrderByDescending(s => s.StartedAt)
            .Take(limit)
            .Select(s => new
            {
                time = s.StartedAt,
                eventName = s.SourceApi,
                detail = s.ErrorMessage ?? ((s.RecordsSynced ?? 0) > 0 ? (s.RecordsSynced + " records synced") : "Action completed"),
                module = s.SourceApi.StartsWith("Admin Audit:") ? s.SourceApi.Replace("Admin Audit:", "").Trim() : "Sync",
                severity = s.SourceApi.StartsWith("Admin Audit:")
                    ? (s.Status == SyncStatus.Failed ? "Error" : "Success")
                    : (s.ErrorMessage == null ? (s.Status == SyncStatus.Completed ? "Success" : "Info") : "Error"),
                actor = s.TriggeredByUserId == null ? "scheduler@system" : "user-" + s.TriggeredByUserId,
                code = s.SourceApi.StartsWith("Admin Audit:") ? "AUDIT-" + s.Id : "SYNC-" + s.Id
            })
            .ToListAsync();

        if (logs.Count == 0)
        {
            return Ok(new[]
            {
                new
                {
                    time = DateTime.UtcNow,
                    eventName = "Admin API online",
                    detail = "No system logs have been recorded yet.",
                    module = "System",
                    severity = "Info",
                    actor = "api@system",
                    code = "SYS-READY"
                }
            });
        }

        return Ok(logs);
    }

    [HttpGet("health")]
    public async Task<IActionResult> GetHealth()
    {
        var latestSync = await _context.SyncLogs.OrderByDescending(s => s.StartedAt).FirstOrDefaultAsync();
        return Ok(new
        {
            status = "Healthy",
            checkedAt = DateTime.UtcNow,
            services = new[]
            {
                new { name = "API Gateway", state = "Operational", value = "Ready" },
                new { name = "Auth Service", state = "Operational", value = "JWT enabled" },
                new { name = "Search Index", state = "Operational", value = await _context.Publications.CountAsync(p => !p.IsDeleted) + " publications" },
                new { name = "Sync Workers", state = latestSync?.Status.ToString() ?? "Idle", value = latestSync?.StartedAt.ToString("u") ?? "No runs yet" }
            }
        });
    }

    [HttpPost("sync/semantic-scholar")]
    public async Task<IActionResult> SyncSemanticScholar()
    {
        await LogAuditAsync("Sync Management", "Admin triggered Semantic Scholar sync.", "Info", "ADMIN-SYNC-SEMANTIC");
        await _syncService.SyncFromSemanticScholarAsync();
        return Ok(new { message = "Semantic Scholar sync started." });
    }


    [HttpPost("sync/openalex")]
    public async Task<IActionResult> SyncOpenAlex()
    {
        await LogAuditAsync("Sync Management", "Admin triggered OpenAlex sync.", "Info", "ADMIN-SYNC-OPENALEX");
        await _syncService.SyncFromOpenAlexAsync();
        return Ok(new { message = "OpenAlex sync started." });
    }

    [HttpPost("recalculate-trends")]
    public async Task<IActionResult> RecalculateTrends()
    {
        await _trendingService.RecalculateTrendingMetricsAsync();
        await LogAuditAsync("Trend Management", "Admin recalculated trending metrics.", "Success", "ADMIN-TREND-RECALCULATE");
        return Ok(new { message = "Trending metrics recalculated successfully." });
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
        var totalPublications = await _context.Publications.CountAsync(p => !p.IsDeleted);
        var successSyncs = await _context.SyncLogs.CountAsync(l => l.Status == SyncStatus.Completed);
        var failedSyncs = await _context.SyncLogs.CountAsync(l => l.Status == SyncStatus.Failed);

        var roleDistribution = await _context.Users
            .Where(u => !u.IsDeleted)
            .GroupBy(u => u.Role)
            .Select(g => new
            {
                Role = g.Key.ToString(),
                Count = g.Count(),
                Percentage = totalUsers > 0 ? Math.Round((double)g.Count() / totalUsers * 100, 2) : 0.0
            })
            .ToListAsync();

        var recentActivities = await _context.SyncLogs
            .OrderByDescending(l => l.StartedAt)
            .Take(5)
            .Select(l => new
            {
                l.Id,
                l.SourceApi,
                l.Status,
                l.RecordsSynced,
                l.StartedAt,
                l.ErrorMessage
            })
            .ToListAsync();

        return Ok(new
        {
            totalUsers,
            totalPublications,
            successSyncs,
            failedSyncs,
            roleDistribution,
            recentActivities,
            systemStatus = "Healthy"
        });
    }

    [HttpGet("sync-logs")]
    public async Task<IActionResult> GetSyncLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.SyncLogs;
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, totalCount = total, page, pageSize });
    }

    private static string NormalizeEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private bool IsAuthorizedInternalRequest()
    {
        var configuredSecret =
            _configuration["Payments:InternalSyncSecret"] ??
            _configuration["PAYMENT_SYNC_SECRET"];
        var providedSecret = Request.Headers["X-Internal-Secret"].FirstOrDefault();
        return !string.IsNullOrWhiteSpace(configuredSecret) &&
               string.Equals(configuredSecret, providedSecret, StringComparison.Ordinal);
    }

    private static bool TryParseRole(string? role, out UserRole parsedRole)
    {
        var normalizedRole = string.Equals(role, "Administrator", StringComparison.OrdinalIgnoreCase)
            ? "Admin"
            : role;
        return Enum.TryParse(normalizedRole, true, out parsedRole);
    }

    private static NotificationType ParseNotificationType(string? type)
    {
        if (Enum.TryParse<NotificationType>(type, true, out var parsedType))
        {
            return parsedType;
        }

        if (string.Equals(type, "PUBLICATION NOTICE", StringComparison.OrdinalIgnoreCase))
        {
            return NotificationType.NEW_PUBLICATION;
        }

        if (string.Equals(type, "PLAN UPDATE", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(type, "PAYMENT NOTICE", StringComparison.OrdinalIgnoreCase))
        {
            return NotificationType.SYSTEM;
        }

        return NotificationType.SYSTEM;
    }

    private object MapAdminUser(User user) => new
    {
        id = user.Id,
        name = user.FullName,
        fullName = user.FullName,
        email = user.Email,
        role = user.Role.ToString(),
        status = user.IsActive ? "Active" : "Inactive",
        isActive = user.IsActive,
        isPro = user.IsPro,
        plan = user.IsPro ? "Pro" : "Free",
        searchAccuracy = PlanPolicy.GetSearchAccuracy(user.Role, user.IsPro),
        createdAt = user.CreatedAt,
        lastLoginAt = user.CreatedAt,
        avatar = user.FullName.Length >= 2 ? user.FullName.Substring(0, 2).ToUpper() : "ST"
    };

    private async Task LogAuditAsync(string module, string detail, string severity, string code)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        int? userId = int.TryParse(userIdValue, out var parsedUserId) ? parsedUserId : null;
        var status = string.Equals(severity, "Error", StringComparison.OrdinalIgnoreCase)
            ? SyncStatus.Failed
            : SyncStatus.Completed;

        _context.SyncLogs.Add(new SyncLog
        {
            TriggeredByUserId = userId,
            SourceApi = $"Admin Audit: {module}",
            Status = status,
            RecordsSynced = null,
            ErrorMessage = $"{code}: {detail}",
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }
}

public class ChangeRoleDto
{
    public string Role { get; set; } = string.Empty;
}

public class AdminUserUpsertDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Name { get => FullName; set => FullName = value ?? string.Empty; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";
    public string Status { get; set; } = "Active";
    public string Plan { get; set; } = "Free";
    public bool? IsActive { get; set; }
    public bool? IsPro { get; set; }
    public string? Password { get; set; }
}

public class ExternalUserSyncDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Name { get => FullName; set => FullName = value ?? string.Empty; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Researcher";
    public string Provider { get; set; } = "Google";
    public string ExternalId { get; set; } = string.Empty;
    public string Plan { get; set; } = "Free";
    public bool? IsPro { get; set; }
}

public class AdminBroadcastNotificationDto
{
    public string RecipientRole { get; set; } = "All";
    public string NotificationType { get; set; } = "SYSTEM";
    public string Message { get; set; } = string.Empty;
}

public class AdminAuditLogRequestDto
{
    public string Module { get; set; } = "Admin";
    public string Detail { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info";
    public string Code { get; set; } = "ADMIN-AUDIT";
}
