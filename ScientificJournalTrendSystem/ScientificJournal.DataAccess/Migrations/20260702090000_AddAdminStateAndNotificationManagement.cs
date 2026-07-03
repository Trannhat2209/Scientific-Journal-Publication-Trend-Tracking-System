using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminStateAndNotificationManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "route",
                table: "notifications",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "title",
                table: "notifications",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "admin_states",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    state_key = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    json_value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    updated_by_user_id = table.Column<int>(type: "int", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_admin_states", x => x.id);
                    table.ForeignKey(
                        name: "fk_admin_states_users_updated_by_user_id",
                        column: x => x.updated_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "admin_support_tickets",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ticket_number = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    created_by_user_id = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_admin_support_tickets", x => x.id);
                    table.ForeignKey(
                        name: "fk_admin_support_tickets_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_admin_states_state_key",
                table: "admin_states",
                column: "state_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_admin_states_updated_by_user_id",
                table: "admin_states",
                column: "updated_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_admin_support_tickets_created_by_user_id",
                table: "admin_support_tickets",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_admin_support_tickets_status",
                table: "admin_support_tickets",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_admin_support_tickets_ticket_number",
                table: "admin_support_tickets",
                column: "ticket_number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_states");

            migrationBuilder.DropTable(
                name: "admin_support_tickets");

            migrationBuilder.DropColumn(
                name: "route",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "title",
                table: "notifications");
        }
    }
}
