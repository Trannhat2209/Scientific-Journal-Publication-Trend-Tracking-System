namespace ScientificJournal.DataAccess.Entities
{
    // Ánh xạ bảng bookmarks trong database
    public class Bookmark
    {
        public Guid     Id            { get; set; }
        public Guid     UserId        { get; set; }
        public Guid     PublicationId { get; set; }
        public DateTime CreatedAt     { get; set; }

        public User?        User        { get; set; }
        public Publication? Publication { get; set; }
    }
}
