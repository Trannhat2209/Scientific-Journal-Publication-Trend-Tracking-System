using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.API.Services;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Helpers;
using ScientificJournal.Common.Policies;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PayosMerchantClient _payosClient;

    public PaymentsController(
        AppDbContext context,
        IConfiguration configuration,
        PayosMerchantClient payosClient)
    {
        _context = context;
        _configuration = configuration;
        _payosClient = payosClient;
    }

    [HttpPost("payos/create")]
    public async Task<IActionResult> CreatePayosCheckout([FromBody] CreateProPaymentRequest request)
    {
        var user = await ResolvePaymentUserAsync(request.User);
        if (user == null)
        {
            return Unauthorized(new { error = "Please sign in before upgrading to Pro." });
        }

        if (user.IsPro || string.Equals(user.Plan, "Pro", StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new
            {
                alreadyPro = true,
                user = MapUser(user),
                message = "This account is already on the Pro plan."
            });
        }

        var billingCycle = string.Equals(request.BillingCycle, "monthly", StringComparison.OrdinalIgnoreCase)
            ? "monthly"
            : "yearly";
        var amount = billingCycle == "monthly" ? PlanPolicy.MonthlyAmountVnd : PlanPolicy.YearlyAmountVnd;
        var orderCode = await GenerateOrderCodeAsync();
        var expiresAtUnix = DateTimeOffset.UtcNow.AddSeconds(GetPaymentTtlSeconds()).ToUnixTimeSeconds();
        var frontendUrl = GetFrontendUrl();
        var returnUrl = $"{frontendUrl}/payment-return?provider=payos&orderCode={orderCode}";
        var cancelUrl = $"{frontendUrl}/payment-return?provider=payos&orderCode={orderCode}&cancelled=1";
        var description = billingCycle == "monthly" ? "STPROMO" : "STPROYR";

        var paymentLink = await _payosClient.CreatePaymentLinkAsync(new CreatePayosPaymentLinkRequest
        {
            OrderCode = orderCode,
            Amount = amount,
            Description = description,
            BuyerName = user.FullName,
            BuyerEmail = user.Email,
            CancelUrl = cancelUrl,
            ReturnUrl = returnUrl,
            ExpiredAt = checked((int)expiresAtUnix),
            Items =
            {
                new PayosPaymentItem
                {
                    Name = billingCycle == "monthly" ? "ScholarTrend Pro Monthly" : "ScholarTrend Pro Yearly",
                    Quantity = 1,
                    Price = amount
                }
            }
        });

        var payment = new PaymentTransaction
        {
            OrderCode = orderCode,
            PaymentLinkId = paymentLink.PaymentLinkId,
            CheckoutUrl = paymentLink.CheckoutUrl,
            UserId = user.Id,
            UserEmail = user.Email,
            BillingCycle = billingCycle,
            Plan = "Pro",
            Amount = amount,
            Currency = "VND",
            Description = description,
            Status = string.IsNullOrWhiteSpace(paymentLink.Status) ? "PENDING" : paymentLink.Status,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTimeOffset.FromUnixTimeSeconds(expiresAtUnix).UtcDateTime
        };

        _context.PaymentTransactions.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(MapPayment(payment));
    }

    [HttpGet("payos/verify")]
    public async Task<IActionResult> VerifyPayosPayment([FromQuery] long orderCode)
    {
        if (orderCode <= 0)
        {
            return BadRequest(new { error = "orderCode is required." });
        }

        var payment = await _context.PaymentTransactions
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.OrderCode == orderCode);

        if (payment == null)
        {
            return NotFound(new { error = "Payment was not found." });
        }

        var payosPayment = await _payosClient.GetPaymentInformationAsync(orderCode);
        await SyncPaymentStatusAsync(payment, payosPayment.Status, payosPayment.AmountPaid, payosPayment.GetFirstTransactionReference());

        return Ok(MapPayment(payment, payment.User));
    }

    [HttpPost("payos/webhook")]
    public async Task<IActionResult> PayosWebhook([FromBody] JsonElement payload)
    {
        if (!_payosClient.VerifyWebhookSignature(payload))
        {
            return BadRequest(new { message = "Invalid PayOS webhook signature." });
        }

        var data = payload.GetProperty("data");
        var orderCode = GetJsonLong(data, "orderCode");
        var amount = GetJsonInt(data, "amount");
        var reference = GetJsonString(data, "reference");
        var success = payload.TryGetProperty("success", out var successElement) &&
                      successElement.ValueKind == JsonValueKind.True;
        var code = GetJsonString(payload, "code");
        var dataCode = GetJsonString(data, "code");

        var payment = await _context.PaymentTransactions
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.OrderCode == orderCode);

        if (payment == null)
        {
            return Ok(new { ok = true, ignored = true });
        }

        payment.RawWebhookJson = payload.GetRawText();
        var paid = success || code == "00" || dataCode == "00";
        var nextStatus = paid && amount >= payment.Amount ? "PAID" : payment.Status;
        await SyncPaymentStatusAsync(payment, nextStatus, amount, reference);

        return Ok(new { ok = true });
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

        var payment = request.OrderCode > 0
            ? await _context.PaymentTransactions.FirstOrDefaultAsync(p => p.OrderCode == request.OrderCode)
            : null;

        if (payment == null && request.OrderCode > 0)
        {
            payment = new PaymentTransaction
            {
                OrderCode = request.OrderCode,
                PaymentLinkId = request.PaymentLinkId,
                UserId = user.Id,
                UserEmail = user.Email,
                BillingCycle = string.Equals(request.BillingCycle, "monthly", StringComparison.OrdinalIgnoreCase) ? "monthly" : "yearly",
                Amount = string.Equals(request.BillingCycle, "monthly", StringComparison.OrdinalIgnoreCase)
                    ? PlanPolicy.MonthlyAmountVnd
                    : PlanPolicy.YearlyAmountVnd,
                Description = "External PayOS sync",
                Status = "PAID",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.PaymentTransactions.Add(payment);
        }
        else if (payment != null)
        {
            payment.Status = "PAID";
            payment.PaidAt ??= DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        await ActivateUserProAsync(user, request.OrderCode, request.PaymentLinkId);
        await _context.SaveChangesAsync();
        return Ok(MapUser(user));
    }

    private async Task<User?> ResolvePaymentUserAsync(PaymentUserDto? requestUser)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (int.TryParse(userIdValue, out var userId))
        {
            var userFromClaim = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);
            if (userFromClaim != null) return userFromClaim;
        }

        var email = (User.FindFirstValue(ClaimTypes.Email) ?? requestUser?.Email ?? string.Empty)
            .Trim()
            .ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);
        if (existingUser != null)
        {
            return existingUser;
        }

        var role = ParseRole(requestUser?.Role);
        var newUser = new User
        {
            Email = email,
            FullName = string.IsNullOrWhiteSpace(requestUser?.Name) ? email : requestUser.Name.Trim(),
            PasswordHash = PasswordHasher.HashPassword(Guid.NewGuid().ToString("N")),
            Role = role,
            IsActive = true,
            IsDeleted = false,
            IsEmailVerified = true,
            IsPro = false,
            Plan = "Free",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();
        return newUser;
    }

    private async Task SyncPaymentStatusAsync(PaymentTransaction payment, string? status, int amountPaid, string? reference)
    {
        var normalizedStatus = string.IsNullOrWhiteSpace(status) ? payment.Status : status.ToUpperInvariant();

        if (payment.ExpiresAt <= DateTime.UtcNow && normalizedStatus is "PENDING" or "PROCESSING")
        {
            normalizedStatus = "EXPIRED";
        }

        payment.Status = normalizedStatus;
        payment.PayosReference = reference ?? payment.PayosReference;
        payment.UpdatedAt = DateTime.UtcNow;

        if (normalizedStatus == "PAID" && payment.User != null && amountPaid >= payment.Amount)
        {
            await ActivateUserProAsync(payment.User, payment.OrderCode, payment.PaymentLinkId);
            payment.PaidAt ??= DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private async Task ActivateUserProAsync(User user, long orderCode, string? paymentLinkId)
    {
        var wasPro = user.IsPro || string.Equals(user.Plan, "Pro", StringComparison.OrdinalIgnoreCase);
        user.IsPro = true;
        user.Plan = "Pro";

        if (!wasPro)
        {
            _context.SyncLogs.Add(new SyncLog
            {
                TriggeredByUserId = user.Id,
                SourceApi = "PayOS",
                Status = SyncStatus.Completed,
                ErrorMessage = $"PAYOS-PAID: PayOS payment {orderCode} ({paymentLinkId}) activated Pro for {user.Email}.",
                StartedAt = DateTime.UtcNow,
                FinishedAt = DateTime.UtcNow
            });
        }

        await Task.CompletedTask;
    }

    private async Task<long> GenerateOrderCodeAsync()
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var timestampPart = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000_000_000;
            var orderCode = (timestampPart * 100) + Random.Shared.Next(10, 99);
            if (!await _context.PaymentTransactions.AnyAsync(p => p.OrderCode == orderCode))
            {
                return orderCode;
            }
        }

        throw new InvalidOperationException("Could not generate a unique PayOS order code.");
    }

    private int GetPaymentTtlSeconds()
    {
        var policySeconds = PlanPolicy.CheckoutHoldMinutes * 60;
        if (policySeconds > 0)
        {
            return policySeconds;
        }

        var configured = _configuration.GetValue<int?>("Payments:PendingTtlSeconds");
        return configured is > 0 ? configured.Value : 900;
    }

    private string GetFrontendUrl()
    {
        var configured =
            _configuration["Payments:FrontendUrl"] ??
            _configuration["FRONTEND_URL"] ??
            $"{Request.Scheme}://{Request.Host}";
        return configured.TrimEnd('/');
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

    private static UserRole ParseRole(string? role)
    {
        var normalized = string.Equals(role, "Administrator", StringComparison.OrdinalIgnoreCase) ? "Admin" : role;
        return Enum.TryParse<UserRole>(normalized, true, out var parsed) ? parsed : UserRole.Researcher;
    }

    private static long GetJsonLong(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property)) return 0;
        if (property.ValueKind == JsonValueKind.Number && property.TryGetInt64(out var value)) return value;
        return long.TryParse(property.GetString(), out var parsed) ? parsed : 0;
    }

    private static int GetJsonInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property)) return 0;
        if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out var value)) return value;
        return int.TryParse(property.GetString(), out var parsed) ? parsed : 0;
    }

    private static string? GetJsonString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var property) ? property.GetString() : null;

    private object MapPayment(PaymentTransaction payment, User? user = null) => new
    {
        payment.OrderCode,
        payment.PaymentLinkId,
        payment.CheckoutUrl,
        payment.BillingCycle,
        payment.Plan,
        payment.Amount,
        payment.Currency,
        payment.Status,
        payment.CreatedAt,
        payment.ExpiresAt,
        payment.PaidAt,
        payment.UpdatedAt,
        ExpiresInSeconds = payment.ExpiresAt.HasValue
            ? Math.Max(0, (int)Math.Floor((payment.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds))
            : 0,
        User = user == null ? null : MapUser(user)
    };

    private static object MapUser(User user) => new
    {
        user.Id,
        user.Email,
        user.FullName,
        Role = user.Role.ToString(),
        user.IsPro,
        Plan = string.IsNullOrWhiteSpace(user.Plan) ? (user.IsPro ? "Pro" : "Free") : user.Plan,
        SearchAccuracy = PlanPolicy.GetSearchAccuracy(user.Role, user.IsPro)
    };
}

public class CreateProPaymentRequest
{
    public string BillingCycle { get; set; } = "yearly";
    public PaymentUserDto? User { get; set; }
}

public class PaymentUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FullName { get => Name; set => Name = value; }
    public string Role { get; set; } = "Researcher";
}

public class PayosActivateProRequest
{
    public string Email { get; set; } = string.Empty;
    public string BillingCycle { get; set; } = string.Empty;
    public long OrderCode { get; set; }
    public string PaymentLinkId { get; set; } = string.Empty;
}
