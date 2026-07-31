using System;

namespace ScientificJournal.DataAccess.Entities;

public class PublicationReview
{
    public int Id { get; set; }
    public string PublicationKey { get; set; } = string.Empty;
    public string PublicationTitle { get; set; } = string.Empty;
    public string PublicationAuthors { get; set; } = string.Empty;
    public string PublicationAbstract { get; set; } = string.Empty;
    public string PublicationSource { get; set; } = string.Empty;
    public int? PublicationYear { get; set; }
    public string PublicationDoi { get; set; } = string.Empty;
    public string PublicationUrl { get; set; } = string.Empty;
    public int UserId { get; set; }
    public User? User { get; set; }
    public int CredibilityRating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string ReviewerRole { get; set; } = string.Empty;
    public bool IsHidden { get; set; }
    public string ModerationReason { get; set; } = string.Empty;
    public DateTime? ModeratedAt { get; set; }
    public int ReportCount { get; set; }
    public string ModerationStatus { get; set; } = "visible";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
