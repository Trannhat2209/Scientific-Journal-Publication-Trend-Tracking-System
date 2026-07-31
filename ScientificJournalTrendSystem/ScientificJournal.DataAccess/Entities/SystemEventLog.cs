namespace ScientificJournal.DataAccess.Entities;

public class SystemEventLog
{
    public long Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Category { get; set; } = "API";
    public string Level { get; set; } = "Info";
    public string EventCode { get; set; } = "API-REQUEST";
    public string Message { get; set; } = string.Empty;
    public string? Method { get; set; }
    public string? Path { get; set; }
    public int? StatusCode { get; set; }
    public int? UserId { get; set; }
    public string? Actor { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
    public string? MetadataJson { get; set; }
}
