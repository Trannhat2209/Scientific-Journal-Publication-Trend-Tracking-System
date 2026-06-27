using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request;

namespace ScientificJournal.API.Controllers
{
    [ApiController]
    [Route("follows")]
    [Authorize]
    [Produces("application/json")]
    public class FollowsController : ControllerBase
    {
        private readonly IFollowService _service;
        public FollowsController(IFollowService service) => _service = service;

        // Xem toàn bộ danh sách keyword và journal đang follow
        [HttpGet]
        public async Task<IActionResult> GetFollows()
        {
            var userId = LayUserId();
            var result = await _service.GetAllAsync(userId);
            return Ok(result);
        }

        // Follow một keyword hoặc journal
        [HttpPost]
        public async Task<IActionResult> CreateFollow([FromBody] CreateFollowRequestDto request)
        {
            var userId = LayUserId();
            var result = await _service.FollowAsync(userId, request);
            if (!result.Success)
            {
                if (result.Message!.Contains("đã follow")) return Conflict(result);
                return BadRequest(result);
            }
            return Created(string.Empty, result);
        }

        // Huỷ follow một keyword hoặc journal theo ID
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteFollow(Guid id)
        {
            var userId = LayUserId();
            var result = await _service.UnfollowAsync(id, userId);
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
