namespace ScientificJournal.DataAccess.External;

public class ExternalPublication
{
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public int Year { get; set; }
    public string DOI { get; set; } = string.Empty;
    public string? SourceUrl { get; set; }
    public string SourceApi { get; set; } = string.Empty;
    public string JournalName { get; set; } = string.Empty;
    public string? Publisher { get; set; }
    public int CitationCount { get; set; }
    public List<string> Authors { get; set; } = new();
    public List<string> Keywords { get; set; } = new();
    public string RawJson { get; set; } = string.Empty;
}
