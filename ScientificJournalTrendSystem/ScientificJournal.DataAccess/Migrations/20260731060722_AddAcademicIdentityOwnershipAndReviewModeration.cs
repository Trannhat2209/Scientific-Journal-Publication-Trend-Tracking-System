using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations;

public partial class AddAcademicIdentityOwnershipAndReviewModeration : Migration
{
    // Schema changes are idempotently included in the preceding consolidation
    // migration so existing deployments with a hand-created review table are safe.
    protected override void Up(MigrationBuilder migrationBuilder) { }
    protected override void Down(MigrationBuilder migrationBuilder) { }
}
