namespace ScientificJournal.Common.DTOs.Request
{
    // Yêu cầu lưu bài báo vào bookmark
    public record CreateBookmarkRequestDto(Guid PublicationId);

    // Yêu cầu follow keyword hoặc journal
    public record CreateFollowRequestDto(
        string FollowType,       // "Keyword" hoặc "Journal"
        Guid   FollowTargetId,
        string FollowTargetName
    );

    // Yêu cầu kích hoạt đồng bộ dữ liệu từ API bên ngoài
    public record TriggerSyncRequestDto(string SourceApi);

    // Yêu cầu cập nhật trạng thái tài khoản user
    public record UpdateUserStatusRequestDto(bool IsActive);
}
