using System;

namespace ScientificJournal.DataAccess.Entities;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int? PublicationId { get; set; }
    public Publication? Publication { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Route { get; set; }
    public ScientificJournal.Common.Enums.NotificationType NotificationType { get; set; } = ScientificJournal.Common.Enums.NotificationType.NEW_PUBLICATION;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ScheduledAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? NextAttemptAt { get; set; }
    public int AttemptCount { get; set; }
    public string DeliveryStatus { get; set; } = "pending";
    public string? FailureReason { get; set; }
    public Guid? BatchId { get; set; }
}
