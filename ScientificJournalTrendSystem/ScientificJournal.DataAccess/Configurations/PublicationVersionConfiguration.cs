using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class PublicationVersionConfiguration : IEntityTypeConfiguration<PublicationVersion>
{
    public void Configure(EntityTypeBuilder<PublicationVersion> builder)
    {
        builder.ToTable("publication_versions");
        builder.HasIndex(v => new { v.PublicationId, v.VersionNumber }).IsUnique();
        builder.Property(v => v.ChangeType).HasMaxLength(40);
        builder.Property(v => v.SnapshotJson).HasColumnType("nvarchar(max)");
        builder.HasOne(v => v.Publication).WithMany().HasForeignKey(v => v.PublicationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(v => v.ChangedByUser).WithMany().HasForeignKey(v => v.ChangedByUserId).OnDelete(DeleteBehavior.SetNull);
    }
}
