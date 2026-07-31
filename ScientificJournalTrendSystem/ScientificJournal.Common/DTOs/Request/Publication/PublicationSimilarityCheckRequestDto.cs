namespace ScientificJournal.Common.DTOs.Request.Publication;

public class PublicationSimilarityCheckRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public string? Keywords { get; set; }
    public int MaxResults { get; set; } = 80;
}
