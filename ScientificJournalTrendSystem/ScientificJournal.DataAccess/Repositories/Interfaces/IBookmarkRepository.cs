using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces
{
    // Interface định nghĩa các thao tác với bảng bookmarks
    public interface IBookmarkRepository
    {
        // Lấy danh sách bookmark của user kèm thông tin publication
        Task<List<Bookmark>> GetByUserAsync(Guid userId);

        // Lấy một bookmark theo ID
        Task<Bookmark?> GetByIdAsync(Guid id);

        // Kiểm tra user đã bookmark bài báo này chưa
        Task<bool> ExistsAsync(Guid userId, Guid publicationId);

        // Thêm bookmark mới
        Task<Bookmark> AddAsync(Bookmark bookmark);

        // Xoá bookmark theo ID và userId
        Task<bool> DeleteAsync(Guid id, Guid userId);
    }
}
