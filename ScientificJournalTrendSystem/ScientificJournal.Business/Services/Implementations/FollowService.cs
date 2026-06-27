using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Constants;
using ScientificJournal.Common.DTOs.Request;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.Business.Services.Implementations
{
    public class FollowService : IFollowService
    {
        private readonly IFollowRepository _repo;
        public FollowService(IFollowRepository repo) => _repo = repo;

        // Lấy toàn bộ danh sách follow của user
        public async Task<IEnumerable<FollowResponseDto>> GetAllAsync(Guid userId)
        {
            var list = await _repo.GetFollowsByUserAsync(userId);
            return list.Select(f => new FollowResponseDto(
                f.Id, f.FollowType, f.FollowTargetId, f.FollowTargetName, f.CreatedAt
            ));
        }

        // Follow keyword hoặc journal, kiểm tra hợp lệ và trùng lặp
        public async Task<ApiResponse<FollowResponseDto>> FollowAsync(Guid userId, CreateFollowRequestDto request)
        {
            var loaiHopLe = new[] { "Keyword", "Journal" };
            if (!loaiHopLe.Contains(request.FollowType))
                return new ApiResponse<FollowResponseDto>(false, ErrorMessages.FollowTypeInvalid, null);

            var exists = await _repo.ExistsAsync(userId, request.FollowType, request.FollowTargetId);
            if (exists)
                return new ApiResponse<FollowResponseDto>(false, ErrorMessages.FollowAlreadyExists, null);

            var entity = new Follow
            {
                UserId           = userId,
                FollowType       = request.FollowType,
                FollowTargetId   = request.FollowTargetId,
                FollowTargetName = request.FollowTargetName,
                CreatedAt        = DateTime.UtcNow
            };

            var created = await _repo.AddAsync(entity);
            var result  = new FollowResponseDto(
                created.Id, created.FollowType, created.FollowTargetId, created.FollowTargetName, created.CreatedAt
            );
            return ApiResponse.Ok(result, $"Đã follow {request.FollowType}: {request.FollowTargetName}.");
        }

        // Huỷ follow, chỉ cho phép xoá của chính user đó
        public async Task<ApiResponse<object>> UnfollowAsync(Guid followId, Guid userId)
        {
            var deleted = await _repo.DeleteAsync(followId, userId);
            return deleted
                ? ApiResponse.Ok<object>(null!, "Đã huỷ follow thành công.")
                : ApiResponse.Fail(ErrorMessages.FollowNotFound);
        }
    }
}
