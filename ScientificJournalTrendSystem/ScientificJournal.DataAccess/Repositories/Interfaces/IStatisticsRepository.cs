namespace ScientificJournal.DataAccess.Repositories.Interfaces
{
    // Interface tổng hợp số liệu thống kê hệ thống cho Admin
    // Tách riêng để không vi phạm Single Responsibility
    public interface IStatisticsRepository
    {
        Task<int> CountUsersAsync();
        Task<int> CountPublicationsAsync();
        Task<int> CountJournalsAsync();
        Task<int> CountBookmarksAsync();
        Task<int> CountFollowsAsync();
        Task<int> CountNotificationsAsync();
        Task<int> CountUnreadNotificationsAsync();
        Task<int> CountSyncLogsAsync();
    }
}
