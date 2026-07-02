using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.ToTable("payment_transactions");

        builder.HasIndex(p => p.OrderCode).IsUnique();
        builder.HasIndex(p => p.PaymentLinkId);
        builder.HasIndex(p => p.UserEmail);
        builder.HasIndex(p => p.Status);

        builder.Property(p => p.UserEmail).HasMaxLength(256);
        builder.Property(p => p.BillingCycle).HasMaxLength(20);
        builder.Property(p => p.Plan).HasMaxLength(20);
        builder.Property(p => p.Currency).HasMaxLength(10);
        builder.Property(p => p.Description).HasMaxLength(100);
        builder.Property(p => p.Status).HasMaxLength(30);
        builder.Property(p => p.PaymentLinkId).HasMaxLength(100);
        builder.Property(p => p.PayosReference).HasMaxLength(100);
        builder.Property(p => p.CheckoutUrl).HasMaxLength(1000);

        builder.HasOne(p => p.User)
            .WithMany(u => u.PaymentTransactions)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
