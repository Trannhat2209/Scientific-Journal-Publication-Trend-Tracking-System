namespace ScientificJournal.DataAccess.Entities
{
    // Ánh xạ bảng users trong database
    public class User
    {
        public Guid      Id           { get; set; }
        public string    FullName     { get; set; } = string.Empty;
        public string    Email        { get; set; } = string.Empty;
        public string    PasswordHash { get; set; } = string.Empty;
        public string    Role         { get; set; } = "Student";
        public bool      IsActive     { get; set; } = true;
        public bool      IsDeleted    { get; set; } = false;
        public DateTime? LastLoginAt  { get; set; }
        public DateTime  CreatedAt    { get; set; }
        public DateTime? UpdatedAt    { get; set; }
    }

    // Ánh xạ bảng publications trong database
    public class Publication
    {
        public Guid      Id              { get; set; }
        public Guid?     JournalId       { get; set; }
        public string    Title           { get; set; } = string.Empty;
        public string?   Abstract        { get; set; }
        public int       PublicationYear { get; set; }
        public string?   Doi             { get; set; }
        public int       CitationCount   { get; set; } = 0;
        public string    SourceApi       { get; set; } = "SemanticScholar";
        public bool      IsDeleted       { get; set; } = false;
        public DateTime  CreatedAt       { get; set; }
        public DateTime? UpdatedAt       { get; set; }

        public Journal? Journal { get; set; }
    }

    // Ánh xạ bảng journals trong database
    public class Journal
    {
        public Guid      Id         { get; set; }
        public string    Name       { get; set; } = string.Empty;
        public string?   Publisher  { get; set; }
        public string?   IssnOnline { get; set; }
        public bool      IsDeleted  { get; set; } = false;
        public DateTime  CreatedAt  { get; set; }
        public DateTime? UpdatedAt  { get; set; }
    }
}
