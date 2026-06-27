namespace ScientificJournal.DataAccess.Entities
{
    // Ánh xạ bảng follows trong database
    public class Follow
    {
        public Guid     Id               { get; set; }
        public Guid     UserId           { get; set; }
        public string   FollowType       { get; set; } = string.Empty; // Keyword | Journal
        public Guid     FollowTargetId   { get; set; }
        public string   FollowTargetName { get; set; } = string.Empty;
        public DateTime CreatedAt        { get; set; }

        public User? User { get; set; }
    }
}
