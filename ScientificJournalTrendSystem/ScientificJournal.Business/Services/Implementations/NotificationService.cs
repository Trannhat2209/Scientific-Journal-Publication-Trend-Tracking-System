using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly INotificationHubService _notificationHubService;

    public NotificationService(AppDbContext context, INotificationHubService notificationHubService)
    {
        _context = context;
        _notificationHubService = notificationHubService;
    }


    public async Task<IEnumerable<Notification>> GetNotificationsAsync(int userId)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task MarkReadAsync(int notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(int userId)
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }

    public async Task CreateNotificationAsync(int userId, string message, int? publicationId = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Message = message,
            IsRead = false,
            PublicationId = publicationId,
            NotificationType = ScientificJournal.Common.Enums.NotificationType.NEW_PUBLICATION,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Push real-time notification to client via SignalR
        try
        {
            await _notificationHubService.SendNotificationAsync(userId.ToString(), new
            {
                id = notification.Id,
                message = notification.Message,
                isRead = notification.IsRead,
                publicationId = notification.PublicationId,
                notificationType = notification.NotificationType.ToString(),
                createdAt = notification.CreatedAt
            });
        }
        catch
        {
            // Ignore SignalR client push errors if no client is listening/connected
        }
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }
}

