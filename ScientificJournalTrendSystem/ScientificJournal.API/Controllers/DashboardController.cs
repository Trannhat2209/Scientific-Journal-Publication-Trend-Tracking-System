using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Export;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Policies;
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
            plan = dbUser.IsPro ? "Pro" : "Free",
            searchAccuracy = PlanPolicy.GetSearchAccuracy(dbUser.Role, dbUser.IsPro),
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

    [HttpGet("report-preview")]
    public async Task<IActionResult> GetReportPreview(
        [FromServices] AppDbContext context,
        [FromQuery] string? keyword,
        [FromQuery] int fromYear = 2018,
        [FromQuery] int toYear = 2023)
    {
        if (fromYear <= 0 && toYear <= 0)
        {
            toYear = DateTime.UtcNow.Year;
            fromYear = toYear - 4;
        }
        else if (fromYear <= 0)
        {
            fromYear = toYear - 4;
        }
        else if (toYear <= 0)
        {
            toYear = DateTime.UtcNow.Year;
        }

        if (fromYear > toYear)
        {
            (fromYear, toYear) = (toYear, fromYear);
        }

        var keywordText = (keyword ?? string.Empty).Trim();
        var normalizedKeyword = keywordText.ToLowerInvariant();

        var query = context.Publications
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.Year >= fromYear && p.Year <= toYear);

        if (!string.IsNullOrWhiteSpace(keywordText))
        {
            query = query.Where(p =>
                p.Title.Contains(keywordText) ||
                (p.Abstract != null && p.Abstract.Contains(keywordText)) ||
                p.PublicationKeywords.Any(pk =>
                    pk.Keyword != null &&
                    (pk.Keyword.Term.Contains(keywordText) ||
                     pk.Keyword.NormalizedTerm.Contains(normalizedKeyword))) ||
                p.PublicationAuthors.Any(pa =>
                    pa.Author != null && pa.Author.Name.Contains(keywordText)));
        }

        var publications = await query
            .Select(p => new
            {
                p.Id,
                p.Year,
                p.CitationCount
            })
            .ToListAsync();

        var publicationIds = publications.Select(p => p.Id).ToHashSet();
        var yearlyCounts = Enumerable.Range(fromYear, toYear - fromYear + 1)
            .Select(year => new
            {
                year,
                publicationCount = publications.Count(p => p.Year == year)
            })
            .ToList();

        var growthRates = yearlyCounts
            .Zip(yearlyCounts.Skip(1), (previous, current) =>
                previous.publicationCount > 0
                    ? ((current.publicationCount - previous.publicationCount) / (double)previous.publicationCount) * 100
                    : current.publicationCount > 0 ? 100 : 0)
            .ToList();

        var topAuthors = publicationIds.Count == 0
            ? new List<object>()
            : await context.PublicationAuthors
                .AsNoTracking()
                .Where(pa => publicationIds.Contains(pa.PublicationId) && pa.Author != null)
                .GroupBy(pa => pa.Author!.Name)
                .Select(group => new
                {
                    name = group.Key,
                    publications = group.Select(pa => pa.PublicationId).Distinct().Count()
                })
                .OrderByDescending(author => author.publications)
                .ThenBy(author => author.name)
                .Take(5)
                .Select(author => new
                {
                    author.name,
                    author.publications,
                    trendScore = Math.Round(author.publications * 100.0 / Math.Max(1, publications.Count), 1)
                })
                .Cast<object>()
                .ToListAsync();

        return Ok(new
        {
            keyword = keywordText,
            fromYear,
            toYear,
            yearlyCounts,
            totalPublications = publications.Count,
            averageGrowthRate = Math.Round(growthRates.Count == 0 ? 0 : growthRates.Average(), 1),
            averageCitationsPerPaper = Math.Round(publications.Count == 0 ? 0 : publications.Average(p => p.CitationCount), 1),
            topAuthors
        });
    }


    [HttpPost("export")]
    public async Task<IActionResult> Export([FromBody] ExportRequestDto request)
    {
        var bytes = await _exportService.ExportTrendReportAsync(request);
        var safeKeyword = string.IsNullOrWhiteSpace(request.Keyword)
            ? "all"
            : string.Concat(request.Keyword.Where(ch => char.IsLetterOrDigit(ch) || ch == '-' || ch == '_'));
        if (request.Format == ExportFormat.Excel)
        {
            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"trend-report-{safeKeyword}.xlsx");
        }

        return File(bytes, "text/csv; charset=utf-8", $"trend-report-{safeKeyword}.csv");
    }
}

