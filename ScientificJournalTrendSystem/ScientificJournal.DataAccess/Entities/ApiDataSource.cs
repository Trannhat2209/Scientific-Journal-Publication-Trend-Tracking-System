namespace ScientificJournal.DataAccess.Entities;

public class ApiDataSource
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ProviderType { get; set; } = string.Empty;
    public string? BaseUrl { get; set; }
    public bool IsEnabled { get; set; } = true;
    public bool RequiresApiKey { get; set; }
    public DateTime? LastSuccessfulSyncAt { get; set; }
    public DateTime? LastFailedSyncAt { get; set; }
    public string? LastError { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<SyncLog> SyncLogs { get; set; } = new List<SyncLog>();
}
