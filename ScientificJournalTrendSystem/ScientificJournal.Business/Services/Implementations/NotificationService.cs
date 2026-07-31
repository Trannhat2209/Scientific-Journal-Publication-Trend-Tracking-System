using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    public NotificationService(AppDbContext context)
    {
        _context = context;
    }


    public async Task<IEnumerable<Notification>> GetNotificationsAsync(int userId)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId &&
                        (n.DeliveryStatus == "dispatched" || n.DeliveryStatus == "delivered"))
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> MarkReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notification == null) return false;
        notification.IsRead = true;
        notification.ReadAt ??= DateTime.UtcNow;
        notification.AcknowledgedAt ??= DateTime.UtcNow;
        notification.DeliveryStatus = "delivered";
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AcknowledgeAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notification == null) return false;
        notification.AcknowledgedAt ??= DateTime.UtcNow;
        notification.DeliveryStatus = "delivered";
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task MarkAllReadAsync(int userId)
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt ??= DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task CreateNotificationAsync(int userId, string message, int? publicationId = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = "NOTICE:",
            Message = message,
            Route = publicationId.HasValue ? $"/student-publication?id={publicationId.Value}" : "/student-notifications",
            IsRead = false,
            PublicationId = publicationId,
            NotificationType = ScientificJournal.Common.Enums.NotificationType.NEW_PUBLICATION,
            CreatedAt = DateTime.UtcNow,
            DeliveryStatus = "pending",
            ScheduledAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

    }

    public async Task<Notification?> CreateNotificationForEmailAsync(
        string recipientEmail,
        string message,
        NotificationType notificationType = NotificationType.SYSTEM,
        int? publicationId = null)
    {
        var normalizedEmail = recipientEmail.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(message))
        {
            return null;
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail && !u.IsDeleted);

        if (user == null)
        {
            return null;
        }

        var notification = new Notification
        {
            UserId = user.Id,
            Title = "NOTICE:",
            Message = message,
            Route = publicationId.HasValue ? $"/student-publication?id={publicationId.Value}" : "/student-notifications",
            IsRead = false,
            PublicationId = publicationId,
            NotificationType = notificationType,
            CreatedAt = DateTime.UtcNow,
            DeliveryStatus = "pending",
            ScheduledAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return notification;
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId &&
                             (n.DeliveryStatus == "dispatched" || n.DeliveryStatus == "delivered") &&
                             !n.IsRead);
    }
}

