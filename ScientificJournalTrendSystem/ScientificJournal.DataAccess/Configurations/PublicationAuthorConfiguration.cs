using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class PublicationAuthorConfiguration : IEntityTypeConfiguration<PublicationAuthor>
{
    public void Configure(EntityTypeBuilder<PublicationAuthor> builder)
    {
        builder.ToTable("publication_authors");
        builder.HasKey(pa => new { pa.PublicationId, pa.AuthorId });

        builder.HasOne(pa => pa.Publication)
            .WithMany(p => p.PublicationAuthors)
            .HasForeignKey(pa => pa.PublicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pa => pa.Author)
            .WithMany()
            .HasForeignKey(pa => pa.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
