using System;

namespace ScientificJournal.DataAccess.Entities;

public class TrendingMetric
{
    public int Id { get; set; }
    public int KeywordId { get; set; }
    public Keyword? Keyword { get; set; }
    public int Year { get; set; }
    public int PublicationCount { get; set; }
    public decimal? TrendingScore { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
