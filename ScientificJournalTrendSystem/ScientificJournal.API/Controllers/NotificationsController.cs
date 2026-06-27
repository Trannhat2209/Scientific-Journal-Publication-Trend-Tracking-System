using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.API.Controllers
{
    [ApiController]
    [Route("notifications")]
    [Authorize]
    [Produces("application/json")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _service;
        public NotificationsController(INotificationService service) => _service = service;

        // Lấy tất cả thông báo của user hiện tại
        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = LayUserId();
            var result = await _service.GetAllAsync(userId);
            return Ok(result);
        }

        // Cập nhật trạng thái đọc hoặc chưa đọc của thông báo
        [HttpPut("{id:guid}/read")]
        public async Task<IActionResult> UpdateReadStatus(Guid id, [FromQuery] bool isRead = true)
        {
            var userId = LayUserId();
            var result = await _service.MarkReadAsync(id, userId, isRead);
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
