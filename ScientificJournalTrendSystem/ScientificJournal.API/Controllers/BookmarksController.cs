using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/bookmarks")]
[Authorize]
public class BookmarksController : ControllerBase
{
    private readonly IBookmarkService _bookmarkService;

    public BookmarksController(IBookmarkService bookmarkService)
    {
        _bookmarkService = bookmarkService;
    }

    [HttpGet]
    public async Task<IActionResult> GetBookmarks()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var result = await _bookmarkService.GetBookmarksAsync(userId);
        return Ok(result);
    }

    [HttpPost("{publicationId:int}")]
    public async Task<IActionResult> AddBookmark(int publicationId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        await _bookmarkService.AddBookmarkAsync(userId, publicationId);
        return Ok(new { message = "Bookmark added successfully." });
    }

    [HttpDelete("{publicationId:int}")]
    public async Task<IActionResult> RemoveBookmark(int publicationId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        await _bookmarkService.RemoveBookmarkAsync(userId, publicationId);
        return Ok(new { message = "Bookmark removed successfully." });
    }
}

