using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<Notification>> GetNotificationsAsync(int userId);
    Task<bool> MarkReadAsync(int notificationId, int userId);
    Task<bool> AcknowledgeAsync(int notificationId, int userId);
    Task MarkAllReadAsync(int userId);
    Task CreateNotificationAsync(int userId, string message, int? publicationId = null);
    Task<Notification?> CreateNotificationForEmailAsync(string recipientEmail, string message, NotificationType notificationType = NotificationType.SYSTEM, int? publicationId = null);
    Task<int> GetUnreadCountAsync(int userId);
}

