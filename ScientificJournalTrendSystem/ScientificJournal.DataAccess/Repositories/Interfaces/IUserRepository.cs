using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces
{
    // Interface định nghĩa các thao tác với bảng users
    // Dùng cho AdminService thống kê và quản lý user
    public interface IUserRepository
    {
        // Lấy danh sách user chưa bị xoá mềm, hỗ trợ phân trang
        Task<List<User>> GetAllAsync(int page, int pageSize);

        // Đếm tổng số user chưa bị xoá
        Task<int> CountAsync();

        // Cập nhật trạng thái kích hoạt hoặc vô hiệu hoá tài khoản
        Task<bool> UpdateStatusAsync(Guid id, bool isActive);
    }
}
