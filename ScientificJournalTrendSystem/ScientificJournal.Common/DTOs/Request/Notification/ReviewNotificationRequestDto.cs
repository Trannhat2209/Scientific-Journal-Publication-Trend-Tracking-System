using ScientificJournal.Common.Enums;

namespace ScientificJournal.Common.DTOs.Request.Notification;

public class ReviewNotificationRequestDto
{
    public string RecipientEmail { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType NotificationType { get; set; } = NotificationType.SYSTEM;
    public int? PublicationId { get; set; }
}
