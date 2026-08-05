using System;
using System.Collections.Generic;

namespace ScientificJournal.DataAccess.Entities;

public class Keyword
{
    public int Id { get; set; }
    public string Term { get; set; } = string.Empty;
    public string NormalizedTerm { get; set; } = string.Empty;
    public int? ResearchTopicId { get; set; }
    public ResearchTopic? ResearchTopic { get; set; }

    // Navigation collections
    public ICollection<PublicationKeyword> PublicationKeywords { get; set; } = new List<PublicationKeyword>();
    public ICollection<TrendingMetric> TrendingMetrics { get; set; } = new List<TrendingMetric>();
}
