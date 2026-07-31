using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class SystemEventLogConfiguration : IEntityTypeConfiguration<SystemEventLog>
{
    public void Configure(EntityTypeBuilder<SystemEventLog> builder)
    {
        builder.ToTable("system_event_logs");
        builder.Property(log => log.Category).HasMaxLength(50);
        builder.Property(log => log.Level).HasMaxLength(20);
        builder.Property(log => log.EventCode).HasMaxLength(100);
        builder.Property(log => log.Method).HasMaxLength(12);
        builder.Property(log => log.Path).HasMaxLength(1000);
        builder.Property(log => log.Actor).HasMaxLength(256);
        builder.Property(log => log.IpAddress).HasMaxLength(64);
        builder.Property(log => log.UserAgent).HasMaxLength(1000);
        builder.Property(log => log.CorrelationId).HasMaxLength(100);
        builder.Property(log => log.MetadataJson).HasColumnType("nvarchar(max)");
        builder.HasIndex(log => log.CreatedAt);
        builder.HasIndex(log => new { log.Category, log.Level });
    }
}
