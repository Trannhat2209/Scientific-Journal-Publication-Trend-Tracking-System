using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Constants;
using ScientificJournal.Common.DTOs.Request;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.Common.Exceptions;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.Business.Services.Implementations
{
    public class BookmarkService : IBookmarkService
    {
        private readonly IBookmarkRepository _repo;
        public BookmarkService(IBookmarkRepository repo) => _repo = repo;

        // Lấy danh sách bài báo đã lưu của user
        public async Task<IEnumerable<BookmarkResponseDto>> GetAllAsync(Guid userId)
        {
            var list = await _repo.GetByUserAsync(userId);
            return list.Select(b => new BookmarkResponseDto(
                b.Id,
                b.PublicationId,
                b.Publication?.Title ?? string.Empty,
                b.Publication?.Doi,
                b.Publication?.PublicationYear ?? 0,
                b.Publication?.Journal?.Name,
                b.CreatedAt
            ));
        }

        // Lưu bài báo vào bookmark, kiểm tra trùng lặp trước khi thêm
        public async Task<ApiResponse<BookmarkResponseDto>> AddAsync(Guid userId, CreateBookmarkRequestDto request)
        {
            var exists = await _repo.ExistsAsync(userId, request.PublicationId);
            if (exists)
                return new ApiResponse<BookmarkResponseDto>(false, ErrorMessages.BookmarkAlreadyExists, null);

            var entity = new Bookmark
            {
                UserId        = userId,
                PublicationId = request.PublicationId,
                CreatedAt     = DateTime.UtcNow
            };

            var created = await _repo.AddAsync(entity);

            // Sửa lỗi: kiểm tra null thay vì dùng ! - ném NotFoundException nếu không tìm thấy
            var full = await _repo.GetByIdAsync(created.Id)
                ?? throw new NotFoundException("Không thể tải bookmark vừa tạo.");

            var result = new BookmarkResponseDto(
                full.Id,
                full.PublicationId,
                full.Publication?.Title ?? string.Empty,
                full.Publication?.Doi,
                full.Publication?.PublicationYear ?? 0,
                full.Publication?.Journal?.Name,
                full.CreatedAt
            );
            return ApiResponse.Ok(result, "Đã lưu bài báo thành công.");
        }

        // Xoá bookmark, chỉ cho phép xoá của chính user đó
        public async Task<ApiResponse<object>> RemoveAsync(Guid bookmarkId, Guid userId)
        {
            var deleted = await _repo.DeleteAsync(bookmarkId, userId);
            return deleted
                ? ApiResponse.Ok<object>(null!, "Đã xoá bookmark thành công.")
                : ApiResponse.Fail(ErrorMessages.BookmarkNotFound);
        }
    }
}
