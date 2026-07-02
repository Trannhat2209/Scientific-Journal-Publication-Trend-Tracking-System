using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class PublicationSubmissionConfiguration : IEntityTypeConfiguration<PublicationSubmission>
{
    public void Configure(EntityTypeBuilder<PublicationSubmission> builder)
    {
        builder.ToTable("publication_submissions");
        builder.HasKey(ps => ps.Id);

        builder.HasOne(ps => ps.SubmittedByUser)
            .WithMany()
            .HasForeignKey(ps => ps.SubmittedByUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
