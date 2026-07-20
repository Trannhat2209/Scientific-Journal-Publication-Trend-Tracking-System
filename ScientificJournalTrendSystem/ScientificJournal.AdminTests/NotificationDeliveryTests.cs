using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Jobs;
using ScientificJournal.Business.Services.Implementations;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.AdminTests;

public class NotificationDeliveryTests
{
    [Fact]
    public async Task Future_scheduled_notification_is_not_dispatched_early()
    {
        await using var context = CreateContext();
        context.Notifications.Add(new Notification
        {
            UserId = 12,
            Title = "Scheduled",
            Message = "Message",
            DeliveryStatus = "pending",
            ScheduledAt = DateTime.UtcNow.AddHours(1)
        });
        await context.SaveChangesAsync();

        await new NotificationJob(context, new FakeHub()).ExecuteAsync();

        var notification = await context.Notifications.SingleAsync();
        Assert.Equal("pending", notification.DeliveryStatus);
        Assert.Equal(0, notification.AttemptCount);
    }

    [Fact]
    public async Task Dispatch_marks_notification_dispatched_until_browser_acknowledges()
    {
        await using var context = CreateContext();
        context.Notifications.Add(new Notification { UserId = 12, Title = "Test", Message = "Message", DeliveryStatus = "pending" });
        await context.SaveChangesAsync();

        await new NotificationJob(context, new FakeHub()).ExecuteAsync();

        var notification = await context.Notifications.SingleAsync();
        Assert.Equal("dispatched", notification.DeliveryStatus);
        Assert.Equal(1, notification.AttemptCount);
        Assert.NotNull(notification.DeliveredAt);
        Assert.Null(notification.AcknowledgedAt);
    }

    [Fact]
    public async Task Dispatch_failure_schedules_exponential_retry()
    {
        await using var context = CreateContext();
        context.Notifications.Add(new Notification { UserId = 12, Title = "Test", Message = "Message", DeliveryStatus = "pending" });
        await context.SaveChangesAsync();

        await new NotificationJob(context, new FakeHub(shouldFail: true)).ExecuteAsync();

        var notification = await context.Notifications.SingleAsync();
        Assert.Equal("retrying", notification.DeliveryStatus);
        Assert.Equal(1, notification.AttemptCount);
        Assert.True(notification.NextAttemptAt > DateTime.UtcNow);
        Assert.Null(notification.FailedAt);
    }

    [Fact]
    public async Task Acknowledgement_is_scoped_to_notification_owner()
    {
        await using var context = CreateContext();
        context.Notifications.Add(new Notification { UserId = 12, Title = "Test", Message = "Message", DeliveryStatus = "dispatched" });
        await context.SaveChangesAsync();
        var service = new NotificationService(context);
        var id = await context.Notifications.Select(n => n.Id).SingleAsync();

        Assert.False(await service.AcknowledgeAsync(id, 99));
        Assert.True(await service.AcknowledgeAsync(id, 12));
        Assert.Equal("delivered", (await context.Notifications.FindAsync(id))!.DeliveryStatus);
    }

    private static AppDbContext CreateContext() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options);

    private sealed class FakeHub(bool shouldFail = false) : INotificationHubService
    {
        public Task SendNotificationAsync(string userId, object payload) => shouldFail
            ? Task.FromException(new InvalidOperationException("SignalR unavailable"))
            : Task.CompletedTask;
    }
}
