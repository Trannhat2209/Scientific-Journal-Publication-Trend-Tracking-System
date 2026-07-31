using System;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.DataAccess.Entities;

public class Follow
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public FollowType FollowType { get; set; }
    public int FollowTargetId { get; set; }
    public string? FollowTargetName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
