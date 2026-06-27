using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces
{
    // Interface định nghĩa các thao tác với bảng sync_logs
    public interface ISyncLogRepository
    {
        // Lấy danh sách sync log, lọc theo trạng thái và phân trang
        Task<List<SyncLog>> GetAllAsync(string? status, int page, int pageSize);

        // Lấy sync log gần nhất
        Task<SyncLog?> GetLatestAsync();

        // Lấy sync log theo trạng thái
        Task<List<SyncLog>> GetByStatusAsync(string status);

        // Tạo bản ghi sync log mới
        Task<SyncLog> AddAsync(SyncLog syncLog);

        // Cập nhật trạng thái sync log sau khi đồng bộ xong
        Task<bool> UpdateAsync(SyncLog syncLog);
    }
}
