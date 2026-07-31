using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title)
            .HasMaxLength(200);

        builder.Property(n => n.Route)
            .HasMaxLength(300);

        builder.Property(n => n.NotificationType)
            .HasConversion<string>();

        builder.Property(n => n.DeliveryStatus).HasMaxLength(30);
        builder.Property(n => n.FailureReason).HasMaxLength(1000);
        builder.HasIndex(n => new { n.DeliveryStatus, n.ScheduledAt, n.NextAttemptAt });
        builder.HasIndex(n => n.BatchId);

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Publication)
            .WithMany()
            .HasForeignKey(n => n.PublicationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
