namespace ScientificJournal.DataAccess.Entities
{
    // Ánh xạ bảng notifications trong database
    public class Notification
    {
        public Guid     Id               { get; set; }
        public Guid     UserId           { get; set; }
        public Guid?    PublicationId    { get; set; }
        public string   Message          { get; set; } = string.Empty;
        public string   NotificationType { get; set; } = "NEW_PUBLICATION"; // NEW_PUBLICATION | TREND_ALERT | RECOMMENDATION | SYSTEM
        public bool     IsRead           { get; set; } = false;
        public DateTime CreatedAt        { get; set; }

        public User?        User        { get; set; }
        public Publication? Publication { get; set; }
    }
}
