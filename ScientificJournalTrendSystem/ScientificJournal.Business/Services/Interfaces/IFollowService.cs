using ScientificJournal.Common.DTOs.Request;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;

namespace ScientificJournal.Business.Services.Interfaces
{
    // Interface định nghĩa nghiệp vụ follow keyword/journal
    public interface IFollowService
    {
        // Lấy danh sách keyword và journal đang follow
        Task<IEnumerable<FollowResponseDto>> GetAllAsync(Guid userId);

        // Follow một keyword hoặc journal
        Task<ApiResponse<FollowResponseDto>> FollowAsync(Guid userId, CreateFollowRequestDto request);

        // Huỷ follow
        Task<ApiResponse<object>> UnfollowAsync(Guid followId, Guid userId);
    }
}
