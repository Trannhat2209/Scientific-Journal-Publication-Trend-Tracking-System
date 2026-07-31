namespace ScientificJournal.DataAccess.Entities;

public sealed class PublicationReviewReport
{
    public int Id { get; set; }
    public int ReviewId { get; set; }
    public PublicationReview? Review { get; set; }
    public int ReporterUserId { get; set; }
    public User? ReporterUser { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Category { get; set; } = "other";
    public string Status { get; set; } = "reported";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
}
