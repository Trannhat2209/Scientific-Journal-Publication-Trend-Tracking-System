using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _db;
        public UserRepository(AppDbContext db) => _db = db;

        // Lấy danh sách user chưa bị xoá mềm, sắp xếp theo tên và phân trang
        public async Task<List<User>> GetAllAsync(int page, int pageSize)
            => await _db.Users
                .Where(u => !u.IsDeleted)
                .OrderBy(u => u.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

        // Đếm tổng số user chưa bị xoá
        public async Task<int> CountAsync()
            => await _db.Users.CountAsync(u => !u.IsDeleted);

        // Cập nhật trạng thái kích hoạt hoặc vô hiệu hoá tài khoản
        public async Task<bool> UpdateStatusAsync(Guid id, bool isActive)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
            if (user is null) return false;
            user.IsActive  = isActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
