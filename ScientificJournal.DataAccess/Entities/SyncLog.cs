using System;

namespace ScientificJournal.DataAccess.Entities;

public class SyncLog
{
    public int Id { get; set; }
    public int? TriggeredByUserId { get; set; }
    public User? TriggeredByUser { get; set; }
    public string SourceApi { get; set; } = string.Empty;
    public ScientificJournal.Common.Enums.SyncStatus Status { get; set; } = ScientificJournal.Common.Enums.SyncStatus.Running;
    public int? RecordsSynced { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
}
