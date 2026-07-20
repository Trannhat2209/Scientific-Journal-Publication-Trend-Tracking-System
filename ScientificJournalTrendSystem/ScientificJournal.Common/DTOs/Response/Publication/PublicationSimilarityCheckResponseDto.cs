using ScientificJournal.Common.DTOs.Request.Publication;

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
