using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasQueryFilter(u => !u.IsDeleted);

        builder.Property(u => u.Role)
            .HasConversion<string>();
    }
}
