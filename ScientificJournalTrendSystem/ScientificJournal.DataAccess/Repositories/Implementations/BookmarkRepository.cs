using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations
{
    public class BookmarkRepository : IBookmarkRepository
    {
        private readonly AppDbContext _db;
        public BookmarkRepository(AppDbContext db) => _db = db;

        // Lấy danh sách bookmark của user kèm thông tin publication và journal
        public async Task<List<Bookmark>> GetByUserAsync(Guid userId)
            => await _db.Bookmarks
                .Include(b => b.Publication).ThenInclude(p => p!.Journal)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

        // Lấy một bookmark theo ID kèm publication
        public async Task<Bookmark?> GetByIdAsync(Guid id)
            => await _db.Bookmarks
                .Include(b => b.Publication).ThenInclude(p => p!.Journal)
                .FirstOrDefaultAsync(b => b.Id == id);

        // Kiểm tra user đã bookmark bài báo này chưa
        public async Task<bool> ExistsAsync(Guid userId, Guid publicationId)
            => await _db.Bookmarks
                .AnyAsync(b => b.UserId == userId && b.PublicationId == publicationId);

        // Thêm bookmark mới vào database
        public async Task<Bookmark> AddAsync(Bookmark bookmark)
        {
            _db.Bookmarks.Add(bookmark);
            await _db.SaveChangesAsync();
            return bookmark;
        }

        // Xoá bookmark theo ID, chỉ cho phép xoá của chính user đó
        public async Task<bool> DeleteAsync(Guid id, Guid userId)
        {
            var entity = await _db.Bookmarks
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
            if (entity is null) return false;
            _db.Bookmarks.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
