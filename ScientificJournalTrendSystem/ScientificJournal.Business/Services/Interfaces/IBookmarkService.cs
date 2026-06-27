using ScientificJournal.Common.DTOs.Request;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;

namespace ScientificJournal.Business.Services.Interfaces
{
    // Interface định nghĩa nghiệp vụ bookmark
    public interface IBookmarkService
    {
        // Lấy danh sách bài báo đã lưu của user
        Task<IEnumerable<BookmarkResponseDto>> GetAllAsync(Guid userId);

        // Lưu một bài báo vào bookmark
        Task<ApiResponse<BookmarkResponseDto>> AddAsync(Guid userId, CreateBookmarkRequestDto request);

        // Xoá một bookmark
        Task<ApiResponse<object>> RemoveAsync(Guid bookmarkId, Guid userId);
    }
}
