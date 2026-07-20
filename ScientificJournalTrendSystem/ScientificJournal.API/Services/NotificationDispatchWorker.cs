using ScientificJournal.Business.Jobs;

namespace ScientificJournal.API.Services;

public sealed class NotificationDispatchWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationDispatchWorker> _logger;

    public NotificationDispatchWorker(IServiceScopeFactory scopeFactory, ILogger<NotificationDispatchWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<NotificationJob>().ExecuteAsync();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Scheduled notification dispatch failed.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
