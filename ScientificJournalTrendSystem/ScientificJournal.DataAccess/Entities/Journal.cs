using System;

namespace ScientificJournal.DataAccess.Entities;

public class Journal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Publisher { get; set; }
    public string ISSNOnline { get; set; } = string.Empty;
    public bool IsDeleted { get; set; } = false;
}
