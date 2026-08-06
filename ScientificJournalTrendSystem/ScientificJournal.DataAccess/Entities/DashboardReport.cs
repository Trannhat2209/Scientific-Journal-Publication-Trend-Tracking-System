namespace ScientificJournal.DataAccess.Entities;

public class DashboardReport
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Keyword { get; set; } = string.Empty;
    public int FromYear { get; set; }
    public int ToYear { get; set; }
    public string Format { get; set; } = "Csv";
    public string Status { get; set; } = "Completed";
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public byte[] FileContent { get; set; } = Array.Empty<byte>();
    public long FileSize { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
