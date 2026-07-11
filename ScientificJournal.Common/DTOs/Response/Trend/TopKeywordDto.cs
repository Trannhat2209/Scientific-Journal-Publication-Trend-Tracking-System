namespace ScientificJournal.Common.DTOs.Response.Trend;

public class TopKeywordDto
{
    public string Keyword { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public double TrendingScore { get; set; }
}
