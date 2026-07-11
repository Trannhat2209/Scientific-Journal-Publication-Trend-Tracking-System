namespace ScientificJournal.Common.DTOs.Response.Trend;

public class TrendingMetricDto
{
    public string Keyword { get; set; } = string.Empty;
    public int Year { get; set; }
    public int PublicationCount { get; set; }
    public double TrendingScore { get; set; }
}
