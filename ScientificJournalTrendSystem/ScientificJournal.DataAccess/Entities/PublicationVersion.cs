namespace ScientificJournal.DataAccess.Entities;

public class PublicationVersion
{
    public int Id { get; set; }
    public int PublicationId { get; set; }
    public Publication? Publication { get; set; }
    public int VersionNumber { get; set; }
    public string SnapshotJson { get; set; } = "{}";
    public string ChangeType { get; set; } = "created";
    public int? ChangedByUserId { get; set; }
    public User? ChangedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
