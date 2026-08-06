using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Configurations;

public class DashboardReportConfiguration : IEntityTypeConfiguration<DashboardReport>
{
    public void Configure(EntityTypeBuilder<DashboardReport> builder)
    {
        builder.ToTable("dashboard_reports");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(250).IsRequired();
        builder.Property(x => x.Keyword).HasMaxLength(250).IsRequired();
        builder.Property(x => x.Format).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).IsRequired();
        builder.Property(x => x.FileName).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(150).IsRequired();
        builder.Property(x => x.ErrorMessage).HasMaxLength(2000);
        builder.Property(x => x.FileContent).HasColumnType("varbinary(max)");
        builder.HasOne(x => x.User).WithMany(x => x.DashboardReports)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}
