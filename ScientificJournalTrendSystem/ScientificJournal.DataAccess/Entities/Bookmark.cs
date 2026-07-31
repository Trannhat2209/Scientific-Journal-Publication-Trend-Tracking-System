using System;

namespace ScientificJournal.DataAccess.Entities;

public class Bookmark
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int PublicationId { get; set; }
    public Publication? Publication { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
