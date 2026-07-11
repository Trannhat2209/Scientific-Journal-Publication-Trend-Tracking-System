using ScientificJournal.Common.Enums;

namespace ScientificJournal.Common.DTOs.Request.Export;

public class ExportRequestDto
{
    public string Keyword { get; set; } = string.Empty;
    public int FromYear { get; set; }
    public int ToYear { get; set; }
    public ExportFormat Format { get; set; }
}
