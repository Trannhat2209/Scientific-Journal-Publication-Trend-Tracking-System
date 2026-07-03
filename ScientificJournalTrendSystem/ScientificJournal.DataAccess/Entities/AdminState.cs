using System;

namespace ScientificJournal.DataAccess.Entities;

public class AdminState
{
    public int Id { get; set; }
    public string StateKey { get; set; } = string.Empty;
    public string JsonValue { get; set; } = "{}";
    public int? UpdatedByUserId { get; set; }
    public User? UpdatedByUser { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
