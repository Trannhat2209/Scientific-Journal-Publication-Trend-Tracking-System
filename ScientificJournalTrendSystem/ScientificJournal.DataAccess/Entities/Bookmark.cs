using System;

namespace ScientificJournal.DataAccess.Entities;

public class Bookmark
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid PublicationId { get; set; }
    public Publication? Publication { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
