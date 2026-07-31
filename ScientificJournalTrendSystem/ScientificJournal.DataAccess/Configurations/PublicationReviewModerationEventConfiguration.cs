using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public sealed class PublicationReviewModerationEventConfiguration : IEntityTypeConfiguration<PublicationReviewModerationEvent>
{
    public void Configure(EntityTypeBuilder<PublicationReviewModerationEvent> builder)
    {
        builder.ToTable("publication_review_moderation_events");
        builder.Property(item => item.Action).HasMaxLength(40);
        builder.Property(item => item.Reason).HasMaxLength(500);
        builder.HasOne(item => item.Review).WithMany().HasForeignKey(item => item.ReviewId).OnDelete(DeleteBehavior.Cascade);
    }
}
