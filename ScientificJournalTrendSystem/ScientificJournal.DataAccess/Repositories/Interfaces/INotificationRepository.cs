using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces
{
    // Interface định nghĩa các thao tác với bảng notifications
    public interface INotificationRepository
    {
        // Lấy tất cả thông báo của user, mới nhất lên đầu
        Task<List<Notification>> GetByUserAsync(Guid userId);

        // Lấy danh sách thông báo chưa đọc của user
        Task<List<Notification>> GetUnreadByUserAsync(Guid userId);

        // Thêm notification mới vào database
        Task<Notification> AddAsync(Notification notification);

        // Đánh dấu một thông báo là đã đọc
        Task<bool> MarkReadAsync(Guid id, Guid userId);

        // Đánh dấu một thông báo là chưa đọc
        Task<bool> MarkUnreadAsync(Guid id, Guid userId);

        // Đánh dấu tất cả thông báo của user là đã đọc
        Task MarkAllReadAsync(Guid userId);
    }
}
