using System.Collections.Generic;

namespace ScientificJournal.Common.DTOs.Request.Publication;

public class UploadPublicationDto
{
    public string Title { get; set; } = string.Empty;
    public string Abstract { get; set; } = string.Empty;
    public int Year { get; set; }
    public string DOI { get; set; } = string.Empty;
    public int? JournalId { get; set; }
    public List<string> Authors { get; set; } = new List<string>();
    public List<string> Keywords { get; set; } = new List<string>();
}
