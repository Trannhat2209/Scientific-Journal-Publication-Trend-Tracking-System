using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class PublicationSubmissionConfiguration : IEntityTypeConfiguration<PublicationSubmission>
{
    public void Configure(EntityTypeBuilder<PublicationSubmission> builder)
    {
        builder.ToTable("publication_submissions");
        builder.HasQueryFilter(s => !s.IsDeleted);

        builder.HasIndex(s => s.Status);
        builder.HasIndex(s => s.SubmitterEmail);
        builder.HasIndex(s => s.SubmittedAt);

        builder.Property(s => s.SubmitterEmail).HasMaxLength(256);
        builder.Property(s => s.SubmitterName).HasMaxLength(200);
        builder.Property(s => s.SubmitterRole).HasMaxLength(30);
        builder.Property(s => s.Title).HasMaxLength(500);
        builder.Property(s => s.AuthorsText).HasMaxLength(1000);
        builder.Property(s => s.KeywordsText).HasMaxLength(1000);
        builder.Property(s => s.FileName).HasMaxLength(260);
        builder.Property(s => s.FileContentType).HasMaxLength(120);
        builder.Property(s => s.MatchedTitle).HasMaxLength(500);
        builder.Property(s => s.MatchedSource).HasMaxLength(300);
        builder.Property(s => s.MatchedLink).HasMaxLength(1000);
        builder.Property(s => s.Status).HasMaxLength(30);
        builder.Property(s => s.Decision).HasMaxLength(1000);
        builder.Property(s => s.RejectedReason).HasMaxLength(1000);
        builder.Property(s => s.RejectedEvidence).HasMaxLength(2000);

        builder.HasOne(s => s.SubmitterUser)
            .WithMany()
            .HasForeignKey(s => s.SubmitterUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.ReviewedByUser)
            .WithMany()
            .HasForeignKey(s => s.ReviewedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.PublishedPublication)
            .WithMany()
            .HasForeignKey(s => s.PublishedPublicationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
