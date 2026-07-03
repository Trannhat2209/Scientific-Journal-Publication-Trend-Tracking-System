using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class AdminStateConfiguration : IEntityTypeConfiguration<AdminState>
{
    public void Configure(EntityTypeBuilder<AdminState> builder)
    {
        builder.ToTable("admin_states");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StateKey)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(s => s.JsonValue)
            .IsRequired();

        builder.HasIndex(s => s.StateKey)
            .IsUnique();

        builder.HasOne(s => s.UpdatedByUser)
            .WithMany()
            .HasForeignKey(s => s.UpdatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
