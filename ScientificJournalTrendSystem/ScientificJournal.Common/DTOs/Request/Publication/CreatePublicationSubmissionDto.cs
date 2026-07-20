using System.Collections.Generic;

namespace ScientificJournal.Common.DTOs.Request.Publication;

public class CreatePublicationSubmissionDto
{
    public string Title { get; set; } = string.Empty;
    public string Authors { get; set; } = string.Empty;
    public string Keywords { get; set; } = string.Empty;
    public string Abstract { get; set; } = string.Empty;
    public string SubmitterEmail { get; set; } = string.Empty;
    public string SubmitterName { get; set; } = string.Empty;
    public string Role { get; set; } = "Researcher";
    public string? FileName { get; set; }
    public string? FileContentType { get; set; }
    public string? FileContentBase64 { get; set; }
    public string? FileText { get; set; }
    public double SimilarityPercent { get; set; }
    public string? MatchedTitle { get; set; }
    public string? MatchedSource { get; set; }
    public string? MatchedLink { get; set; }
    public bool? OverLimit { get; set; }
    public string? Decision { get; set; }
    public List<PublicationSubmissionCandidateDto> Candidates { get; set; } = new();
}

public class PublicationSubmissionCandidateDto
{
    public string Title { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string? Link { get; set; }
    public string? Snippet { get; set; }
    public double SimilarityPercent { get; set; }
    public List<PublicationSimilaritySegmentDto> SegmentMatches { get; set; } = new();
}

public class PublicationSimilaritySegmentDto
{
    public string SubmittedText { get; set; } = string.Empty;
    public string SourceText { get; set; } = string.Empty;
    public int SimilarityPercent { get; set; }
}
