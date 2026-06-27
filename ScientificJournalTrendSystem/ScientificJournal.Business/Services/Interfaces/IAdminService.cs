using ScientificJournal.Common.DTOs.Request;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;

namespace ScientificJournal.Business.Services.Interfaces
{
    // Interface định nghĩa nghiệp vụ quản trị hệ thống
    public interface IAdminService
    {
        // Lấy thống kê tổng quan hệ thống
        Task<StatisticsResponseDto> GetStatisticsAsync();

        // Lấy danh sách tất cả user
        Task<IEnumerable<AdminUserResponseDto>> GetUsersAsync(int page, int pageSize);

        // Cập nhật trạng thái kích hoạt / vô hiệu hoá user
        Task<ApiResponse<object>> UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequestDto request);
    }
}
