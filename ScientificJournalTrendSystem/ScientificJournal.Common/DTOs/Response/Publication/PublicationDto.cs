using System;
using System.Collections.Generic;

namespace ScientificJournal.Common.DTOs.Response.Publication;

public class PublicationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public int Year { get; set; }
    public string DOI { get; set; } = string.Empty;
    public string JournalName { get; set; } = string.Empty;
    public string SourceApi { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public List<string> Keywords { get; set; } = new();
    public int CitationCount { get; set; }
}
