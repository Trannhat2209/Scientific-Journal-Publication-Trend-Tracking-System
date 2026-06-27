using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Constants;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.Business.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;
        public NotificationService(INotificationRepository repo) => _repo = repo;

        // Lấy tất cả thông báo của user, mới nhất lên đầu
        public async Task<IEnumerable<NotificationResponseDto>> GetAllAsync(Guid userId)
        {
            var list = await _repo.GetByUserAsync(userId);
            return list.Select(n => new NotificationResponseDto(
                n.Id, n.PublicationId, n.Message, n.NotificationType, n.IsRead, n.CreatedAt
            ));
        }

        // Cập nhật trạng thái đọc hoặc chưa đọc của thông báo
        public async Task<ApiResponse<object>> MarkReadAsync(Guid notificationId, Guid userId, bool isRead)
        {
            var success = isRead
                ? await _repo.MarkReadAsync(notificationId, userId)
                : await _repo.MarkUnreadAsync(notificationId, userId);

            if (!success)
                return ApiResponse.Fail(ErrorMessages.NotificationNotFound);

            var msg = isRead ? "Đã đánh dấu là đã đọc." : "Đã đánh dấu là chưa đọc.";
            return ApiResponse.Ok<object>(null!, msg);
        }

        // Tạo thông báo mới và lưu vào database
        // Sửa lỗi: trước đây tạo entity nhưng không lưu vào DB
        public async Task CreateNotificationAsync(Guid userId, Guid? publicationId, string message, string type)
        {
            var entity = new Notification
            {
                UserId           = userId,
                PublicationId    = publicationId,
                Message          = message,
                NotificationType = type,
                IsRead           = false,
                CreatedAt        = DateTime.UtcNow
            };
            await _repo.AddAsync(entity);
        }
    }
}
