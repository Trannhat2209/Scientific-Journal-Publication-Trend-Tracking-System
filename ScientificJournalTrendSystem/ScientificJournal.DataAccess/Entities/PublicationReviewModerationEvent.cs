namespace ScientificJournal.DataAccess.Entities;

public sealed class PublicationReviewModerationEvent
{
    public int Id { get; set; }
    public int ReviewId { get; set; }
    public PublicationReview? Review { get; set; }
    public int ModeratorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
