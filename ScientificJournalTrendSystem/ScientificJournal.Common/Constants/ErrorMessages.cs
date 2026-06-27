namespace ScientificJournal.Common.Constants
{
    // Tập trung toàn bộ chuỗi thông báo lỗi, tránh hardcode string rải rác trong code
    public static class ErrorMessages
    {
        // Bookmark
        public const string BookmarkAlreadyExists  = "Bài báo này đã được lưu trước đó.";
        public const string BookmarkNotFound       = "Không tìm thấy bookmark hoặc bạn không có quyền xoá.";

        // Follow
        public const string FollowTypeInvalid      = "FollowType không hợp lệ. Chỉ chấp nhận: Keyword, Journal.";
        public const string FollowAlreadyExists    = "Bạn đã follow đối tượng này rồi.";
        public const string FollowNotFound         = "Không tìm thấy follow hoặc bạn không có quyền xoá.";

        // Notification
        public const string NotificationNotFound   = "Không tìm thấy thông báo hoặc bạn không có quyền cập nhật.";

        // SyncLog
        public const string SyncSourceApiInvalid   = "SourceApi không hợp lệ. Chỉ chấp nhận: SemanticScholar, OpenAlex.";

        // User / Admin
        public const string UserNotFound           = "Không tìm thấy user.";

        // Auth
        public const string Unauthorized           = "Không tìm thấy thông tin user trong token.";
    }
}
