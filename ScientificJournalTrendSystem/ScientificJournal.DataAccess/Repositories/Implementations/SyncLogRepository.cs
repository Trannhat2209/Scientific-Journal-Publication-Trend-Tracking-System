using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations
{
    public class SyncLogRepository : ISyncLogRepository
    {
        private readonly AppDbContext _db;
        public SyncLogRepository(AppDbContext db) => _db = db;

        // Lấy danh sách sync log, lọc theo trạng thái và phân trang
        public async Task<List<SyncLog>> GetAllAsync(string? status, int page, int pageSize)
            => await _db.SyncLogs
                .Include(s => s.TriggeredByUser)
                .Where(s => status == null || s.Status == status)
                .OrderByDescending(s => s.StartedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

        // Lấy sync log gần nhất
        public async Task<SyncLog?> GetLatestAsync()
            => await _db.SyncLogs
                .OrderByDescending(s => s.StartedAt)
                .FirstOrDefaultAsync();

        // Lấy danh sách sync log theo trạng thái
        public async Task<List<SyncLog>> GetByStatusAsync(string status)
            => await _db.SyncLogs
                .Where(s => s.Status == status)
                .OrderByDescending(s => s.StartedAt)
                .ToListAsync();

        // Tạo bản ghi sync log mới khi trigger đồng bộ
        public async Task<SyncLog> AddAsync(SyncLog syncLog)
        {
            _db.SyncLogs.Add(syncLog);
            await _db.SaveChangesAsync();
            return syncLog;
        }

        // Cập nhật trạng thái sync log sau khi đồng bộ hoàn tất
        public async Task<bool> UpdateAsync(SyncLog syncLog)
        {
            _db.SyncLogs.Update(syncLog);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
