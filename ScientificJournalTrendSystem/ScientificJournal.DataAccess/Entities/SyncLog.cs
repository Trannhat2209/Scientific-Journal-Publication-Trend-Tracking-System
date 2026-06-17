using System;

namespace ScientificJournal.DataAccess.Entities;

public class SyncLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SourceApi { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int RecordsSynced { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
}
