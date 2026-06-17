using System;

namespace ScientificJournal.DataAccess.Entities;

public class TrendingMetric
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid KeywordId { get; set; }
    public Keyword? Keyword { get; set; }
    public int Year { get; set; }
    public int PublicationCount { get; set; }
    public double TrendingScore { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
