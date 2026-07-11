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
    public List<string> Authors { get; set; } = new();
    public List<string> Keywords { get; set; } = new();
    public int CitationCount { get; set; }

    /// <summary>
    /// Direct link to the exact page this publication was sourced from (OpenAlex/Semantic
    /// Scholar/Google Scholar landing page, or the DOI resolver as a fallback). Null for
    /// internally-authored uploads that have no external source page.
    /// </summary>
    public string? SourceUrl { get; set; }
}
