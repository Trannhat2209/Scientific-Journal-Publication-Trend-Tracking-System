using System;
using System.Collections.Generic;
using ScientificJournal.Common.DTOs.Request.Publication;

namespace ScientificJournal.Common.DTOs.Response.Publication;

public class PublicationSubmissionDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Authors { get; set; } = string.Empty;
    public string Keywords { get; set; } = string.Empty;
    public string Abstract { get; set; } = string.Empty;
    public string Submitter { get; set; } = string.Empty;
    public string SubmitterName { get; set; } = string.Empty;
    public string Role { get; set; } = "Researcher";
    public string? FileName { get; set; }
    public double SimilarityPercent { get; set; }
    public string MatchedTitle { get; set; } = string.Empty;
    public string MatchedSource { get; set; } = string.Empty;
    public string? MatchedLink { get; set; }
    public string Status { get; set; } = "pending";
    public string Decision { get; set; } = string.Empty;
    public string? RejectedReason { get; set; }
    public string? RejectedEvidence { get; set; }
    public int? PublishedPublicationId { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public List<PublicationSubmissionCandidateDto> Candidates { get; set; } = new();
}
