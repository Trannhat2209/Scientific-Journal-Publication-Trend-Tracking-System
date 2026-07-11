using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/follows")]
[Authorize]
public class FollowsController : ControllerBase
{
    private readonly IFollowService _followService;

    public FollowsController(IFollowService followService)
    {
        _followService = followService;
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromServices] AppDbContext context)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var followedKeywordIds = await context.Follows
            .Where(f => f.UserId == userId && f.FollowType == ScientificJournal.Common.Enums.FollowType.Keyword)
            .Select(f => f.FollowTargetId)
            .ToListAsync();

        var suggestions = await context.Keywords
            .Where(k => !followedKeywordIds.Contains(k.Id))
            .Take(10)
            .Select(k => new { k.Id, k.Term })
            .ToListAsync();

        return Ok(suggestions);
    }

    [HttpGet]
    public async Task<IActionResult> GetFollows()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var result = await _followService.GetUserFollowsAsync(userId);
        return Ok(result);
    }

    [HttpPost("keyword/{keywordId:int}")]
    public async Task<IActionResult> FollowKeyword(int keywordId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        await _followService.FollowKeywordAsync(userId, keywordId);
        return Ok(new { message = "Keyword followed successfully." });
    }

    [HttpDelete("keyword/{keywordId:int}")]
    public async Task<IActionResult> UnfollowKeyword(int keywordId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        await _followService.UnfollowKeywordAsync(userId, keywordId);
        return Ok(new { message = "Keyword unfollowed successfully." });
    }

    [HttpPost("journal/{journalId:int}")]
    public async Task<IActionResult> FollowJournal(int journalId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        await _followService.FollowJournalAsync(userId, journalId);
        return Ok(new { message = "Journal followed successfully." });
    }

    [HttpDelete("journal/{journalId:int}")]
    public async Task<IActionResult> UnfollowJournal(int journalId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        await _followService.UnfollowJournalAsync(userId, journalId);
        return Ok(new { message = "Journal unfollowed successfully." });
    }
}

