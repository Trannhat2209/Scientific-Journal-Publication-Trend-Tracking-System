using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.Business.Jobs;

public class NotificationJob
{
    private const int MaxAttempts = 5;
    private readonly AppDbContext _context;
    private readonly INotificationHubService _hub;

    public NotificationJob(AppDbContext context, INotificationHubService hub)
    {
        _context = context;
        _hub = hub;
    }

    public async Task ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        var due = await _context.Notifications
            .Where(n => (n.DeliveryStatus == "pending" || n.DeliveryStatus == "retrying") &&
                        (!n.ScheduledAt.HasValue || n.ScheduledAt <= now) &&
                        (!n.NextAttemptAt.HasValue || n.NextAttemptAt <= now))
            .OrderBy(n => n.ScheduledAt ?? n.CreatedAt)
            .Take(500)
            .ToListAsync();

        foreach (var notification in due)
        {
            notification.AttemptCount++;
            try
            {
                await _hub.SendNotificationAsync(notification.UserId.ToString(), new
                {
                    id = notification.Id,
                    title = notification.Title,
                    message = notification.Message,
                    route = notification.Route,
                    notificationType = notification.NotificationType.ToString(),
                    createdAt = notification.CreatedAt,
                    scheduledAt = notification.ScheduledAt
                });
                notification.DeliveryStatus = "dispatched";
                notification.DeliveredAt = DateTime.UtcNow;
                notification.FailedAt = null;
                notification.NextAttemptAt = null;
                notification.FailureReason = null;
            }
            catch (Exception exception)
            {
                var permanentlyFailed = notification.AttemptCount >= MaxAttempts;
                notification.DeliveryStatus = permanentlyFailed ? "failed" : "retrying";
                notification.FailedAt = permanentlyFailed ? DateTime.UtcNow : null;
                notification.NextAttemptAt = permanentlyFailed
                    ? null
                    : DateTime.UtcNow.AddSeconds(Math.Pow(2, notification.AttemptCount) * 15);
                notification.FailureReason = exception.Message.Length > 1000
                    ? exception.Message[..1000]
                    : exception.Message;
            }
        }

        await _context.SaveChangesAsync();
    }
}
