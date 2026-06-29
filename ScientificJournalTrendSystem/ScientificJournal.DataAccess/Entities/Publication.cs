using System;
using System.Collections.Generic;

namespace ScientificJournal.DataAccess.Entities;

public class Publication
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public int Year { get; set; }
    public string DOI { get; set; } = string.Empty;
    public int? JournalId { get; set; }
    public Journal? Journal { get; set; }
    public int CitationCount { get; set; }
    public string SourceApi { get; set; } = string.Empty;
    public string? MongoMetadataId { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;

    // Navigation collections
    public ICollection<PublicationAuthor> PublicationAuthors { get; set; } = new List<PublicationAuthor>();
    public ICollection<PublicationKeyword> PublicationKeywords { get; set; } = new List<PublicationKeyword>();
}
