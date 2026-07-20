using Microsoft.EntityFrameworkCore;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.API.Services;

public sealed class PaymentReconciliationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentReconciliationWorker> _logger;

    public PaymentReconciliationWorker(IServiceScopeFactory scopeFactory, IConfiguration configuration, ILogger<PaymentReconciliationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var minutes = Math.Clamp(_configuration.GetValue("Payments:ReconciliationMinutes", 5), 1, 1440);
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(minutes));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { await ReconcileAsync(stoppingToken); }
            catch (Exception exception) { _logger.LogError(exception, "Automatic PayOS reconciliation failed."); }
        }
    }

    private async Task ReconcileAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var payos = scope.ServiceProvider.GetRequiredService<PayosMerchantClient>();
        var payments = await context.PaymentTransactions.Include(p => p.User)
            .Where(p => p.Status == "PENDING" || p.Status == "PROCESSING")
            .OrderBy(p => p.CreatedAt).Take(50).ToListAsync(cancellationToken);
        var reconciledCount = 0;

        foreach (var payment in payments)
        {
            await Task.Delay(TimeSpan.FromMilliseconds(350), cancellationToken);
            try
            {
                var remote = await payos.GetPaymentInformationAsync(payment.OrderCode);
                payment.Status = string.IsNullOrWhiteSpace(remote.Status) ? payment.Status : remote.Status.ToUpperInvariant();
                payment.PayosReference = remote.GetFirstTransactionReference() ?? payment.PayosReference;
                payment.UpdatedAt = DateTime.UtcNow;
                reconciledCount++;
                if (payment.Status == "PAID" && remote.AmountPaid >= payment.Amount && payment.User != null)
                {
                    payment.PaidAt ??= DateTime.UtcNow;
                    payment.User.IsPro = true;
                    payment.User.Plan = "Pro";
                    payment.User.Role = payment.Description.Contains("Lecturer", StringComparison.OrdinalIgnoreCase)
                        ? UserRole.Lecturer : UserRole.Researcher;
                }
            }
            catch (Exception exception)
            {
                context.SyncLogs.Add(new SyncLog
                {
                    SourceApi = "PayOS Reconciliation",
                    Status = SyncStatus.Failed,
                    ErrorMessage = $"Order {payment.OrderCode}: {exception.Message}",
                    StartedAt = DateTime.UtcNow,
                    FinishedAt = DateTime.UtcNow
                });
            }
        }
        if (reconciledCount > 0)
        {
            context.SyncLogs.Add(new SyncLog
            {
                SourceApi = "PayOS Reconciliation",
                Status = SyncStatus.Completed,
                RecordsSynced = reconciledCount,
                StartedAt = DateTime.UtcNow,
                FinishedAt = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync(cancellationToken);
    }
}
