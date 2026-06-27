namespace ScientificJournal.Common.Enums
{
    // Loại đối tượng được follow
    public enum FollowType
    {
        Keyword,
        Journal
    }

    // Trạng thái của một lần đồng bộ dữ liệu
    public enum SyncStatus
    {
        Running,
        Completed,
        Failed
    }

    // Vai trò người dùng trong hệ thống
    public enum UserRole
    {
        Admin,
        Researcher,
        Lecturer,
        Student
    }

    // Định dạng xuất file
    public enum ExportFormat
    {
        Excel,
        Csv
    }
}
