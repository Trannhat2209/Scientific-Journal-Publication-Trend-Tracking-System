using System;

namespace ScientificJournal.DataAccess.Entities;

public class PublicationSubmission
{
    public int Id { get; set; }
    public int? SubmitterUserId { get; set; }
    public User? SubmitterUser { get; set; }
    public string SubmitterEmail { get; set; } = string.Empty;
    public string SubmitterName { get; set; } = string.Empty;
    public string SubmitterRole { get; set; } = "Researcher";
    public string Title { get; set; } = string.Empty;
    public string AuthorsText { get; set; } = string.Empty;
    public string KeywordsText { get; set; } = string.Empty;
    public string Abstract { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public string? FileContentType { get; set; }
    public byte[]? FileContent { get; set; }
    public string? ExtractedText { get; set; }
    public double SimilarityPercent { get; set; }
    public string? MatchedTitle { get; set; }
    public string? MatchedSource { get; set; }
    public string? MatchedLink { get; set; }
    public string? CandidatesJson { get; set; }
    public string Status { get; set; } = "pending";
    public string Decision { get; set; } = "Waiting for admin approval.";
    public string? RejectedReason { get; set; }
    public string? RejectedEvidence { get; set; }
    public bool IsDeleted { get; set; }
    public int? PublishedPublicationId { get; set; }
    public Publication? PublishedPublication { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public int? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }
}
