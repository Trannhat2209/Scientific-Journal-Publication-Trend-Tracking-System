using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request;

namespace ScientificJournal.API.Controllers
{
    [ApiController]
    [Route("admin")]
    [Authorize(Roles = "Admin")]  // Bật lại - chỉ Admin mới được gọi
    [Produces("application/json")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ISyncService  _syncService;

        public AdminController(IAdminService adminService, ISyncService syncService)
        {
            _adminService = adminService;
            _syncService  = syncService;
        }

        // Kích hoạt đồng bộ dữ liệu từ API bên ngoài
        [HttpPost("sync/trigger")]
        public async Task<IActionResult> TriggerSync([FromBody] TriggerSyncRequestDto request)
        {
            var adminId = LayUserId();
            var result  = await _syncService.TriggerSyncAsync(adminId, request);
            if (!result.Success) return BadRequest(result);
            return Accepted(result);
        }

        // Xem lịch sử đồng bộ dữ liệu
        [HttpGet("sync-logs")]
        public async Task<IActionResult> GetSyncLogs(
            [FromQuery] string? status   = null,
            [FromQuery] int     page     = 1,
            [FromQuery] int     pageSize = 20)
        {
            if (pageSize > 100) pageSize = 100;
            var result = await _syncService.GetSyncLogsAsync(status, page, pageSize);
            return Ok(result);
        }

        // Xem thống kê tổng quan hệ thống
        [HttpGet("stats")]
        public async Task<IActionResult> GetStatistics()
        {
            var result = await _adminService.GetStatisticsAsync();
            return Ok(result);
        }

        // Lấy danh sách tất cả user trong hệ thống
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page     = 1,
            [FromQuery] int pageSize = 20)
        {
            if (pageSize > 100) pageSize = 100;
            var result = await _adminService.GetUsersAsync(page, pageSize);
            return Ok(result);
        }

        // Kích hoạt hoặc vô hiệu hoá tài khoản user
        [HttpPut("users/{id:guid}/status")]
        public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequestDto request)
        {
            var result = await _adminService.UpdateUserStatusAsync(id, request);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        // Lấy userId từ JWT claims - [Authorize] đảm bảo token luôn hợp lệ trước khi vào đây
        private Guid LayUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue("sub")
                      ?? throw new UnauthorizedAccessException("Không tìm thấy thông tin user trong token.");
            return Guid.Parse(sub);
        }
    }
}
