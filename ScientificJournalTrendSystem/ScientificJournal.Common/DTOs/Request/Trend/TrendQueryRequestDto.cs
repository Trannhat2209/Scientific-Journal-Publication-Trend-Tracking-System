using ScientificJournal.Common.Enums;

namespace ScientificJournal.Common.DTOs.Request.Trend;

public class TrendQueryRequestDto
{
    public string Keyword { get; set; } = string.Empty;
    public int FromYear { get; set; }
    public int ToYear { get; set; }
    public TrendingStrategy Strategy { get; set; }
}
