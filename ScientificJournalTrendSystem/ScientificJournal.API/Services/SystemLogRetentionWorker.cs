using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.API.Services;

public sealed class SystemLogRetentionWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SystemLogRetentionWorker> _logger;

    public SystemLogRetentionWorker(IServiceScopeFactory scopeFactory, IConfiguration configuration, ILogger<SystemLogRetentionWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(24));
        do
        {
            try
            {
                var retentionDays = Math.Clamp(_configuration.GetValue("SystemLogs:RetentionDays", 90), 7, 3650);
                var cutoff = DateTime.UtcNow.AddDays(-retentionDays);
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var deleted = await context.SystemEventLogs.Where(log => log.CreatedAt < cutoff).ExecuteDeleteAsync(stoppingToken);
                if (deleted > 0) _logger.LogInformation("Deleted {Count} system logs older than {RetentionDays} days.", deleted, retentionDays);
            }
            catch (Exception exception) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(exception, "System log retention cleanup failed.");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
