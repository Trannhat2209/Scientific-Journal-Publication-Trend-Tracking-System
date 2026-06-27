using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;

namespace ScientificJournal.Business.Services.Interfaces
{
    // Interface định nghĩa nghiệp vụ thông báo
    public interface INotificationService
    {
        // Lấy tất cả thông báo của user
        Task<IEnumerable<NotificationResponseDto>> GetAllAsync(Guid userId);

        // Đánh dấu thông báo là đã đọc hoặc chưa đọc
        Task<ApiResponse<object>> MarkReadAsync(Guid notificationId, Guid userId, bool isRead);

        // Tạo thông báo mới khi có publication khớp follow của user
        Task CreateNotificationAsync(Guid userId, Guid? publicationId, string message, string type);
    }
}
