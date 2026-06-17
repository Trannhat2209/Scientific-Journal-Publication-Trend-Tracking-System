using System;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.DataAccess.Entities;

public class Follow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public FollowType FollowType { get; set; }
    public string FollowTargetId { get; set; } = string.Empty;
    public string? FollowTargetName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
