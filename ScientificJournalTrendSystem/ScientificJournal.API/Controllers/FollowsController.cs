using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/follows")]
[Authorize]
[VerifiedAcademicUser]
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

    [HttpGet("topics")]
    public async Task<IActionResult> GetAvailableTopics([FromServices] AppDbContext context)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var followedIds = await context.Follows.Where(f => f.UserId == userId && f.FollowType == ScientificJournal.Common.Enums.FollowType.Topic).Select(f => f.FollowTargetId).ToListAsync();
        var topics = await context.ResearchTopics.AsNoTracking().Where(t => t.IsActive && !followedIds.Contains(t.Id))
            .OrderByDescending(t => t.Keywords.SelectMany(k => k.PublicationKeywords).Count()).ThenBy(t => t.Name).Take(20)
            .Select(t => new { t.Id, t.Name, t.Description }).ToListAsync();
        return Ok(new { items = topics });
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

    [HttpPost("topic/{topicId:int}")]
    public async Task<IActionResult> FollowTopic(int topicId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        await _followService.FollowTopicAsync(userId, topicId);
        return Ok(new { message = "Research topic followed successfully." });
    }

    [HttpDelete("topic/{topicId:int}")]
    public async Task<IActionResult> UnfollowTopic(int topicId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        await _followService.UnfollowTopicAsync(userId, topicId);
        return Ok(new { message = "Research topic unfollowed successfully." });
    }

    private bool TryGetUserId(out int userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(value, out userId);
    }
}

