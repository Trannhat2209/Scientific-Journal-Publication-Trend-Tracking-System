using System;

namespace ScientificJournal.DataAccess.Entities;

public class Author
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ExternalId { get; set; }
    public string? Affiliation { get; set; }
}
