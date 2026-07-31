using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class SyncLogConfiguration : IEntityTypeConfiguration<SyncLog>
{
    public void Configure(EntityTypeBuilder<SyncLog> builder)
    {
        builder.ToTable("sync_logs");
        builder.HasKey(sl => sl.Id);

        builder.Property(sl => sl.Status)
            .HasConversion<string>();

        builder.HasOne(sl => sl.TriggeredByUser)
            .WithMany()
            .HasForeignKey(sl => sl.TriggeredByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
