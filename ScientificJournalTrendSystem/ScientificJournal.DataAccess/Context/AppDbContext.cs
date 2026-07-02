using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Journal> Journals => Set<Journal>();
    public DbSet<Publication> Publications => Set<Publication>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<PublicationAuthor> PublicationAuthors => Set<PublicationAuthor>();
    public DbSet<Keyword> Keywords => Set<Keyword>();
    public DbSet<PublicationKeyword> PublicationKeywords => Set<PublicationKeyword>();
    public DbSet<TrendingMetric> TrendingMetrics => Set<TrendingMetric>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<Follow> Follows => Set<Follow>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SyncLog> SyncLogs => Set<SyncLog>();
    public DbSet<PublicationSubmission> PublicationSubmissions => Set<PublicationSubmission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Apply lowercase snake_case naming convention to all columns
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                string columnName;
                if (entity.ClrType == typeof(TrendingMetric) && property.Name == "Year")
                {
                    columnName = "year";
                }
                else
                {
                    columnName = ConvertToSnakeCase(property.Name);
                }
                property.SetColumnName(columnName);
            }
        }
    }

    private static string ConvertToSnakeCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;

        // Custom property-to-column mappings
        if (name == "Id") return "id";
        if (name == "DOI") return "doi";
        if (name == "ISSNOnline") return "issn_online";
        if (name == "Year") return "publication_year";

        var sb = new System.Text.StringBuilder();
        for (int i = 0; i < name.Length; i++)
        {
            char c = name[i];
            if (i > 0 && char.IsUpper(c))
            {
                if (!char.IsUpper(name[i - 1]))
                {
                    sb.Append('_');
                }
            }
            sb.Append(char.ToLowerInvariant(c));
        }
        return sb.ToString();
    }

}
