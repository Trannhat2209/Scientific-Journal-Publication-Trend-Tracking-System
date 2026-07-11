using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.Common.Policies;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user == null)
        {
            return NotFound("User profile not found.");
        }

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FullName,
            Role = user.Role.ToString(),
            user.IsActive,
            user.IsPro,
            IsTrialActive = user.IsInFreeTrial(),
            Plan = user.IsPro ? "Pro" : (user.IsInFreeTrial() ? "Pro (Free Trial)" : "Free"),
            SearchAccuracy = PlanPolicy.GetSearchAccuracy(user.Role, user.HasProAccess()),
            user.CreatedAt
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);
        if (user == null)
        {
            return NotFound("User profile not found.");
        }

        user.FullName = request.FullName;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated successfully.", fullName = user.FullName });
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var bookmarksCount = await _context.Bookmarks.CountAsync(b => b.UserId == userId);
        var followsCount = await _context.Follows.CountAsync(f => f.UserId == userId);
        var totalNotifications = await _context.Notifications.CountAsync(n => n.UserId == userId);
        var unreadNotifications = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

        return Ok(new
        {
            bookmarks = bookmarksCount,
            follows = followsCount,
            notifications = totalNotifications,
            unreadNotifications = unreadNotifications
        });
    }
}

public class UpdateProfileDto
{
    public string FullName { get; set; } = string.Empty;
}
