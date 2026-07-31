using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class JournalConfiguration : IEntityTypeConfiguration<Journal>
{
    public void Configure(EntityTypeBuilder<Journal> builder)
    {
        builder.ToTable("journals");
        builder.HasKey(j => j.Id);
        builder.HasIndex(j => j.ISSNOnline).IsUnique();
        builder.HasQueryFilter(j => !j.IsDeleted);
    }
}
