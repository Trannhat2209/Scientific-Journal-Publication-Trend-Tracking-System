using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class ApiDataSourceConfiguration : IEntityTypeConfiguration<ApiDataSource>
{
    public void Configure(EntityTypeBuilder<ApiDataSource> builder)
    {
        builder.ToTable("api_data_sources");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ProviderType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.BaseUrl).HasMaxLength(500);
        builder.Property(x => x.LastError).HasMaxLength(2000);
        builder.HasIndex(x => x.Name).IsUnique();
    }
}
