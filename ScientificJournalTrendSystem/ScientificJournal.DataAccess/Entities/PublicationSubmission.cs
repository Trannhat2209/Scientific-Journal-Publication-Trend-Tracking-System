using System;

namespace ScientificJournal.DataAccess.Entities;

public class PublicationSubmission
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public string? DOI { get; set; }
    public string Authors { get; set; } = string.Empty;
    public string? Keywords { get; set; }
    public string Status { get; set; } = "Pending";
    public int SubmittedByUserId { get; set; }
    public string? RejectedReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation property
    public User? SubmittedByUser { get; set; }
}
