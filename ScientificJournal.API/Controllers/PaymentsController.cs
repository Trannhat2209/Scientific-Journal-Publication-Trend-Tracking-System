using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Common.Policies;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public PaymentsController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("payos/activate-pro")]
    public async Task<IActionResult> ActivatePro([FromBody] PayosActivateProRequest request)
    {
        if (!IsAuthorizedInternalRequest())
        {
            return Unauthorized(new { message = "Invalid payment sync secret." });
        }

        var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);
        if (user == null)
        {
            return NotFound(new { message = "User was not found in SQL Server." });
        }

        user.IsPro = true;

        string? roleChangeNote = null;
        if (!string.IsNullOrWhiteSpace(request.TargetRole) &&
            Enum.TryParse<UserRole>(request.TargetRole, true, out var targetRole) &&
            (targetRole == UserRole.Researcher || targetRole == UserRole.Lecturer) &&
            user.Role != targetRole)
        {
            roleChangeNote = $" Role upgraded from {user.Role} to {targetRole}.";
            user.Role = targetRole;
        }

        await _context.SaveChangesAsync();

        _context.SyncLogs.Add(new SyncLog
        {
            TriggeredByUserId = user.Id,
            SourceApi = "Admin Audit: Payment Management",
            Status = SyncStatus.Completed,
            ErrorMessage = $"PAYOS-PAID: PayOS payment {request.OrderCode} activated Pro for {user.Email}.{roleChangeNote}",
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FullName,
            Role = user.Role.ToString(),
            user.IsPro,
            Plan = "Pro",
            SearchAccuracy = PlanPolicy.GetSearchAccuracy(user.Role, user.HasProAccess())
        });
    }

    private bool IsAuthorizedInternalRequest()
    {
        var configuredSecret =
            _configuration["Payments:InternalSyncSecret"] ??
            _configuration["PAYMENT_SYNC_SECRET"];
        var providedSecret = Request.Headers["X-Internal-Secret"].FirstOrDefault();
        return !string.IsNullOrWhiteSpace(configuredSecret) &&
               string.Equals(configuredSecret, providedSecret, StringComparison.Ordinal);
    }
}

public class PayosActivateProRequest
{
    public string Email { get; set; } = string.Empty;
    public string BillingCycle { get; set; } = string.Empty;
    public long OrderCode { get; set; }
    public string PaymentLinkId { get; set; } = string.Empty;

    /// <summary>
    /// The plan being purchased: "Researcher" or "Lecturer". Buying one of these plans
    /// upgrades the user's Role, not just their IsPro flag — Role is no longer something
    /// users choose for free at registration, it's what you get by buying the matching plan.
    /// Leave empty/omit to just activate Pro on the user's current role.
    /// </summary>
    public string? TargetRole { get; set; }
}
