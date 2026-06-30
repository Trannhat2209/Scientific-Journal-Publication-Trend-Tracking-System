using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Export;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly IExportService _exportService;
    private readonly ITrendingService _trendingService;

    public DashboardController(IDashboardService dashboardService, IExportService exportService, ITrendingService trendingService)
    {
        _dashboardService = dashboardService;
        _exportService = exportService;
        _trendingService = trendingService;
    }

    [HttpGet("user-summary")]
    [Authorize]
    public async Task<IActionResult> GetUserSummary([FromServices] AppDbContext context, [FromServices] IRecommendationService recommendationService)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var dbUser = await context.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);
        if (dbUser == null) return Unauthorized();

        var bookmarksCount = await context.Bookmarks.CountAsync(b => b.UserId == userId);
        var followsCount = await context.Follows.CountAsync(f => f.UserId == userId);
        var unreadAlerts = await context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

        object recommendations = new List<object>();
        if (dbUser.Role == ScientificJournal.Common.Enums.UserRole.Lecturer || dbUser.Role == ScientificJournal.Common.Enums.UserRole.Researcher)
        {
            recommendations = await recommendationService.GetRecommendationsForUserAsync(userId, 5);
        }

        return Ok(new
        {
            userId = dbUser.Id,
            fullName = dbUser.FullName,
            role = dbUser.Role.ToString(),
            isPro = dbUser.IsPro,
            bookmarksCount,
            followsCount,
            unreadAlerts,
            recommendations
        });
    }

    [HttpGet("stats")]
    [HttpGet("overview")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _dashboardService.GetStatsAsync();
        return Ok(result);
    }

    [HttpGet("growth")]
    public async Task<IActionResult> GetGrowth()
    {
        var result = await _dashboardService.GetGrowthDataAsync();
        return Ok(result);
    }

    [HttpGet("top-keywords")]
    public async Task<IActionResult> GetTopKeywords([FromQuery] int limit = 10)
    {
        var result = await _trendingService.GetTopKeywordsAsync(limit);
        return Ok(result);
    }

    [HttpGet("top-journals")]
    public async Task<IActionResult> GetTopJournals([FromQuery] int limit = 10)
    {
        var result = await _dashboardService.GetTopJournalsAsync(limit);
        return Ok(result);
    }

    [HttpGet("top-authors")]
    public async Task<IActionResult> GetTopAuthors([FromQuery] int limit = 10)
    {
        var result = await _dashboardService.GetTopAuthorsAsync(limit);
        return Ok(result);
    }


    [HttpPost("export")]
    public async Task<IActionResult> Export([FromBody] ExportRequestDto request)
    {
        var bytes = await _exportService.ExportTrendReportAsync(request);
        return File(bytes, "text/csv", $"trend-report-{request.Keyword}.csv");
    }
}

