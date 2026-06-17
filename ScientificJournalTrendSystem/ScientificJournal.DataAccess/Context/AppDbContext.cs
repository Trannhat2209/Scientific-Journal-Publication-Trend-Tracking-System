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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
