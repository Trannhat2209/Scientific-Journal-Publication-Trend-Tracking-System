using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public sealed class PublicationReviewReportConfiguration : IEntityTypeConfiguration<PublicationReviewReport>
{
    public void Configure(EntityTypeBuilder<PublicationReviewReport> builder)
    {
        builder.ToTable("publication_review_reports");
        builder.HasIndex(item => new { item.ReviewId, item.ReporterUserId }).IsUnique();
        builder.Property(item => item.Reason).HasMaxLength(500);
        builder.Property(item => item.Category).HasMaxLength(40);
        builder.Property(item => item.Status).HasMaxLength(30);
        builder.HasOne(item => item.Review).WithMany().HasForeignKey(item => item.ReviewId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(item => item.ReporterUser).WithMany().HasForeignKey(item => item.ReporterUserId).OnDelete(DeleteBehavior.NoAction);
    }
}
