using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Bỏ ? - DbSet không được nullable để tránh NullReferenceException trong Repository
    public DbSet<Bookmark>     Bookmarks     => Set<Bookmark>();
    public DbSet<Follow>       Follows       => Set<Follow>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SyncLog>      SyncLogs      => Set<SyncLog>();
    public DbSet<User>         Users         => Set<User>();
    public DbSet<Publication>  Publications  => Set<Publication>();
    public DbSet<Journal>      Journals      => Set<Journal>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // ── Bookmark ──────────────────────────────────────────────
        mb.Entity<Bookmark>(e =>
        {
            e.HasKey(b => b.Id);
            // Mỗi user chỉ bookmark 1 bài 1 lần
            e.HasIndex(b => new { b.UserId, b.PublicationId }).IsUnique();
            e.HasOne(b => b.User)
             .WithMany()
             .HasForeignKey(b => b.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(b => b.Publication)
             .WithMany()
             .HasForeignKey(b => b.PublicationId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Follow ────────────────────────────────────────────────
        mb.Entity<Follow>(e =>
        {
            e.HasKey(f => f.Id);
            // Không follow trùng cùng target
            e.HasIndex(f => new { f.UserId, f.FollowType, f.FollowTargetId }).IsUnique();
            e.HasOne(f => f.User)
             .WithMany()
             .HasForeignKey(f => f.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Notification ──────────────────────────────────────────
        mb.Entity<Notification>(e =>
        {
            e.HasKey(n => n.Id);
            e.HasOne(n => n.User)
             .WithMany()
             .HasForeignKey(n => n.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            // Nếu publication bị xoá thì notification vẫn giữ nhưng PublicationId = null
            e.HasOne(n => n.Publication)
             .WithMany()
             .HasForeignKey(n => n.PublicationId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ── SyncLog ───────────────────────────────────────────────
        mb.Entity<SyncLog>(e =>
        {
            e.HasKey(s => s.Id);
            // Nếu admin bị xoá thì log vẫn giữ nhưng TriggeredByUserId = null
            e.HasOne(s => s.TriggeredByUser)
             .WithMany()
             .HasForeignKey(s => s.TriggeredByUserId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Publication ───────────────────────────────────────────
        mb.Entity<Publication>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Journal)
             .WithMany()
             .HasForeignKey(p => p.JournalId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ── User ──────────────────────────────────────────────────
        mb.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
        });

        // ── Journal ───────────────────────────────────────────────
        mb.Entity<Journal>(e =>
        {
            e.HasKey(j => j.Id);
        });
    }
}
