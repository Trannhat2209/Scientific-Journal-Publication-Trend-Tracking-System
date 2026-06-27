using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AppDbContext _db;
        public NotificationRepository(AppDbContext db) => _db = db;

        // Lấy tất cả thông báo của user, mới nhất lên đầu
        public async Task<List<Notification>> GetByUserAsync(Guid userId)
            => await _db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

        // Lấy danh sách thông báo chưa đọc của user
        public async Task<List<Notification>> GetUnreadByUserAsync(Guid userId)
            => await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

        // Thêm notification mới vào database
        public async Task<Notification> AddAsync(Notification notification)
        {
            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();
            return notification;
        }

        // Đánh dấu một thông báo là đã đọc
        public async Task<bool> MarkReadAsync(Guid id, Guid userId)
        {
            var entity = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (entity is null) return false;
            entity.IsRead = true;
            await _db.SaveChangesAsync();
            return true;
        }

        // Đánh dấu một thông báo là chưa đọc
        public async Task<bool> MarkUnreadAsync(Guid id, Guid userId)
        {
            var entity = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (entity is null) return false;
            entity.IsRead = false;
            await _db.SaveChangesAsync();
            return true;
        }

        // Đánh dấu tất cả thông báo của user là đã đọc
        public async Task MarkAllReadAsync(Guid userId)
        {
            var list = await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();
            list.ForEach(n => n.IsRead = true);
            await _db.SaveChangesAsync();
        }
    }
}
