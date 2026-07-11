using System;

namespace ScientificJournal.DataAccess.Entities;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int? PublicationId { get; set; }
    public Publication? Publication { get; set; }
    public string Message { get; set; } = string.Empty;
    public ScientificJournal.Common.Enums.NotificationType NotificationType { get; set; } = ScientificJournal.Common.Enums.NotificationType.NEW_PUBLICATION;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
