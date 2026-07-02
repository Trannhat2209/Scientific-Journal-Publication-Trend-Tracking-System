using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class PublicationKeywordConfiguration : IEntityTypeConfiguration<PublicationKeyword>
{
    public void Configure(EntityTypeBuilder<PublicationKeyword> builder)
    {
        builder.ToTable("publication_keywords");
        builder.HasKey(pk => new { pk.PublicationId, pk.KeywordId });

        builder.HasOne(pk => pk.Publication)
            .WithMany(p => p.PublicationKeywords)
            .HasForeignKey(pk => pk.PublicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pk => pk.Keyword)
            .WithMany(k => k.PublicationKeywords)
            .HasForeignKey(pk => pk.KeywordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
