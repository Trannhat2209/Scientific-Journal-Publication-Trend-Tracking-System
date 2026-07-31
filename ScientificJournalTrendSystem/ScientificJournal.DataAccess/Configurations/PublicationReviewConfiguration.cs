using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class PublicationReviewConfiguration : IEntityTypeConfiguration<PublicationReview>
{
    public void Configure(EntityTypeBuilder<PublicationReview> builder)
    {
        builder.ToTable("publication_reviews");
        builder.HasKey(item => item.Id);
        builder.Property(item => item.PublicationKey).HasMaxLength(300).IsRequired();
        builder.Property(item => item.PublicationTitle).HasMaxLength(500).IsRequired();
        builder.Property(item => item.PublicationAuthors).HasMaxLength(1000);
        builder.Property(item => item.PublicationAbstract).HasColumnType("nvarchar(max)");
        builder.Property(item => item.PublicationSource).HasMaxLength(300);
        builder.Property(item => item.PublicationDoi).HasMaxLength(300);
        builder.Property(item => item.PublicationUrl).HasMaxLength(1200);
        builder.Property(item => item.Comment).HasMaxLength(2000).IsRequired();
        builder.Property(item => item.ReviewerRole).HasMaxLength(30).IsRequired();
        builder.Property(item => item.ModerationReason).HasMaxLength(500);
        builder.Property(item => item.ModerationStatus).HasMaxLength(30).HasDefaultValue("visible");
        builder.HasIndex(item => new { item.UserId, item.PublicationKey }).IsUnique();
        builder.HasOne(item => item.User)
            .WithMany()
            .HasForeignKey(item => item.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
