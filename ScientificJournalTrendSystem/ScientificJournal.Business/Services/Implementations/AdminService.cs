using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Constants;
using ScientificJournal.Common.DTOs.Request;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.Business.Services.Implementations
{
    // Sửa vi phạm: bỏ inject AppDbContext, thay bằng các Repository đúng tầng
    public class AdminService : IAdminService
    {
        private readonly IUserRepository         _userRepo;
        private readonly IStatisticsRepository   _statsRepo;

        public AdminService(IUserRepository userRepo, IStatisticsRepository statsRepo)
        {
            _userRepo  = userRepo;
            _statsRepo = statsRepo;
        }

        // Lấy thống kê tổng quan hệ thống qua StatisticsRepository
        public async Task<StatisticsResponseDto> GetStatisticsAsync()
        {
            var totalUsers         = await _statsRepo.CountUsersAsync();
            var totalPublications  = await _statsRepo.CountPublicationsAsync();
            var totalJournals      = await _statsRepo.CountJournalsAsync();
            var totalBookmarks     = await _statsRepo.CountBookmarksAsync();
            var totalFollows       = await _statsRepo.CountFollowsAsync();
            var totalNotifications = await _statsRepo.CountNotificationsAsync();
            var unread             = await _statsRepo.CountUnreadNotificationsAsync();
            var totalSyncLogs      = await _statsRepo.CountSyncLogsAsync();

            return new StatisticsResponseDto(
                totalUsers, totalPublications, totalJournals,
                totalBookmarks, totalFollows,
                totalNotifications, unread,
                totalSyncLogs, DateTime.UtcNow
            );
        }

        // Lấy danh sách tất cả user, hỗ trợ phân trang
        public async Task<IEnumerable<AdminUserResponseDto>> GetUsersAsync(int page, int pageSize)
        {
            var list = await _userRepo.GetAllAsync(page, pageSize);
            return list.Select(u => new AdminUserResponseDto(
                u.Id, u.FullName, u.Email, u.Role,
                u.IsActive, u.LastLoginAt, u.CreatedAt
            ));
        }

        // Kích hoạt hoặc vô hiệu hoá tài khoản user
        public async Task<ApiResponse<object>> UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequestDto request)
        {
            var updated = await _userRepo.UpdateStatusAsync(userId, request.IsActive);
            if (!updated)
                return ApiResponse.Fail(ErrorMessages.UserNotFound);

            var msg = request.IsActive ? "Đã kích hoạt tài khoản." : "Đã vô hiệu hoá tài khoản.";
            return ApiResponse.Ok<object>(null!, msg);
        }
    }
}
