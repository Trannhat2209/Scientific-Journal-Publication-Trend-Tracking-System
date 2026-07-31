namespace ScientificJournal.Common.DTOs.Response.Publication;

public class PublicationSimilarityCheckResponseDto
{
    public int SimilarityPercent { get; set; }
    public int LimitPercent { get; set; } = 50;
    public bool OverLimit { get; set; }
    public string MatchedTitle { get; set; } = string.Empty;
    public string MatchedSource { get; set; } = "SerpApi Google Scholar";
    public string? MatchedLink { get; set; }
    public string Decision { get; set; } = string.Empty;
    public int TotalCandidatesScanned { get; set; }
    public List<string> SourcesSearched { get; set; } = new();
    public List<string> SourceWarnings { get; set; } = new();
    public List<PublicationSimilarityCandidateDto> Candidates { get; set; } = new();
}

public class PublicationSimilarityCandidateDto
{
    public string Title { get; set; } = string.Empty;
    public string Source { get; set; } = "SerpApi Google Scholar";
    public string? Link { get; set; }
    public string? Snippet { get; set; }
    public int SimilarityPercent { get; set; }
    public List<PublicationSimilaritySegmentDto> SegmentMatches { get; set; } = new();
}

public class PublicationSimilaritySegmentDto
{
    public string SubmittedText { get; set; } = string.Empty;
    public string SourceText { get; set; } = string.Empty;
    public int SimilarityPercent { get; set; }
}
