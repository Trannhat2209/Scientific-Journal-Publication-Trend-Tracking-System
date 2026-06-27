using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations
{
    public class FollowRepository : IFollowRepository
    {
        private readonly AppDbContext _db;
        public FollowRepository(AppDbContext db) => _db = db;

        // Lấy toàn bộ danh sách follow của user
        public async Task<List<Follow>> GetFollowsByUserAsync(Guid userId)
            => await _db.Follows
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

        // Kiểm tra user đã follow target này chưa để tránh trùng lặp
        public async Task<bool> ExistsAsync(Guid userId, string followType, Guid targetId)
            => await _db.Follows
                .AnyAsync(f =>
                    f.UserId == userId &&
                    f.FollowType == followType &&
                    f.FollowTargetId == targetId);

        // Thêm bản ghi follow mới vào database
        public async Task<Follow> AddAsync(Follow follow)
        {
            _db.Follows.Add(follow);
            await _db.SaveChangesAsync();
            return follow;
        }

        // Xoá follow theo ID, chỉ cho phép xoá của chính user đó
        public async Task<bool> DeleteAsync(Guid id, Guid userId)
        {
            var entity = await _db.Follows
                .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
            if (entity is null) return false;
            _db.Follows.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
