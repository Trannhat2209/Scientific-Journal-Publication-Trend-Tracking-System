using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request;

namespace ScientificJournal.API.Controllers
{
    [ApiController]
    [Route("bookmarks")]
    [Authorize]
    [Produces("application/json")]
    public class BookmarksController : ControllerBase
    {
        private readonly IBookmarkService _service;
        public BookmarksController(IBookmarkService service) => _service = service;

        // Xem danh sách tất cả bài báo đã lưu của user hiện tại
        [HttpGet]
        public async Task<IActionResult> GetBookmarks()
        {
            var userId = LayUserId();
            var result = await _service.GetAllAsync(userId);
            return Ok(result);
        }

        // Lưu một bài báo vào danh sách bookmark
        [HttpPost]
        public async Task<IActionResult> CreateBookmark([FromBody] CreateBookmarkRequestDto request)
        {
            var userId = LayUserId();
            var result = await _service.AddAsync(userId, request);
            if (!result.Success) return Conflict(result);
            return Created(string.Empty, result);
        }

        // Xoá bài báo đã lưu theo ID bookmark
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteBookmark(Guid id)
        {
            var userId = LayUserId();
            var result = await _service.RemoveAsync(id, userId);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        private Guid LayUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue("sub")
                      ?? throw new UnauthorizedAccessException("Không tìm thấy thông tin user trong token.");
            return Guid.Parse(sub);
        }
    }
}
