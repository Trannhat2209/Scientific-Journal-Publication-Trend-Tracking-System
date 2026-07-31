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

        builder.Property(u => u.Institution).HasMaxLength(160);
        builder.Property(u => u.Department).HasMaxLength(160);
        builder.Property(u => u.InstitutionalEmail).HasMaxLength(160);
        builder.Property(u => u.InstitutionalEmailVerificationToken).HasMaxLength(100);
        builder.Property(u => u.AcademicIdentifier).HasMaxLength(100);
        builder.Property(u => u.ProgramOrField).HasMaxLength(160);
        builder.Property(u => u.EvidenceUrl).HasMaxLength(500);
        builder.Property(u => u.VerificationStatus)
            .HasMaxLength(30)
            .HasDefaultValue("not_submitted");
        builder.Property(u => u.RequestedRole).HasMaxLength(30);
    }
}
