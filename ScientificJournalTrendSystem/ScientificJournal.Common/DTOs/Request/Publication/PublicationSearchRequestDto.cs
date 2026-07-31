namespace ScientificJournal.Common.DTOs.Request.Publication;

public class PublicationSearchRequestDto
{
    public string? Keyword { get; set; }
    public int? Year { get; set; }
    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }
    public string? JournalId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public string? Source { get; set; }
}
