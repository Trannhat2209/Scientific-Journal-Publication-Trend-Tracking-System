namespace ScientificJournal.DataAccess.Entities
{
    // Ánh xạ bảng sync_logs trong database
    public class SyncLog
    {
        public Guid      Id                { get; set; }
        public Guid?     TriggeredByUserId { get; set; }
        public string    SourceApi         { get; set; } = string.Empty; // SemanticScholar | OpenAlex
        public string    Status            { get; set; } = "Running";    // Running | Completed | Failed
        public int?      RecordsSynced     { get; set; }
        public string?   ErrorMessage      { get; set; }
        public DateTime  StartedAt         { get; set; }
        public DateTime? FinishedAt        { get; set; }

        public User? TriggeredByUser { get; set; }
    }
}
