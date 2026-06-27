namespace ScientificJournal.Common.DTOs.Response
{
    // Dữ liệu trả về khi xem danh sách bài báo đã lưu
    public record BookmarkResponseDto(
        Guid     Id,
        Guid     PublicationId,
        string   PublicationTitle,
        string?  PublicationDoi,
        int      PublicationYear,
        string?  JournalName,
        DateTime CreatedAt
    );

    // Dữ liệu trả về khi xem danh sách follow
    public record FollowResponseDto(
        Guid     Id,
        string   FollowType,
        Guid     FollowTargetId,
        string   FollowTargetName,
        DateTime CreatedAt
    );

    // Dữ liệu trả về khi xem danh sách thông báo
    public record NotificationResponseDto(
        Guid     Id,
        Guid?    PublicationId,
        string   Message,
        string   NotificationType,
        bool     IsRead,
        DateTime CreatedAt
    );

    // Dữ liệu trả về khi xem lịch sử đồng bộ
    public record SyncLogResponseDto(
        Guid      Id,
        Guid?     TriggeredByUserId,
        string?   TriggeredByUserName,
        string    SourceApi,
        string    Status,
        int?      RecordsSynced,
        string?   ErrorMessage,
        DateTime  StartedAt,
        DateTime? FinishedAt
    );

    // Dữ liệu thống kê hệ thống dành cho admin
    public record StatisticsResponseDto(
        int      TotalUsers,
        int      TotalPublications,
        int      TotalJournals,
        int      TotalBookmarks,
        int      TotalFollows,
        int      TotalNotifications,
        int      UnreadNotifications,
        int      TotalSyncLogs,
        DateTime GeneratedAt
    );

    // Thông tin user dành cho admin quản lý
    public record AdminUserResponseDto(
        Guid      Id,
        string    FullName,
        string    Email,
        string    Role,
        bool      IsActive,
        DateTime? LastLoginAt,
        DateTime  CreatedAt
    );
}
