using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces
{
    // Interface định nghĩa các thao tác với bảng follows
    public interface IFollowRepository
    {
        // Lấy danh sách follow của user
        Task<List<Follow>> GetFollowsByUserAsync(Guid userId);

        // Kiểm tra user đã follow target này chưa
        Task<bool> ExistsAsync(Guid userId, string followType, Guid targetId);

        // Thêm follow mới
        Task<Follow> AddAsync(Follow follow);

        // Xoá follow theo ID và userId
        Task<bool> DeleteAsync(Guid id, Guid userId);
    }
}
