using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class ResearchTopicConfiguration : IEntityTypeConfiguration<ResearchTopic>
{
    public void Configure(EntityTypeBuilder<ResearchTopic> builder)
    {
        builder.ToTable("research_topics");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.NormalizedName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.HasIndex(x => x.NormalizedName).IsUnique();
    }
}
