using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations
{
    public class StatisticsRepository : IStatisticsRepository
    {
        private readonly AppDbContext _db;
        public StatisticsRepository(AppDbContext db) => _db = db;

        // Đếm tổng số user chưa bị xoá mềm
        public async Task<int> CountUsersAsync()
            => await _db.Users.CountAsync(u => !u.IsDeleted);

        // Đếm tổng số publication chưa bị xoá mềm
        public async Task<int> CountPublicationsAsync()
            => await _db.Publications.CountAsync(p => !p.IsDeleted);

        // Đếm tổng số journal chưa bị xoá mềm
        public async Task<int> CountJournalsAsync()
            => await _db.Journals.CountAsync(j => !j.IsDeleted);

        // Đếm tổng số bookmark trong hệ thống
        public async Task<int> CountBookmarksAsync()
            => await _db.Bookmarks.CountAsync();

        // Đếm tổng số follow trong hệ thống
        public async Task<int> CountFollowsAsync()
            => await _db.Follows.CountAsync();

        // Đếm tổng số notification trong hệ thống
        public async Task<int> CountNotificationsAsync()
            => await _db.Notifications.CountAsync();

        // Đếm số notification chưa được đọc
        public async Task<int> CountUnreadNotificationsAsync()
            => await _db.Notifications.CountAsync(n => !n.IsRead);

        // Đếm tổng số sync log trong hệ thống
        public async Task<int> CountSyncLogsAsync()
            => await _db.SyncLogs.CountAsync();
    }
}
