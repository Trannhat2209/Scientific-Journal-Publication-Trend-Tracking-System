using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Notification;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var result = await _notificationService.GetNotificationsAsync(userId);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        await _notificationService.MarkReadAsync(id);
        return Ok(new { message = "Notification marked as read." });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        await _notificationService.MarkAllReadAsync(userId);
        return Ok(new { message = "All notifications marked as read." });
    }

    [HttpPost("review-result")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> CreateReviewResultNotification([FromBody] ReviewNotificationRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.RecipientEmail))
        {
            return BadRequest(new { message = "Recipient email is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Notification message is required." });
        }

        var notification = await _notificationService.CreateNotificationForEmailAsync(
            request.RecipientEmail,
            request.Message,
            request.NotificationType,
            request.PublicationId);

        if (notification == null)
        {
            return NotFound(new { message = "Recipient user was not found." });
        }

        return Ok(new
        {
            notification.Id,
            notification.Message,
            notification.IsRead,
            NotificationType = notification.NotificationType.ToString(),
            notification.PublicationId,
            notification.CreatedAt
        });
    }
}

