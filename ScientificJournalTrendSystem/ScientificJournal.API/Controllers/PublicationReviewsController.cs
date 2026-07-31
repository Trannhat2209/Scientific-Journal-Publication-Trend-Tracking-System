using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.API.Filters;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/publication-reviews")]
public class PublicationReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PublicationReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetReviews([FromQuery] string publicationKey)
    {
        var key = NormalizeKey(publicationKey);
        if (string.IsNullOrWhiteSpace(key))
        {
            return BadRequest(new { message = "Publication key is required." });
        }

        var reviews = await _context.PublicationReviews
            .AsNoTracking()
            .Where(item => item.PublicationKey == key && !item.IsHidden)
            .OrderByDescending(item => item.UpdatedAt)
            .Select(item => new
            {
                item.Id,
                item.CredibilityRating,
                item.Comment,
                item.ReviewerRole,
                reviewerUserId = item.UserId,
                reviewerName = item.User != null ? item.User.FullName : "ScholarTrend user",
                item.CreatedAt,
                item.UpdatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            publicationKey = key,
            averageCredibility = reviews.Count == 0
                ? 0
                : Math.Round(reviews.Average(item => item.CredibilityRating), 1),
            reviewCount = reviews.Count,
            reviews
        });
    }

    [Authorize]
    [VerifiedAcademicUser]
    [HttpPost]
    public async Task<IActionResult> SaveReview([FromBody] SavePublicationReviewDto request)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var key = NormalizeKey(request.PublicationKey);
        var title = request.PublicationTitle?.Trim() ?? string.Empty;
        var comment = request.Comment?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(title))
        {
            return BadRequest(new { message = "Publication information is required." });
        }
        if (request.CredibilityRating is < 1 or > 5)
        {
            return BadRequest(new { message = "Credibility rating must be between 1 and 5." });
        }
        if (comment.Length < 3)
        {
            return BadRequest(new { message = "Comment must contain at least 3 characters." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId && !item.IsDeleted);
        if (user == null) return Unauthorized();
        if (user.ReviewRestrictedUntil > DateTime.UtcNow)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Review access is temporarily restricted for this account." });
        }
        var recentReviewCount = await _context.PublicationReviews
            .CountAsync(item => item.UserId == userId && item.UpdatedAt >= DateTime.UtcNow.AddMinutes(-1));
        if (recentReviewCount >= 5)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Too many review updates. Please wait one minute." });
        }

        var review = await _context.PublicationReviews
            .FirstOrDefaultAsync(item => item.UserId == userId && item.PublicationKey == key);
        var isNewReview = review == null;
        if (review == null)
        {
            review = new PublicationReview
            {
                UserId = userId,
                PublicationKey = key,
                CreatedAt = DateTime.UtcNow
            };
            _context.PublicationReviews.Add(review);
        }

        review.PublicationTitle = title[..Math.Min(title.Length, 500)];
        review.PublicationAuthors = Truncate(request.PublicationAuthors, 1000);
        review.PublicationAbstract = Truncate(request.PublicationAbstract, 6000);
        review.PublicationSource = Truncate(request.PublicationSource, 300);
        review.PublicationYear = request.PublicationYear;
        review.PublicationDoi = Truncate(request.PublicationDoi, 300);
        review.PublicationUrl = Truncate(request.PublicationUrl, 1200);
        review.CredibilityRating = request.CredibilityRating;
        review.Comment = comment[..Math.Min(comment.Length, 2000)];
        review.ReviewerRole = user.Role.ToString();
        review.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _context.PublicationReviewModerationEvents.Add(new PublicationReviewModerationEvent
        {
            ReviewId = review.Id,
            ModeratorUserId = userId,
            Action = isNewReview ? "create" : "edit",
            Reason = isNewReview ? "Review created" : "Review content updated"
        });
        await _context.SaveChangesAsync();

        return Ok(new { message = "Review saved successfully.", reviewId = review.Id });
    }

    [Authorize]
    [VerifiedAcademicUser]
    [HttpPost("{id:int}/reports")]
    public async Task<IActionResult> ReportReview(int id, [FromBody] ReportPublicationReviewDto request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var review = await _context.PublicationReviews.FirstOrDefaultAsync(item => item.Id == id);
        if (review == null) return NotFound(new { message = "Review not found." });
        if (review.UserId == userId) return BadRequest(new { message = "You cannot report your own review." });
        var reason = Truncate(request.Reason, 500);
        var category = NormalizeReportCategory(request.Category);
        if (category == null) return BadRequest(new { message = "Invalid report category." });
        if (reason.Length < 5) return BadRequest(new { message = "Report reason must contain at least 5 characters." });
        if (await _context.PublicationReviewReports.AnyAsync(item => item.ReviewId == id && item.ReporterUserId == userId))
            return Conflict(new { message = "You already reported this review." });

        _context.PublicationReviewReports.Add(new PublicationReviewReport
        {
            ReviewId = id,
            ReporterUserId = userId,
            Reason = reason,
            Category = category
        });
        review.ReportCount++;
        review.ModerationStatus = "reported";
        await _context.SaveChangesAsync();
        return Ok(new { message = "Review reported for moderation." });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<IActionResult> GetAllReviews([FromQuery] string? reportCategory = null)
    {
        var query = _context.PublicationReviews.AsNoTracking();
        var normalizedCategory = string.IsNullOrWhiteSpace(reportCategory) ? null : NormalizeReportCategory(reportCategory);
        if (!string.IsNullOrWhiteSpace(reportCategory) && normalizedCategory == null)
            return BadRequest(new { message = "Invalid report category." });
        if (normalizedCategory != null)
            query = query.Where(review => _context.PublicationReviewReports.Any(report => report.ReviewId == review.Id && report.Category == normalizedCategory));
        var reviews = await query
            .OrderByDescending(item => item.UpdatedAt)
            .Select(item => new
            {
                item.Id,
                item.PublicationKey,
                item.PublicationTitle,
                item.PublicationAuthors,
                item.PublicationAbstract,
                item.PublicationSource,
                item.PublicationYear,
                item.PublicationDoi,
                item.PublicationUrl,
                item.CredibilityRating,
                item.Comment,
                item.ReviewerRole,
                item.IsHidden,
                item.ModerationReason,
                item.ModeratedAt,
                item.ReportCount,
                item.ModerationStatus,
                reviewerUserId = item.UserId,
                reviewerName = item.User != null ? item.User.FullName : "Unknown user",
                reviewerEmail = item.User != null ? item.User.Email : string.Empty,
                item.CreatedAt,
                item.UpdatedAt
            })
            .ToListAsync();
        return Ok(new { items = reviews, totalCount = reviews.Count });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/report-statistics")]
    public async Task<IActionResult> GetReportStatistics() => Ok(await _context.PublicationReviewReports
        .AsNoTracking()
        .GroupBy(item => item.Category)
        .Select(group => new { category = group.Key, count = group.Count(), unresolved = group.Count(item => item.Status == "reported") })
        .OrderByDescending(item => item.count)
        .ToListAsync());

    [Authorize(Roles = "Admin")]
    [HttpPost("admin/{id:int}/hide")]
    public async Task<IActionResult> HideReview(int id)
    {
        var review = await _context.PublicationReviews.FirstOrDefaultAsync(item => item.Id == id);
        if (review == null) return NotFound(new { message = "Review not found." });
        review.IsHidden = true;
        review.ModerationReason = "Hidden by Administrator";
        review.ModerationStatus = "hidden";
        review.ModeratedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;
        AddModerationEvent(review.Id, "hide", review.ModerationReason);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Review hidden successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("admin/{id:int}/restore")]
    public async Task<IActionResult> RestoreReview(int id)
    {
        var review = await _context.PublicationReviews.FirstOrDefaultAsync(item => item.Id == id);
        if (review == null) return NotFound(new { message = "Review not found." });
        review.IsHidden = false;
        review.ModerationReason = string.Empty;
        review.ModerationStatus = review.ReportCount > 0 ? "reported" : "visible";
        review.ModeratedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;
        AddModerationEvent(review.Id, "restore", "Restored by Administrator");
        await _context.SaveChangesAsync();
        return Ok(new { message = "Review restored successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("admin/{id:int}/resolve-reports")]
    public async Task<IActionResult> ResolveReports(int id, [FromBody] ResolveReviewReportsDto request)
    {
        var review = await _context.PublicationReviews.FirstOrDefaultAsync(item => item.Id == id);
        if (review == null) return NotFound(new { message = "Review not found." });
        var reports = await _context.PublicationReviewReports.Where(item => item.ReviewId == id && item.Status == "reported").ToListAsync();
        foreach (var report in reports) { report.Status = "resolved"; report.ResolvedAt = DateTime.UtcNow; }
        review.ModerationStatus = review.IsHidden ? "hidden" : "resolved";
        review.ModerationReason = Truncate(request.Resolution, 500);
        AddModerationEvent(id, "resolve", review.ModerationReason);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Reports resolved.", resolvedCount = reports.Count });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("admin/users/{userId:int}/restrict")]
    public async Task<IActionResult> RestrictReviewer(int userId, [FromBody] RestrictReviewerDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId && !item.IsDeleted);
        if (user == null) return NotFound(new { message = "User not found." });
        user.ReviewRestrictedUntil = DateTime.UtcNow.AddDays(Math.Clamp(request.Days, 1, 365));
        await _context.SaveChangesAsync();
        return Ok(new { message = "Reviewer restricted.", user.ReviewRestrictedUntil });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/{id:int}/history")]
    public async Task<IActionResult> GetModerationHistory(int id) => Ok(await _context.PublicationReviewModerationEvents
        .AsNoTracking().Where(item => item.ReviewId == id).OrderByDescending(item => item.CreatedAt).ToListAsync());

    private bool TryGetUserId(out int userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(value, out userId);
    }

    private void AddModerationEvent(int reviewId, string action, string reason)
    {
        if (!TryGetUserId(out var moderatorUserId)) return;
        _context.PublicationReviewModerationEvents.Add(new PublicationReviewModerationEvent
        {
            ReviewId = reviewId,
            ModeratorUserId = moderatorUserId,
            Action = action,
            Reason = Truncate(reason, 500)
        });
    }

    private static string NormalizeKey(string? value) =>
        (value ?? string.Empty).Trim().ToLowerInvariant()[..Math.Min((value ?? string.Empty).Trim().Length, 300)];

    private static string Truncate(string? value, int length)
    {
        var normalized = value?.Trim() ?? string.Empty;
        return normalized[..Math.Min(normalized.Length, length)];
    }

    private static string? NormalizeReportCategory(string? value)
    {
        var category = (value ?? string.Empty).Trim().ToLowerInvariant().Replace(' ', '_').Replace('-', '_');
        return category switch
        {
            "spam" or "harassment" or "misinformation" or "conflict_of_interest" or "off_topic" or "plagiarism" or "other" => category,
            _ => null
        };
    }
}

public class SavePublicationReviewDto
{
    [Required]
    public string PublicationKey { get; set; } = string.Empty;
    [Required]
    public string PublicationTitle { get; set; } = string.Empty;
    public string? PublicationAuthors { get; set; }
    public string? PublicationAbstract { get; set; }
    public string? PublicationSource { get; set; }
    public int? PublicationYear { get; set; }
    public string? PublicationDoi { get; set; }
    public string? PublicationUrl { get; set; }
    [Range(1, 5)]
    public int CredibilityRating { get; set; }
    [Required]
    [MinLength(3)]
    [MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;
}

public sealed class ReportPublicationReviewDto
{
    public string Category { get; set; } = "other";
    public string Reason { get; set; } = string.Empty;
}
public sealed class ResolveReviewReportsDto { public string Resolution { get; set; } = string.Empty; }
public sealed class RestrictReviewerDto { public int Days { get; set; } = 7; }
