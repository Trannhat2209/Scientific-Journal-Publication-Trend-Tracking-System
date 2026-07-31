using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScientificJournal.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class CleanLegacySyncLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM sync_logs
                WHERE source_api LIKE N'%PayOS%';

                DELETE failed
                FROM sync_logs AS failed
                WHERE failed.source_api = N'OpenAlex'
                  AND failed.status = N'Failed'
                  AND (
                      failed.error_message LIKE N'%429%'
                      OR failed.error_message LIKE N'%Too Many Requests%'
                      OR failed.error_message LIKE N'%timed out%'
                      OR failed.error_message LIKE N'%timeout%'
                      OR failed.error_message LIKE N'%canceled%'
                  )
                  AND EXISTS (
                      SELECT 1
                      FROM sync_logs AS recovered
                      WHERE recovered.source_api = failed.source_api
                        AND recovered.status = N'Completed'
                        AND recovered.started_at > failed.started_at
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Historical operational logs cannot be reconstructed safely.
        }
    }
}
