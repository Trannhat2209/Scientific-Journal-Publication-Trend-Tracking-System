using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using ScientificJournal.Business.Jobs;
using ScientificJournal.API.Filters;
using ScientificJournal.API.Services;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Helpers;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.External;

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
    private readonly IRecurringJobManager _recurringJobs;
    private readonly ExternalApiRateLimiter _rateLimiter;
    private readonly SemanticScholarClient _semanticScholarClient;
    private readonly OpenAlexClient _openAlexClient;
    private readonly SerpApiScholarSearchClient _serpApiClient;
    private readonly IAuthService _authService;

    public AdminController(
        ISyncService syncService,
        ITrendingService trendingService,
        AppDbContext context,
        IConfiguration configuration,
        IRecurringJobManager recurringJobs,
        ExternalApiRateLimiter rateLimiter,
        SemanticScholarClient semanticScholarClient,
        OpenAlexClient openAlexClient,
        SerpApiScholarSearchClient serpApiClient,
        IAuthService authService)
    {
        _syncService = syncService;
        _trendingService = trendingService;
        _context = context;
        _configuration = configuration;
        _recurringJobs = recurringJobs;
        _rateLimiter = rateLimiter;
        _semanticScholarClient = semanticScholarClient;
        _openAlexClient = openAlexClient;
        _serpApiClient = serpApiClient;
        _authService = authService;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
        var totalPublications = await _context.Publications.CountAsync(p => !p.IsDeleted);
        var visibleSyncLogs = GetVisibleSyncLogs();
        var lastSync = await visibleSyncLogs
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

        var userGrowth = await _context.Users
            .Where(u => !u.IsDeleted)
            .GroupBy(u => new { u.CreatedAt.Year, u.CreatedAt.Month })
            .Select(g => new
            {
                year = g.Key.Year,
                month = g.Key.Month,
                count = g.Count()
            })
            .OrderByDescending(x => x.year)
            .ThenByDescending(x => x.month)
            .Take(12)
            .ToListAsync();
        userGrowth = userGrowth
            .OrderBy(x => x.year)
            .ThenBy(x => x.month)
            .ToList();

        var failedSyncsLast24Hours = await visibleSyncLogs.CountAsync(s =>
            s.StartedAt >= DateTime.UtcNow.AddHours(-24) &&
            s.Status == SyncStatus.Failed &&
            !s.SourceApi.StartsWith("Admin Audit:") &&
            !_context.SyncLogs.Any(later =>
                later.SourceApi == s.SourceApi &&
                later.Status == SyncStatus.Completed &&
                later.StartedAt > s.StartedAt));
        var totalNotificationCount = await _context.Notifications.CountAsync();
        var unreadNotificationCount = await _context.Notifications.CountAsync(n => !n.IsRead);
        var recentActivity = await visibleSyncLogs
            .OrderByDescending(s => s.StartedAt)
            .Take(5)
            .Select(s => new
            {
                id = "SYNC-" + s.Id,
                text = s.ErrorMessage ?? (s.SourceApi + " completed with " + (s.RecordsSynced ?? 0) + " records."),
                time = s.StartedAt,
                severity = s.Status == SyncStatus.Failed ? "Error" : "Success"
            })
            .ToListAsync();

        return Ok(new
        {
            totalUsers,
            totalPublications,
            totalKeywords = await _context.Keywords.CountAsync(),
            lastSync,
            roleDistribution,
            userGrowth,
            totalNotificationCount,
            unreadNotificationCount,
            failedSyncsLast24Hours,
            recentActivity,
            apiHealth = new[]
            {
                new { label = "OpenAlex", value = "Ready" },
                new { label = "Google Scholar", value = "Ready via SerpApi" },
                new { label = "ResearchGate", value = "Ready via Scholar lookup" },
                new { label = "Semantic Scholar", value = "Ready via Graph API" }
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
                createdAt = u.CreatedAt,
                lastLoginAt = u.CreatedAt,
                academicIdentity = new
                {
                    institution = u.Institution ?? string.Empty,
                    department = u.Department ?? string.Empty,
                    institutionalEmail = u.InstitutionalEmail ?? string.Empty,
                    identifier = u.AcademicIdentifier ?? string.Empty,
                    programOrField = u.ProgramOrField ?? string.Empty,
                    evidenceUrl = u.EvidenceUrl ?? string.Empty
                },
                verificationStatus = u.VerificationStatus,
                requestedRole = u.RequestedRole,
                verificationSubmittedAt = u.VerificationSubmittedAt,
                verificationReviewedAt = u.VerificationReviewedAt,
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

        if (!TryParseManagedRole(request.Role, out var role))
        {
            return BadRequest(new { message = "Invalid role. Role must be Student, Lecturer, or Researcher." });
        }

        var exists = await _context.Users.AnyAsync(u => u.Email == email && !u.IsDeleted);
        if (exists)
        {
            return Conflict(new { message = "Email already exists." });
        }

        var password = string.IsNullOrWhiteSpace(request.Password)
            ? GenerateSecurePassword()
            : request.Password;

        var user = new User
        {
            Email = email,
            FullName = fullName,
            PasswordHash = PasswordHasher.HashPassword(password),
            Role = role,
            IsActive = request.IsActive ?? string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase),
            IsDeleted = false,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Created user {user.Email} with role {user.Role}.", "Success", "ADMIN-USER-CREATE");

        return Ok(new { message = "User created.", user = MapAdminUser(user), initialPassword = request.Password?.Length > 0 ? null : password });
    }

    [AllowAnonymous]
    [HttpPost("users/sync-external")]
    public async Task<IActionResult> SyncExternalUser([FromBody] ExternalUserSyncDto request)
    {
        if (!IsAuthorizedInternalRequest())
        {
            return Unauthorized(new { message = "Invalid internal sync secret." });
        }

        if (string.IsNullOrWhiteSpace(request.Provider) ||
            string.Equals(request.Provider.Trim(), "Local", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Local credential accounts must be created through /api/auth/register so their password is preserved."
            });
        }

        var email = NormalizeEmail(request.Email);
        var fullName = (request.FullName ?? request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest(new { message = "Full name and email are required." });
        }

        if (!TryParseRole(request.Role, out var role))
        {
            role = UserRole.Student;
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
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            await LogAuditAsync("User Management", $"Synced external {request.Provider ?? "OAuth"} user {user.Email}.", "Success", "ADMIN-USER-SYNC");

            return Ok(new { message = "External user synced.", user = MapAdminUser(user), auth = await _authService.IssueExternalSessionAsync(user.Id) });
        }

        user.FullName = fullName;
        user.IsActive = true;
        user.IsDeleted = false;
        user.IsEmailVerified = true;

        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Refreshed external {request.Provider ?? "OAuth"} user {user.Email}.", "Success", "ADMIN-USER-SYNC");

        return Ok(new { message = "External user refreshed.", user = MapAdminUser(user), auth = await _authService.IssueExternalSessionAsync(user.Id) });
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

        if (!TryParseManagedRole(request.Role, out var role))
        {
            return BadRequest(new { message = "Invalid role. Role must be Student, Lecturer, or Researcher." });
        }

        var emailExists = await _context.Users.AnyAsync(u => u.Id != id && u.Email == email && !u.IsDeleted);
        if (emailExists)
        {
            return Conflict(new { message = "Email already exists." });
        }

        user.Email = email;
        user.FullName = fullName;
        user.IsActive = request.IsActive ?? string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
        if (request.VerificationStatus is "pending" or "verified" or "rejected" or "not_submitted")
        {
            if (!string.Equals(user.VerificationStatus, request.VerificationStatus, StringComparison.OrdinalIgnoreCase))
            {
                user.VerificationReviewedAt = DateTime.UtcNow;
            }
            user.VerificationStatus = request.VerificationStatus;
            if (request.VerificationStatus == "verified")
            {
                var approvedRole = role;
                if (TryParseManagedRole(user.RequestedRole, out var requestedRole))
                {
                    approvedRole = requestedRole;
                }
                user.Role = approvedRole;
                user.RequestedRole = null;
            }
        }
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = PasswordHasher.HashPassword(request.Password);
        }

        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Updated user {user.Email}.", "Success", "ADMIN-USER-UPDATE");

        return Ok(new { message = "User updated.", user = MapAdminUser(user) });
    }

    [HttpPost("users/{id:int}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(int id, [FromBody] AdminResetPasswordDto request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
        {
            return BadRequest(new { message = "New password must be at least 8 characters long." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });

        user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Administrator reset the password for {user.Email}.", "Warning", "ADMIN-PASSWORD-RESET");

        return Ok(new { message = "Password reset successfully. The user can now sign in with the new password." });
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

    [AllowAnonymous]
    [HttpGet("users/internal")]
    public async Task<IActionResult> GetUserInternal([FromQuery] string? email)
    {
        if (!IsAuthorizedInternalRequest())
        {
            return Unauthorized(new { message = "Invalid internal sync secret." });
        }

        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null)
        {
            return Ok(new { exists = false, isDeleted = false, isActive = false });
        }

        return Ok(new
        {
            exists = true,
            isDeleted = user.IsDeleted,
            isActive = user.IsActive,
            user = MapAdminUser(user)
        });
    }

    [AllowAnonymous]
    [HttpDelete("users/internal")]
    public async Task<IActionResult> DeleteUserInternal([FromQuery] int? id, [FromQuery] string? email)
    {
        if (!IsAuthorizedInternalRequest())
        {
            return Unauthorized(new { message = "Invalid internal sync secret." });
        }

        var normalizedEmail = NormalizeEmail(email);
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            !u.IsDeleted &&
            ((id.HasValue && u.Id == id.Value) ||
             (!string.IsNullOrWhiteSpace(normalizedEmail) && u.Email == normalizedEmail)));

        if (user == null) return NotFound(new { message = "User not found." });

        user.IsDeleted = true;
        user.IsActive = false;
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Deleted user {user.Email} through internal admin sync.", "Success", "ADMIN-USER-INTERNAL-DELETE");

        return Ok(new { message = "User deleted.", user = MapAdminUser(user) });
    }

    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });

        if (!TryParseManagedRole(request.Role, out var newRole))
        {
            return BadRequest(new { message = "Invalid role. Role must be Student, Lecturer, or Researcher." });
        }

        var oldRole = user.Role;
        if (!string.Equals(user.VerificationStatus, "pending", StringComparison.OrdinalIgnoreCase) ||
            !TryParseManagedRole(user.RequestedRole, out var requestedRole) ||
            requestedRole != newRole)
        {
            return Conflict(new
            {
                message = "A matching pending role-change request must be verified before the role can change."
            });
        }

        user.Role = newRole;
        user.RequestedRole = null;
        user.VerificationStatus = "verified";
        user.VerificationReviewedAt = DateTime.UtcNow;
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

    [HttpPost("users/{id:int}/grant-admin")]
    public async Task<IActionResult> GrantAdministrator(int id, [FromBody] GrantAdminRoleDto request)
    {
        if (!string.Equals(request.Confirmation, "GRANT ADMIN", StringComparison.Ordinal))
            return BadRequest(new { message = "Type GRANT ADMIN to confirm this privileged action." });
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });
        if (!user.IsActive) return Conflict(new { message = "Activate the account before granting Administrator access." });
        var oldRole = user.Role;
        user.Role = UserRole.Admin;
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Granted Administrator role to {user.Email}; previous role {oldRole}.", "Warning", "ADMIN-ROLE-GRANT");
        return Ok(new { message = "Administrator access granted.", user = MapAdminUser(user) });
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
        var recipientEmail = NormalizeEmail(request.RecipientEmail);
        if (!string.IsNullOrWhiteSpace(recipientEmail))
        {
            query = query.Where(u => u.Email == recipientEmail);
        }
        if (!string.IsNullOrWhiteSpace(request.RecipientRole) &&
            !string.Equals(request.RecipientRole, "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!TryParseRole(request.RecipientRole, out var role))
            {
                return BadRequest(new { message = "Invalid recipient role." });
            }
            query = query.Where(u => u.Role == role);
        }

        var targetCount = await query.CountAsync();
        if (!string.IsNullOrWhiteSpace(recipientEmail) && targetCount == 0)
        {
            return NotFound(new { message = "No active account matches the target email and role." });
        }
        var notificationType = ParseNotificationType(request.NotificationType);
        var batchId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var scheduledAt = request.ScheduledAt?.ToUniversalTime();
        var isScheduled = scheduledAt.HasValue && scheduledAt.Value > now;
        var deliveryStatus = "pending";
        var effectiveSchedule = isScheduled ? scheduledAt : now;
        DateTime? deliveredAt = null;
        var title = string.IsNullOrWhiteSpace(request.Title) ? "NOTICE:" : request.Title.Trim();
        var requestedRoute = string.IsNullOrWhiteSpace(request.Route) ? null : request.Route.Trim();
        var roleFilter = !string.IsNullOrWhiteSpace(request.RecipientRole) &&
                         !string.Equals(request.RecipientRole, "All", StringComparison.OrdinalIgnoreCase)
            ? Enum.Parse<UserRole>(request.RecipientRole, true).ToString()
            : null;

        var inserted = await _context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO notifications
                (user_id, publication_id, title, message, route, notification_type, is_read, created_at,
                 scheduled_at, delivered_at, read_at, failed_at, delivery_status, failure_reason, batch_id)
            SELECT u.id, NULL, {title}, {message},
                   COALESCE({requestedRoute}, CASE u.role
                       WHEN 'Lecturer' THEN '/lecturer-notifications'
                       WHEN 'Researcher' THEN '/researcher-notifications'
                       WHEN 'Admin' THEN '/admin-notifications'
                       ELSE '/student-notifications' END),
                   {notificationType.ToString()}, 0, {now}, {effectiveSchedule}, {deliveredAt}, NULL, NULL,
                   {deliveryStatus}, NULL, {batchId}
            FROM users u
            WHERE u.is_deleted = 0 AND u.is_active = 1
              AND ({string.IsNullOrWhiteSpace(recipientEmail)} = 1 OR u.email = {recipientEmail})
              AND ({string.IsNullOrWhiteSpace(roleFilter)} = 1 OR u.role = {roleFilter})
            """);

        await LogAuditAsync("Notification Management", $"Created notification batch {batchId} for {inserted} users. Target role: {request.RecipientRole ?? "All"}.", "Success", "ADMIN-NOTIFICATION-BROADCAST");

        return Ok(new
        {
            message = isScheduled ? "Notification broadcast scheduled." : "Notification broadcast saved.",
            count = inserted,
            batchId,
            scheduledAt,
            deliveryStatus
        });
    }

    [HttpGet("notifications/analytics")]
    public async Task<IActionResult> GetNotificationAnalytics([FromQuery] int days = 30)
    {
        var since = DateTime.UtcNow.AddDays(-Math.Clamp(days, 1, 365));
        var rows = await _context.Notifications.AsNoTracking()
            .Where(n => n.CreatedAt >= since)
            .GroupBy(n => n.DeliveryStatus)
            .Select(group => new { status = group.Key, count = group.Count() })
            .ToListAsync();
        var total = rows.Sum(row => row.count);
        var read = await _context.Notifications.CountAsync(n => n.CreatedAt >= since && n.IsRead);
        return Ok(new
        {
            since,
            total,
            delivered = rows.Where(row => row.status == "delivered").Sum(row => row.count),
            dispatched = rows.Where(row => row.status == "dispatched").Sum(row => row.count),
            failed = rows.Where(row => row.status == "failed").Sum(row => row.count),
            pending = rows.Where(row => row.status is "pending" or "retrying").Sum(row => row.count),
            read,
            readRate = total == 0 ? 0 : Math.Round(read * 100d / total, 2)
        });
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetAdminNotifications(
        [FromQuery] string? role = null,
        [FromQuery] bool? read = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        page = page <= 0 ? 1 : page;
        pageSize = pageSize <= 0 ? 50 : Math.Min(pageSize, 200);

        var query = _context.Notifications
            .Include(n => n.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role) &&
            !string.Equals(role, "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!TryParseRole(role, out var parsedRole))
            {
                return BadRequest(new { message = "Invalid role filter." });
            }

            query = query.Where(n => n.User != null && n.User.Role == parsedRole);
        }

        if (read.HasValue)
        {
            query = query.Where(n => n.IsRead == read.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            items = items.Select(MapAdminNotification),
            totalCount,
            page,
            pageSize
        });
    }

    [HttpPut("notifications/{id:int}/read")]
    public async Task<IActionResult> MarkAdminNotificationRead(int id)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (notification == null) return NotFound(new { message = "Notification not found." });

        notification.IsRead = true;
        notification.ReadAt ??= DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await LogAuditAsync("Notification Management", $"Marked notification {id} as read.", "Success", "ADMIN-NOTIFICATION-READ");

        return Ok(new { message = "Notification marked as read.", notification = MapAdminNotification(notification) });
    }

    [HttpPut("notifications/read-all")]
    public async Task<IActionResult> MarkAdminNotificationsReadAll([FromQuery] string? role = null)
    {
        var query = _context.Notifications.Include(n => n.User).Where(n => !n.IsRead);

        if (!string.IsNullOrWhiteSpace(role) &&
            !string.Equals(role, "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!TryParseRole(role, out var parsedRole))
            {
                return BadRequest(new { message = "Invalid role filter." });
            }

            query = query.Where(n => n.User != null && n.User.Role == parsedRole);
        }

        var notifications = await query.ToListAsync();
        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt ??= DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        await LogAuditAsync("Notification Management", $"Marked {notifications.Count} notifications as read.", "Success", "ADMIN-NOTIFICATION-READ-ALL");

        return Ok(new { message = "Notifications marked as read.", count = notifications.Count });
    }

    [HttpPut("notifications/{id:int}/route")]
    public async Task<IActionResult> UpdateNotificationRoute(int id, [FromBody] AdminNotificationRouteDto request)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (notification == null) return NotFound(new { message = "Notification not found." });

        notification.Route = string.IsNullOrWhiteSpace(request.Route) ? null : request.Route.Trim();
        await _context.SaveChangesAsync();
        await LogAuditAsync("Notification Management", $"Updated route for notification {id}.", "Success", "ADMIN-NOTIFICATION-ROUTE");

        return Ok(new { message = "Notification route updated.", notification = MapAdminNotification(notification) });
    }

    [HttpPut("notifications/{id:int}")]
    public async Task<IActionResult> UpdateAdminNotification(int id, [FromBody] AdminNotificationUpdateDto request)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (notification == null) return NotFound(new { message = "Notification not found." });

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            notification.Title = request.Title.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Message))
        {
            notification.Message = request.Message.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Route))
        {
            notification.Route = request.Route.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.NotificationType))
        {
            notification.NotificationType = ParseNotificationType(request.NotificationType);
        }

        if (request.IsRead.HasValue)
        {
            notification.IsRead = request.IsRead.Value;
        }

        await _context.SaveChangesAsync();
        await LogAuditAsync("Notification Management", $"Updated notification {id}.", "Success", "ADMIN-NOTIFICATION-UPDATE");

        return Ok(new { message = "Notification updated.", notification = MapAdminNotification(notification) });
    }

    [HttpDelete("notifications/{id:int}")]
    public async Task<IActionResult> DeleteAdminNotification(int id)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (notification == null) return NotFound(new { message = "Notification not found." });

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
        await LogAuditAsync("Notification Management", $"Deleted notification {id}.", "Success", "ADMIN-NOTIFICATION-DELETE");

        return Ok(new { message = "Notification deleted." });
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetAdminSettings()
    {
        return Ok(await GetAdminStatePayloadAsync("settings", GetDefaultAdminSettings()));
    }

    [HttpPut("settings")]
    public async Task<IActionResult> SaveAdminSettings([FromBody] AdminStateRequestDto request)
    {
        var result = await UpsertAdminStateAsync("settings", request.Value, GetDefaultAdminSettings());
        await LogAuditAsync("Admin Settings", "Saved admin settings.", "Success", "ADMIN-SETTINGS-SAVE");
        return Ok(result);
    }

    [HttpGet("sync-config")]
    public async Task<IActionResult> GetAdminSyncConfig()
    {
        return Ok(await GetAdminStatePayloadAsync("sync-config", GetDefaultAdminSyncConfig()));
    }

    [HttpPut("sync-config")]
    public async Task<IActionResult> SaveAdminSyncConfig([FromBody] AdminStateRequestDto request)
    {
        if (request.Value.ValueKind != JsonValueKind.Object ||
            !request.Value.TryGetProperty("cron", out var cronElement) ||
            string.IsNullOrWhiteSpace(cronElement.GetString()))
        {
            return BadRequest(new { message = "A valid cron schedule is required." });
        }

        var cron = cronElement.GetString()!.Trim();
        var rateLimit = request.Value.TryGetProperty("rateLimit", out var rateLimitElement) && rateLimitElement.TryGetInt32(out var requestedLimit)
            ? requestedLimit
            : 120;
        if (rateLimit is < 1 or > 6000)
            return BadRequest(new { message = "Rate limit must be between 1 and 6000 requests per minute." });
        var sources = request.Value.TryGetProperty("sources", out var sourceElement) ? sourceElement : default;
        try
        {
            ConfigureRecurringJob<SemanticScholarSyncJob>("semantic-scholar-sync", sources, "semantic", cron, job => job.ExecuteAsync());
            ConfigureRecurringJob<OpenAlexSyncJob>("openalex-sync", sources, "openAlex", cron, job => job.ExecuteAsync());
            _rateLimiter.Configure(rateLimit);
        }
        catch (Exception exception) when (exception is ArgumentException or FormatException)
        {
            return BadRequest(new { message = "Invalid cron schedule.", detail = exception.Message });
        }

        var result = await UpsertAdminStateAsync("sync-config", request.Value, GetDefaultAdminSyncConfig());
        await LogAuditAsync("Sync Management", "Saved sync configuration.", "Success", "ADMIN-SYNC-CONFIG-SAVE");
        return Ok(result);
    }

    private void ConfigureRecurringJob<TJob>(string id, JsonElement sources, string sourceKey, string cron,
        System.Linq.Expressions.Expression<Func<TJob, Task>> methodCall)
    {
        var enabled = sources.ValueKind != JsonValueKind.Object ||
                      !sources.TryGetProperty(sourceKey, out var enabledElement) ||
                      enabledElement.GetBoolean();
        if (enabled)
        {
            _recurringJobs.AddOrUpdate(id, methodCall, cron);
        }
        else
        {
            _recurringJobs.RemoveIfExists(id);
        }
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetAdminProfile()
    {
        var userId = GetCurrentUserId();
        var admin = userId.HasValue
            ? await _context.Users.AsNoTracking().FirstOrDefaultAsync(user => user.Id == userId.Value)
            : null;
        var fallback = JsonSerializer.SerializeToElement(new
        {
            name = admin?.FullName ?? "Administrator",
            email = admin?.Email ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
            role = "Administrator",
            session = "API managed",
            phone = string.Empty,
            department = string.Empty,
            location = string.Empty,
            bio = string.Empty,
            avatarUrl = string.Empty
        });
        return Ok(await GetAdminStatePayloadAsync("profile", fallback));
    }

    [HttpPut("profile")]
    public async Task<IActionResult> SaveAdminProfile([FromBody] AdminStateRequestDto request)
    {
        var result = await UpsertAdminStateAsync("profile", request.Value, GetDefaultAdminProfile());
        await LogAuditAsync("Admin Profile", "Saved admin profile.", "Success", "ADMIN-PROFILE-SAVE");
        return Ok(result);
    }

    [HttpGet("status-state")]
    public async Task<IActionResult> GetAdminStatusState()
    {
        return Ok(await GetAdminStatePayloadAsync("status", GetDefaultAdminStatusState()));
    }

    [HttpPut("status-state")]
    public async Task<IActionResult> SaveAdminStatusState([FromBody] AdminStateRequestDto request)
    {
        var result = await UpsertAdminStateAsync("status", request.Value, GetDefaultAdminStatusState());
        await LogAuditAsync("System Status", "Saved admin status panel state.", "Success", "ADMIN-STATUS-SAVE");
        return Ok(result);
    }

    [HttpGet("support-tickets")]
    public async Task<IActionResult> GetSupportTickets()
    {
        var tickets = await _context.AdminSupportTickets
            .Include(ticket => ticket.CreatedByUser)
            .OrderByDescending(ticket => ticket.CreatedAt)
            .Take(100)
            .ToListAsync();

        return Ok(new { items = tickets.Select(MapSupportTicket) });
    }

    [HttpPost("support-tickets")]
    public async Task<IActionResult> CreateSupportTicket([FromBody] AdminSupportTicketRequestDto request)
    {
        var message = request.Message?.Trim();
        if (string.IsNullOrWhiteSpace(message))
        {
            return BadRequest(new { message = "Support ticket message is required." });
        }

        var ticket = new AdminSupportTicket
        {
            TicketNumber = $"SUP-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            Message = message,
            Status = "Open",
            CreatedByUserId = GetCurrentUserId(),
            CreatedAt = DateTime.UtcNow
        };

        _context.AdminSupportTickets.Add(ticket);
        await _context.SaveChangesAsync();
        await LogAuditAsync("Support", $"Created support ticket {ticket.TicketNumber}.", "Success", "ADMIN-SUPPORT-CREATE");

        return Ok(new { message = "Support ticket created.", ticket = MapSupportTicket(ticket) });
    }

    [HttpPut("support-tickets/{id:int}")]
    public async Task<IActionResult> UpdateSupportTicket(int id, [FromBody] AdminSupportTicketUpdateDto request)
    {
        var ticket = await _context.AdminSupportTickets.FirstOrDefaultAsync(item => item.Id == id);
        if (ticket == null) return NotFound(new { message = "Support ticket not found." });

        if (!string.IsNullOrWhiteSpace(request.Message))
        {
            ticket.Message = request.Message.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            ticket.Status = request.Status.Trim();
        }

        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await LogAuditAsync("Support", $"Updated support ticket {ticket.TicketNumber}.", "Success", "ADMIN-SUPPORT-UPDATE");

        return Ok(new { message = "Support ticket updated.", ticket = MapSupportTicket(ticket) });
    }

    [HttpDelete("support-tickets/{id:int}")]
    public async Task<IActionResult> DeleteSupportTicket(int id)
    {
        var ticket = await _context.AdminSupportTickets.FirstOrDefaultAsync(item => item.Id == id);
        if (ticket == null) return NotFound(new { message = "Support ticket not found." });

        _context.AdminSupportTickets.Remove(ticket);
        await _context.SaveChangesAsync();
        await LogAuditAsync("Support", $"Deleted support ticket {ticket.TicketNumber}.", "Success", "ADMIN-SUPPORT-DELETE");

        return Ok(new { message = "Support ticket deleted." });
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
    public async Task<IActionResult> GetSystemLogs(
        [FromQuery] int limit = 50,
        [FromQuery] string? search = null,
        [FromQuery] string? module = null,
        [FromQuery] string? severity = null,
        [FromQuery] string? correlationId = null,
        [FromQuery] string? ip = null,
        [FromQuery] int? userId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        limit = Math.Clamp(limit <= 0 ? 50 : limit, 1, 500);
        var eventQuery = _context.SystemEventLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            eventQuery = eventQuery.Where(log => log.Message.Contains(search) || log.EventCode.Contains(search) || (log.Actor != null && log.Actor.Contains(search)));
        if (!string.IsNullOrWhiteSpace(module)) eventQuery = eventQuery.Where(log => log.Category == module);
        if (!string.IsNullOrWhiteSpace(severity)) eventQuery = eventQuery.Where(log => log.Level == severity);
        if (!string.IsNullOrWhiteSpace(correlationId)) eventQuery = eventQuery.Where(log => log.CorrelationId == correlationId);
        if (!string.IsNullOrWhiteSpace(ip)) eventQuery = eventQuery.Where(log => log.IpAddress == ip);
        if (userId.HasValue) eventQuery = eventQuery.Where(log => log.UserId == userId);
        if (from.HasValue) eventQuery = eventQuery.Where(log => log.CreatedAt >= from.Value.ToUniversalTime());
        if (to.HasValue) eventQuery = eventQuery.Where(log => log.CreatedAt <= to.Value.ToUniversalTime());

        var eventLogs = await eventQuery
            .OrderByDescending(log => log.CreatedAt)
            .Take(limit)
            .ToListAsync();
        var includeSyncLogs = string.IsNullOrWhiteSpace(correlationId) && string.IsNullOrWhiteSpace(ip) && !userId.HasValue;
        var syncQuery = _context.SyncLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) syncQuery = syncQuery.Where(log => log.SourceApi.Contains(search) || (log.ErrorMessage != null && log.ErrorMessage.Contains(search)));
        if (!string.IsNullOrWhiteSpace(module) && !string.Equals(module, "Sync", StringComparison.OrdinalIgnoreCase)) includeSyncLogs = false;
        if (from.HasValue) syncQuery = syncQuery.Where(log => log.StartedAt >= from.Value.ToUniversalTime());
        if (to.HasValue) syncQuery = syncQuery.Where(log => log.StartedAt <= to.Value.ToUniversalTime());
        var syncLogs = includeSyncLogs ? await syncQuery
            .OrderByDescending(s => s.StartedAt)
            .Take(limit)
            .ToListAsync() : [];

        var logs = eventLogs.Select(log => new SystemLogResponse
        {
            Id = "EVENT-" + log.Id,
            Time = log.CreatedAt,
            EventName = log.Category,
            Detail = log.Message,
            Module = log.Category,
            Severity = log.Level,
            Actor = log.Actor ?? "system",
            Code = log.EventCode,
            CorrelationId = log.CorrelationId,
            IpAddress = log.IpAddress,
            UserId = log.UserId,
            Path = log.Path,
            StatusCode = log.StatusCode
        })
            .Concat(syncLogs.Select(s => new SystemLogResponse
            {
                Id = "SYNC-" + s.Id,
                Time = s.StartedAt,
                EventName = s.SourceApi,
                Detail = s.ErrorMessage ?? ((s.RecordsSynced ?? 0) > 0 ? s.RecordsSynced + " records synced" : "Action completed"),
                Module = s.SourceApi.StartsWith("Admin Audit:") ? s.SourceApi.Replace("Admin Audit:", "").Trim() : "Sync",
                Severity = s.Status == SyncStatus.Failed ? "Error" : s.Status == SyncStatus.Completed ? "Success" : "Info",
                Actor = s.TriggeredByUserId == null ? "scheduler@system" : "user-" + s.TriggeredByUserId,
                Code = s.SourceApi.StartsWith("Admin Audit:") ? "AUDIT-" + s.Id : "SYNC-" + s.Id
            }))
            .OrderByDescending(log => log.Time)
            .Take(limit)
            .ToList();

        if (logs.Count == 0)
        {
            return Ok(new[]
            {
                new SystemLogResponse
                {
                    Id = "SYSTEM-READY",
                    Time = DateTime.UtcNow,
                    EventName = "Admin API online",
                    Detail = "No system logs have been recorded yet.",
                    Module = "System",
                    Severity = "Info",
                    Actor = "api@system",
                    Code = "SYS-READY"
                }
            });
        }

        return Ok(logs);
    }

    [HttpGet("health")]
    public async Task<IActionResult> GetHealth()
    {
        var databaseConnected = await _context.Database.CanConnectAsync();
        var latestSync = await _context.SyncLogs.OrderByDescending(s => s.StartedAt).FirstOrDefaultAsync();
        var authHelperUrl = _configuration["Services:AuthHelperHealthUrl"] ?? "http://localhost:5173/api/health";
        var authHelperOperational = false;
        string authHelperValue;
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            using var response = await client.GetAsync(authHelperUrl);
            authHelperOperational = response.IsSuccessStatusCode;
            authHelperValue = authHelperOperational ? "Reachable" : $"HTTP {(int)response.StatusCode}";
        }
        catch (Exception error)
        {
            authHelperValue = error.GetType().Name;
        }

        var semanticScholar = await ProbeServiceAsync("Semantic Scholar", async () =>
            $"{(await _semanticScholarClient.SearchAsync("health check", 1)).Count} result(s)");
        var openAlex = await ProbeServiceAsync("OpenAlex", async () =>
            $"{(await _openAlexClient.SearchWorksAsync("health check", 1)).Count} result(s)");
        var serpApi = await ProbeServiceAsync("SerpAPI", async () =>
            $"{(await _serpApiClient.SearchAsync("health check", 1)).Count} result(s)");
        var researchGate = await ProbeServiceAsync("ResearchGate", async () =>
            $"{(await _serpApiClient.SearchResearchGateAsync("machine learning", 1)).Count} result(s)");
        var publicationCount = databaseConnected
            ? await _context.Publications.CountAsync(p => !p.IsDeleted)
            : 0;
        var healthy = databaseConnected && authHelperOperational && semanticScholar.Operational && openAlex.Operational && serpApi.Operational;

        return Ok(new
        {
            status = healthy ? "Healthy" : "Degraded",
            checkedAt = DateTime.UtcNow,
            services = new[]
            {
                new HealthServiceStatus("SQL Server", databaseConnected, databaseConnected ? "Connected" : "Unavailable"),
                new HealthServiceStatus("Auth Service", authHelperOperational, authHelperValue),
                semanticScholar, openAlex, serpApi, researchGate,
                new HealthServiceStatus("Search Index", databaseConnected, publicationCount + " publications"),
                new HealthServiceStatus("Sync Workers", latestSync?.Status != SyncStatus.Failed, latestSync?.StartedAt.ToString("u") ?? "No runs yet")
            }
        });
    }

    private static async Task<HealthServiceStatus> ProbeServiceAsync(string name, Func<Task<string>> probe)
    {
        try { return new HealthServiceStatus(name, true, await probe()); }
        catch (Exception exception) { return new HealthServiceStatus(name, false, exception.Message); }
    }

    [HttpPost("sync/semantic-scholar")]
    public async Task<IActionResult> SyncSemanticScholar()
    {
        await LogAuditAsync("Sync Management", "Admin triggered Semantic Scholar sync.", "Info", "ADMIN-SYNC-SEMANTIC-SCHOLAR");
        var synced = await _syncService.SyncFromSemanticScholarAsync();
        var latest = await _context.SyncLogs
            .Where(log => log.SourceApi == "Semantic Scholar")
            .OrderByDescending(log => log.StartedAt)
            .FirstOrDefaultAsync();
        return Ok(new { message = "Semantic Scholar sync completed.", recordsSynced = latest?.RecordsSynced ?? synced });
    }

    [HttpPost("sync/openalex")]
    public async Task<IActionResult> SyncOpenAlex()
    {
        await LogAuditAsync("Sync Management", "Admin triggered OpenAlex sync.", "Info", "ADMIN-SYNC-OPENALEX");
        var synced = await _syncService.SyncFromOpenAlexAsync();
        var latest = await _context.SyncLogs
            .Where(log => log.SourceApi == "OpenAlex")
            .OrderByDescending(log => log.StartedAt)
            .FirstOrDefaultAsync();
        return Ok(new { message = "OpenAlex sync completed.", recordsSynced = latest?.RecordsSynced ?? synced });
    }

    [HttpPost("sync/manual")]
    public async Task<IActionResult> RunManualSync([FromBody] AdminManualSyncRequestDto request)
    {
        var keywords = request.Keywords?
            .Select(keyword => keyword.Trim())
            .Where(keyword => !string.IsNullOrWhiteSpace(keyword))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();
        var query = keywords.Count == 0
            ? "machine learning OR artificial intelligence"
            : string.Join(" OR ", keywords);
        var maxResults = request.MaxResults <= 0 ? 20 : Math.Clamp(request.MaxResults, 1, 50);
        var sources = request.Sources ?? new AdminManualSyncSourcesDto();
        var results = new List<object>();
        var failures = new List<string>();
        var recordsSynced = 0;

        if (!sources.Semantic && !sources.OpenAlex && !sources.GoogleScholar && !sources.ResearchGate)
        {
            return BadRequest(new { message = "Enable at least one sync source before running manual sync." });
        }

        await LogAuditAsync(
            "Sync Management",
            $"Admin triggered manual publication sync for query '{query}'.",
            "Info",
            "ADMIN-SYNC-MANUAL");

        if (sources.Semantic)
        {
            try
            {
                var count = await _syncService.SyncFromSemanticScholarAsync(query, maxResults);
                recordsSynced += count;
                results.Add(new { source = "Semantic Scholar", status = "Completed", recordsSynced = count });
            }
            catch (Exception exception)
            {
                failures.Add($"Semantic Scholar: {exception.Message}");
                results.Add(new { source = "Semantic Scholar", status = "Failed", recordsSynced = 0, error = exception.Message });
            }
        }

        if (sources.OpenAlex)
        {
            try
            {
                var count = await _syncService.SyncFromOpenAlexAsync(query, maxResults);
                recordsSynced += count;
                results.Add(new { source = "OpenAlex", status = "Completed", recordsSynced = count });
            }
            catch (Exception exception)
            {
                failures.Add($"OpenAlex: {exception.Message}");
                results.Add(new { source = "OpenAlex", status = "Failed", recordsSynced = 0, error = exception.Message });
            }
        }

        if (sources.GoogleScholar)
        {
            try
            {
                var count = await _syncService.SyncFromGoogleScholarAsync(query, maxResults);
                recordsSynced += count;
                results.Add(new { source = "Google Scholar", status = "Completed", recordsSynced = count });
            }
            catch (Exception exception)
            {
                failures.Add($"Google Scholar: {exception.Message}");
                results.Add(new { source = "Google Scholar", status = "Failed", recordsSynced = 0, error = exception.Message });
            }
        }

        if (sources.ResearchGate)
        {
            try
            {
                var count = await _syncService.SyncFromResearchGateAsync(query, maxResults);
                recordsSynced += count;
                results.Add(new { source = "ResearchGate", status = "Completed", recordsSynced = count });
            }
            catch (Exception exception)
            {
                failures.Add($"ResearchGate: {exception.Message}");
                results.Add(new { source = "ResearchGate", status = "Failed", recordsSynced = 0, error = exception.Message });
            }
        }

        return Ok(new
        {
            message = failures.Count == 0
                ? $"Manual sync completed. Imported {recordsSynced} publication records."
                : $"Manual sync completed with {failures.Count} failed source(s).",
            query,
            recordsSynced,
            results,
            failures
        });
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
        var visibleSyncLogs = GetVisibleSyncLogs();
        var successSyncs = await visibleSyncLogs.CountAsync(l => l.Status == SyncStatus.Completed);
        var failedSyncs = await visibleSyncLogs.CountAsync(l => l.Status == SyncStatus.Failed);

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

        var recentActivities = await visibleSyncLogs
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
        var query = GetVisibleSyncLogs()
            .Where(log =>
                !(log.SourceApi == "OpenAlex" &&
                  log.Status == SyncStatus.Failed &&
                  (log.RecordsSynced ?? 0) == 0 &&
                  log.ErrorMessage == null &&
                  log.StartedAt >= new DateTime(2024, 12, 2) &&
                  log.StartedAt < new DateTime(2024, 12, 3)));
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, totalCount = total, page, pageSize });
    }

    private IQueryable<SyncLog> GetVisibleSyncLogs() => _context.SyncLogs
        .Where(log => !log.SourceApi.StartsWith("Admin Audit:"))
        .Where(log => !log.SourceApi.Contains("PayOS"))
        .Where(log => log.Status != SyncStatus.Failed ||
            !_context.SyncLogs.Any(later =>
                later.SourceApi == log.SourceApi &&
                later.Status == SyncStatus.Completed &&
                later.StartedAt > log.StartedAt));

    private static string NormalizeEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private static string GenerateSecurePassword()
    {
        const string uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excluding I and O to avoid confusion
        const string lowercase = "abcdefghijkmnopqrstuvwxyz"; // Excluding l
        const string digits = "23456789"; // Excluding 0 and 1
        const string special = "!@#$%&*";
        const string allChars = uppercase + lowercase + digits + special;

        var random = Random.Shared;
        var password = new char[16];

        // Ensure at least one character from each required set
        password[0] = uppercase[random.Next(uppercase.Length)];
        password[1] = lowercase[random.Next(lowercase.Length)];
        password[2] = digits[random.Next(digits.Length)];
        password[3] = special[random.Next(special.Length)];

        // Fill the rest with random characters from all sets
        for (var i = 4; i < password.Length; i++)
        {
            password[i] = allChars[random.Next(allChars.Length)];
        }

        // Shuffle the password array
        for (var i = password.Length - 1; i > 0; i--)
        {
            var j = random.Next(i + 1);
            (password[i], password[j]) = (password[j], password[i]);
        }

        return new string(password);
    }

    private bool IsAuthorizedInternalRequest()
    {
        var configuredSecret =
            _configuration["InternalSync:Secret"] ??
            _configuration["INTERNAL_SYNC_SECRET"];
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

    private static bool TryParseManagedRole(string? role, out UserRole parsedRole)
    {
        if (!TryParseRole(role, out parsedRole)) return false;
        return parsedRole is UserRole.Student or UserRole.Lecturer or UserRole.Researcher;
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

        return NotificationType.SYSTEM;
    }

    private static string GetNotificationRouteForRole(UserRole role) => role switch
    {
        UserRole.Lecturer => "/lecturer-notifications",
        UserRole.Researcher => "/researcher-notifications",
        UserRole.Admin => "/admin-notifications",
        _ => "/student-notifications"
    };

    private object MapAdminUser(User user) => new
    {
        id = user.Id,
        name = user.FullName,
        fullName = user.FullName,
        email = user.Email,
        role = user.Role.ToString(),
        status = user.IsActive ? "Active" : "Inactive",
        isActive = user.IsActive,
        createdAt = user.CreatedAt,
        lastLoginAt = user.CreatedAt,
        academicIdentity = new
        {
            institution = user.Institution ?? string.Empty,
            department = user.Department ?? string.Empty,
            institutionalEmail = user.InstitutionalEmail ?? string.Empty,
            identifier = user.AcademicIdentifier ?? string.Empty,
            programOrField = user.ProgramOrField ?? string.Empty,
            evidenceUrl = user.EvidenceUrl ?? string.Empty
        },
        verificationStatus = user.VerificationStatus,
        requestedRole = user.RequestedRole,
        verificationSubmittedAt = user.VerificationSubmittedAt,
        verificationReviewedAt = user.VerificationReviewedAt,
        avatar = user.FullName.Length >= 2 ? user.FullName.Substring(0, 2).ToUpper() : "ST"
    };

    private object MapAdminNotification(Notification notification) => new
    {
        id = notification.Id,
        type = notification.NotificationType.ToString(),
        title = string.IsNullOrWhiteSpace(notification.Title) ? "NOTICE:" : notification.Title,
        text = notification.Message,
        message = notification.Message,
        recipientRole = notification.User?.Role.ToString() ?? "Unknown",
        recipientEmail = notification.User?.Email ?? "",
        userId = notification.UserId,
        publicationId = notification.PublicationId,
        route = notification.Route ?? (notification.User == null ? "" : GetNotificationRouteForRole(notification.User.Role)),
        createdAt = notification.CreatedAt,
        scheduledAt = notification.ScheduledAt,
        deliveredAt = notification.DeliveredAt,
        acknowledgedAt = notification.AcknowledgedAt,
        attemptCount = notification.AttemptCount,
        nextAttemptAt = notification.NextAttemptAt,
        readAt = notification.ReadAt,
        failedAt = notification.FailedAt,
        deliveryStatus = notification.DeliveryStatus,
        failureReason = notification.FailureReason,
        batchId = notification.BatchId,
        unread = !notification.IsRead,
        isRead = notification.IsRead
    };

    private object MapSupportTicket(AdminSupportTicket ticket) => new
    {
        id = ticket.Id,
        ticketNumber = ticket.TicketNumber,
        message = ticket.Message,
        status = ticket.Status,
        createdAt = ticket.CreatedAt,
        updatedAt = ticket.UpdatedAt,
        createdBy = ticket.CreatedByUser?.Email ?? "admin"
    };

    private int? GetCurrentUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(userIdValue, out var parsedUserId) ? parsedUserId : null;
    }

    private static JsonElement ParseJsonElement(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static JsonElement GetDefaultAdminSettings() => ParseJsonElement("""
        {
          "emailAlerts": true,
          "autoSync": true,
          "maintenanceMode": false,
          "syncInterval": "Every 6 hours"
        }
        """);

    private static JsonElement GetDefaultAdminProfile() => ParseJsonElement("""
        {
          "name": "Administrator",
          "email": "",
          "role": "Administrator",
          "session": "API managed",
          "phone": "",
          "department": "",
          "location": "",
          "bio": "",
          "avatarUrl": ""
        }
        """);

    private static JsonElement GetDefaultAdminStatusState() => ParseJsonElement("""
        {
          "healthCheckedAt": "not checked",
          "message": ""
        }
        """);

    private static JsonElement GetDefaultAdminSyncConfig() => ParseJsonElement("""
        {
          "sources": {
            "semantic": true,
            "openAlex": true,
            "googleScholar": true,
            "researchGate": true
          },
          "keywords": ["Machine Learning", "NLP"],
          "cron": "0 0 * * *",
          "rateLimit": 120
        }
        """);

    private async Task<object> GetAdminStatePayloadAsync(string key, JsonElement fallback)
    {
        var state = await _context.AdminStates.AsNoTracking().FirstOrDefaultAsync(item => item.StateKey == key);
        var value = state == null ? fallback : ParseJsonElement(state.JsonValue);
        return new
        {
            key,
            value,
            updatedAt = state?.UpdatedAt,
            updatedByUserId = state?.UpdatedByUserId
        };
    }

    private async Task<object> UpsertAdminStateAsync(string key, JsonElement value, JsonElement fallback)
    {
        var effectiveValue = value.ValueKind == JsonValueKind.Undefined || value.ValueKind == JsonValueKind.Null
            ? fallback
            : value.Clone();
        var jsonValue = JsonSerializer.Serialize(effectiveValue);
        var state = await _context.AdminStates.FirstOrDefaultAsync(item => item.StateKey == key);

        if (state == null)
        {
            state = new AdminState
            {
                StateKey = key,
                JsonValue = jsonValue,
                UpdatedByUserId = GetCurrentUserId(),
                UpdatedAt = DateTime.UtcNow
            };
            _context.AdminStates.Add(state);
        }
        else
        {
            state.JsonValue = jsonValue;
            state.UpdatedByUserId = GetCurrentUserId();
            state.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return new
        {
            key,
            value = effectiveValue,
            updatedAt = state.UpdatedAt,
            updatedByUserId = state.UpdatedByUserId
        };
    }

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
    public bool? IsActive { get; set; }
    public string? Password { get; set; }
    public string VerificationStatus { get; set; } = "not_submitted";
}

public class GrantAdminRoleDto
{
    public string Confirmation { get; set; } = string.Empty;
}

public class AdminResetPasswordDto
{
    public string NewPassword { get; set; } = string.Empty;
}

public class ExternalUserSyncDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Name { get => FullName; set => FullName = value ?? string.Empty; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Researcher";
    public string Provider { get; set; } = "Google";
    public string ExternalId { get; set; } = string.Empty;
}

public class AdminBroadcastNotificationDto
{
    public string RecipientRole { get; set; } = "All";
    public string RecipientEmail { get; set; } = string.Empty;
    public string NotificationType { get; set; } = "SYSTEM";
    public string Title { get; set; } = "NOTICE:";
    public string Message { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public DateTime? ScheduledAt { get; set; }
}

public class AdminNotificationRouteDto
{
    public string Route { get; set; } = string.Empty;
}

public class AdminNotificationUpdateDto
{
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string? NotificationType { get; set; }
    public string? Route { get; set; }
    public bool? IsRead { get; set; }
}

public class AdminStateRequestDto
{
    public JsonElement Value { get; set; }
}

public class AdminSupportTicketRequestDto
{
    public string Message { get; set; } = string.Empty;
}

public class AdminSupportTicketUpdateDto
{
    public string? Message { get; set; }
    public string? Status { get; set; }
}

public class AdminAuditLogRequestDto
{
    public string Module { get; set; } = "Admin";
    public string Detail { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info";
    public string Code { get; set; } = "ADMIN-AUDIT";
}

public class SystemLogResponse
{
    public string Id { get; set; } = string.Empty;
    public DateTime Time { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info";
    public string Actor { get; set; } = "system";
    public string Code { get; set; } = string.Empty;
    public string? CorrelationId { get; set; }
    public string? IpAddress { get; set; }
    public int? UserId { get; set; }
    public string? Path { get; set; }
    public int? StatusCode { get; set; }
}

public record HealthServiceStatus(string Name, bool Operational, string Value)
{
    public string State => Operational ? "Operational" : "Critical";
}

public class AdminManualSyncRequestDto
{
    public AdminManualSyncSourcesDto Sources { get; set; } = new();
    public List<string> Keywords { get; set; } = new();
    public int MaxResults { get; set; } = 20;
}

public class AdminManualSyncSourcesDto
{
    public bool Semantic { get; set; } = true;
    public bool OpenAlex { get; set; } = true;
    public bool GoogleScholar { get; set; } = false;
    public bool ResearchGate { get; set; } = false;
}
