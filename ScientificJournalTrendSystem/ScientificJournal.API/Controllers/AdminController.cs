using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.API.Filters;
using ScientificJournal.API.Services;
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
    private readonly PayosMerchantClient _payosClient;

    public AdminController(
        ISyncService syncService,
        ITrendingService trendingService,
        AppDbContext context,
        IConfiguration configuration,
        PayosMerchantClient payosClient)
    {
        _syncService = syncService;
        _trendingService = trendingService;
        _context = context;
        _configuration = configuration;
        _payosClient = payosClient;
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
                new { label = "Semantic Scholar", value = "Ready via Graph API" },
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
                plan = string.IsNullOrWhiteSpace(u.Plan) ? (u.IsPro ? "Pro" : "Free") : u.Plan,
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
            Plan = string.Equals(request.Plan, "Pro", StringComparison.OrdinalIgnoreCase) || request.IsPro == true ? "Pro" : "Free",
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
                Plan = string.Equals(request.Plan, "Pro", StringComparison.OrdinalIgnoreCase) || request.IsPro == true ? "Pro" : "Free",
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            await LogAuditAsync("User Management", $"Synced external {request.Provider ?? "OAuth"} user {user.Email}.", "Success", "ADMIN-USER-SYNC");

            return Ok(new { message = "External user synced.", user = MapAdminUser(user) });
        }

        user.FullName = fullName;
        user.IsActive = true;
        user.IsDeleted = false;
        user.IsEmailVerified = true;
        if (request.IsPro == true || string.Equals(request.Plan, "Pro", StringComparison.OrdinalIgnoreCase))
        {
            user.IsPro = true;
            user.Plan = "Pro";
        }

        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Refreshed external {request.Provider ?? "OAuth"} user {user.Email}.", "Success", "ADMIN-USER-SYNC");

        return Ok(new { message = "External user refreshed.", user = MapAdminUser(user) });
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
        user.Plan = user.IsPro ? "Pro" : "Free";
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
        user.Plan = user.IsPro ? "Pro" : "Free";
        await _context.SaveChangesAsync();
        await LogAuditAsync("User Management", $"Set Pro status for {user.Email} to {user.IsPro}.", "Success", "ADMIN-USER-PRO");

        return Ok(new { message = $"User premium status updated. IsPro: {user.IsPro}", user = MapAdminUser(user), isPro = user.IsPro });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _context.PaymentTransactions
            .Include(payment => payment.User)
            .OrderByDescending(payment => payment.CreatedAt)
            .ToListAsync();

        return Ok(new { items = payments.Select(MapAdminPayment) });
    }

    [HttpPost("payments/{orderCode:long}/verify")]
    public async Task<IActionResult> VerifyPayment(long orderCode)
    {
        var payment = await _context.PaymentTransactions
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.OrderCode == orderCode);

        if (payment == null)
        {
            return NotFound(new { message = "Payment not found." });
        }

        var payosPayment = await _payosClient.GetPaymentInformationAsync(orderCode);
        payment.Status = payosPayment.Status.ToUpperInvariant();
        payment.PayosReference = payosPayment.GetFirstTransactionReference() ?? payment.PayosReference;
        payment.UpdatedAt = DateTime.UtcNow;

        if (payment.Status == "PAID" && payosPayment.AmountPaid >= payment.Amount && payment.User != null)
        {
            payment.PaidAt ??= DateTime.UtcNow;
            payment.User.IsPro = true;
            payment.User.Plan = "Pro";
            await LogAuditAsync("Payment Management", $"Verified PayOS payment {payment.OrderCode}; activated Pro for {payment.User.Email}.", "Success", "ADMIN-PAYOS-VERIFY");
        }

        await _context.SaveChangesAsync();
        return Ok(new { payment = MapAdminPayment(payment) });
    }

    [HttpPost("payments/{orderCode:long}/cancel")]
    public async Task<IActionResult> CancelPayment(long orderCode)
    {
        var payment = await _context.PaymentTransactions
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.OrderCode == orderCode);

        if (payment == null)
        {
            return NotFound(new { message = "Payment not found." });
        }

        if (string.Equals(payment.Status, "PAID", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new { message = "Paid payments cannot be cancelled." });
        }

        if (!string.Equals(payment.Status, "EXPIRED", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(payment.Status, "FAILED", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(payment.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
        {
            await _payosClient.CancelPaymentLinkAsync(orderCode, "Cancelled by admin");
        }

        payment.Status = "CANCELLED";
        payment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await LogAuditAsync("Payment Management", $"Cancelled PayOS payment {payment.OrderCode} for {payment.UserEmail}.", "Success", "ADMIN-PAYOS-CANCEL");

        return Ok(new { payment = MapAdminPayment(payment) });
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
            User = user,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "NOTICE:" : request.Title.Trim(),
            Message = message,
            Route = string.IsNullOrWhiteSpace(request.Route) ? GetNotificationRouteForRole(user.Role) : request.Route.Trim(),
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
            items = notifications.Select(MapAdminNotification)
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

    [HttpGet("profile")]
    public async Task<IActionResult> GetAdminProfile()
    {
        return Ok(await GetAdminStatePayloadAsync("profile", GetDefaultAdminProfile()));
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
        await LogAuditAsync("Sync Management", "Admin triggered Semantic Scholar sync.", "Info", "ADMIN-SYNC-SEMANTIC-SCHOLAR");
        await _syncService.SyncFromSemanticScholarAsync();
        var latest = await _context.SyncLogs
            .Where(log => log.SourceApi == "Semantic Scholar")
            .OrderByDescending(log => log.StartedAt)
            .FirstOrDefaultAsync();
        return Ok(new { message = "Semantic Scholar sync completed.", recordsSynced = latest?.RecordsSynced ?? 0 });
    }

    [HttpPost("sync/openalex")]
    public async Task<IActionResult> SyncOpenAlex()
    {
        await LogAuditAsync("Sync Management", "Admin triggered OpenAlex sync.", "Info", "ADMIN-SYNC-OPENALEX");
        await _syncService.SyncFromOpenAlexAsync();
        var latest = await _context.SyncLogs
            .Where(log => log.SourceApi == "OpenAlex")
            .OrderByDescending(log => log.StartedAt)
            .FirstOrDefaultAsync();
        return Ok(new { message = "OpenAlex sync completed.", recordsSynced = latest?.RecordsSynced ?? 0 });
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
        isPro = user.IsPro,
        plan = string.IsNullOrWhiteSpace(user.Plan) ? (user.IsPro ? "Pro" : "Free") : user.Plan,
        searchAccuracy = PlanPolicy.GetSearchAccuracy(user.Role, user.IsPro),
        createdAt = user.CreatedAt,
        lastLoginAt = user.CreatedAt,
        avatar = user.FullName.Length >= 2 ? user.FullName.Substring(0, 2).ToUpper() : "ST"
    };

    private object MapAdminPayment(PaymentTransaction payment) => new
    {
        orderCode = payment.OrderCode,
        paymentLinkId = payment.PaymentLinkId,
        checkoutUrl = payment.CheckoutUrl,
        billingCycle = payment.BillingCycle,
        plan = payment.Plan,
        priceLabel = payment.BillingCycle == "monthly" ? "$5 / month" : "$49 / year",
        status = payment.Status,
        email = payment.UserEmail,
        userName = payment.User?.FullName ?? payment.UserEmail,
        role = payment.User?.Role.ToString() ?? "Researcher",
        createdAt = payment.CreatedAt,
        expiresAt = payment.ExpiresAt,
        expiresInSeconds = payment.ExpiresAt.HasValue
            ? Math.Max(0, (int)Math.Floor((payment.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds))
            : 0,
        updatedAt = payment.UpdatedAt
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
          "name": "Admin User",
          "email": "admin@university.edu",
          "role": "Administrator",
          "session": "API managed",
          "phone": "+84 901 234 567",
          "department": "System Administration",
          "location": "Ho Chi Minh City",
          "bio": "Manages ScholarTrend access, sync operations, and platform health.",
          "avatarUrl": ""
        }
        """);

    private static JsonElement GetDefaultAdminStatusState() => ParseJsonElement("""
        {
          "healthCheckedAt": "not checked",
          "message": ""
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
    public string Title { get; set; } = "NOTICE:";
    public string Message { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
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
