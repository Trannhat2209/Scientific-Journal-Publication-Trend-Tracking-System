using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class TrendingMetricConfiguration : IEntityTypeConfiguration<TrendingMetric>
{
    public void Configure(EntityTypeBuilder<TrendingMetric> builder)
    {
        builder.ToTable("trending_metrics");
        builder.Property(tm => tm.Year).HasColumnName("year");
        builder.HasIndex(tm => new { tm.KeywordId, tm.Year }).IsUnique();
    }
}
