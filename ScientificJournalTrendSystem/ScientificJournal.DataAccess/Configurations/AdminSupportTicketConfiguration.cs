using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class AdminSupportTicketConfiguration : IEntityTypeConfiguration<AdminSupportTicket>
{
    public void Configure(EntityTypeBuilder<AdminSupportTicket> builder)
    {
        builder.ToTable("admin_support_tickets");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TicketNumber)
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(t => t.Message)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(t => t.Status)
            .HasMaxLength(40)
            .IsRequired();

        builder.HasIndex(t => t.TicketNumber)
            .IsUnique();

        builder.HasIndex(t => t.Status);

        builder.HasOne(t => t.CreatedByUser)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
