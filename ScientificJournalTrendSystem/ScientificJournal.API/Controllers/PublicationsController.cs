using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Publication;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/publications")]
public class PublicationsController : ControllerBase
{
    private const double SimilarityLimitPercent = 50.0;
    private readonly IPublicationService _publicationService;
    private readonly ISerpApiScholarSimilarityService _scholarSimilarityService;
    private readonly AppDbContext _context;

    public PublicationsController(
        IPublicationService publicationService,
        ISerpApiScholarSimilarityService scholarSimilarityService,
        AppDbContext context)
    {
        _publicationService = publicationService;
        _scholarSimilarityService = scholarSimilarityService;
        _context = context;
    }

    [HttpGet]
    [HttpGet("search")]
    [HttpGet("filter")]
    public async Task<IActionResult> Search([FromQuery] PublicationSearchRequestDto request)
    {
        int? userId = null;
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (int.TryParse(userIdValue, out var parsedId))
        {
            userId = parsedId;
        }

        var result = await _publicationService.SearchPublicationsAsync(request, userId);
        return Ok(result);
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        var result = await _publicationService.GetPublicationsStatisticsAsync();
        return Ok(result);
    }

    [HttpPost("similarity-check")]
    public async Task<IActionResult> CheckSimilarity(
        [FromBody] PublicationSimilarityCheckRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _scholarSimilarityService.CheckSimilarityAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await _publicationService.GetPublicationDetailAsync(id);
        return Ok(result);
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> Upload([FromBody] UploadPublicationDto request)
    {
        var roleValue = User.FindFirstValue(ClaimTypes.Role);
        if (string.Equals(roleValue, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Admin is not allowed to upload publications.");
        }

        var result = await _publicationService.UploadPublicationAsync(request);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetDetail), new { id = result.PublicationId }, result);
    }

    [HttpPost("submissions")]
    public async Task<IActionResult> CreateSubmission([FromBody] CreatePublicationSubmissionDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Abstract) ||
            string.IsNullOrWhiteSpace(request.Authors) ||
            string.IsNullOrWhiteSpace(request.Keywords))
        {
            return BadRequest(new { message = "Title, authors, keywords, and abstract are required." });
        }

        var submitterEmail = ResolveSubmitterEmail(request.SubmitterEmail);
        if (string.IsNullOrWhiteSpace(submitterEmail))
        {
            return BadRequest(new { message = "Submitter email is required." });
        }

        var submitterUser = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == submitterEmail && !u.IsDeleted);

        var isOverLimit = request.OverLimit ?? request.SimilarityPercent > SimilarityLimitPercent;
        var submission = new PublicationSubmission
        {
            SubmitterUserId = submitterUser?.Id,
            SubmitterEmail = submitterEmail,
            SubmitterName = string.IsNullOrWhiteSpace(request.SubmitterName)
                ? submitterEmail
                : request.SubmitterName.Trim(),
            SubmitterRole = NormalizeRoleLabel(request.Role),
            Title = request.Title.Trim(),
            AuthorsText = request.Authors.Trim(),
            KeywordsText = request.Keywords.Trim(),
            Abstract = request.Abstract.Trim(),
            FileName = string.IsNullOrWhiteSpace(request.FileName) ? null : request.FileName.Trim(),
            FileContentType = string.IsNullOrWhiteSpace(request.FileContentType) ? null : request.FileContentType.Trim(),
            FileContent = DecodeBase64File(request.FileContentBase64),
            ExtractedText = string.IsNullOrWhiteSpace(request.FileText) ? null : request.FileText,
            SimilarityPercent = Math.Round(request.SimilarityPercent, 2),
            MatchedTitle = request.MatchedTitle,
            MatchedSource = request.MatchedSource,
            MatchedLink = request.MatchedLink,
            CandidatesJson = JsonSerializer.Serialize(request.Candidates ?? new()),
            Status = isOverLimit ? "cancelled" : "pending",
            Decision = request.Decision ??
                (isOverLimit
                    ? "Auto cancelled: over 50% similarity rule."
                    : "Waiting for admin approval."),
            SubmittedAt = DateTime.UtcNow
        };

        _context.PublicationSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSubmissionForAdmin), new { id = submission.Id }, MapSubmission(submission));
    }

    [HttpGet("submissions/admin")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> GetSubmissionQueueForAdmin()
    {
        var submissions = await _context.PublicationSubmissions
            .AsNoTracking()
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return Ok(new { items = submissions.Select(MapSubmission) });
    }

    [HttpGet("submissions/{id:int}")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> GetSubmissionForAdmin(int id)
    {
        var submission = await _context.PublicationSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        return submission == null
            ? NotFound(new { message = "Submission not found." })
            : Ok(MapSubmission(submission));
    }

    [HttpPost("submissions/{id:int}/approve")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> ApproveSubmission(int id)
    {
        var submission = await _context.PublicationSubmissions
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
        {
            return NotFound(new { message = "Submission not found." });
        }

        if (submission.SimilarityPercent > SimilarityLimitPercent)
        {
            return BadRequest(new { message = "Submissions over 50% similarity cannot be approved." });
        }

        if (string.Equals(submission.Status, "approved", StringComparison.OrdinalIgnoreCase) &&
            submission.PublishedPublicationId.HasValue)
        {
            return Ok(new
            {
                submission = MapSubmission(submission),
                publicationId = submission.PublishedPublicationId
            });
        }

        var publication = await PublishSubmissionAsync(submission);
        submission.Status = "approved";
        submission.Decision = "Admin approved: within 50% similarity rule. Published on ScholarTrend.";
        submission.ReviewedAt = DateTime.UtcNow;
        submission.ReviewedByUserId = ResolveCurrentUserId();
        submission.PublishedPublicationId = publication.Id;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            submission = MapSubmission(submission),
            publicationId = publication.Id
        });
    }

    [HttpPost("submissions/{id:int}/reject")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> RejectSubmission(int id, [FromBody] ReviewPublicationSubmissionDto request)
    {
        var submission = await _context.PublicationSubmissions.FirstOrDefaultAsync(s => s.Id == id);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found." });
        }

        var reason = request.Reason.Trim();
        var evidence = request.Evidence.Trim();
        if (string.IsNullOrWhiteSpace(reason) || string.IsNullOrWhiteSpace(evidence))
        {
            return BadRequest(new { message = "Reason and evidence are required." });
        }

        submission.Status = "rejected";
        submission.RejectedReason = reason;
        submission.RejectedEvidence = evidence;
        submission.Decision = $"Admin rejected: {reason}";
        submission.ReviewedAt = DateTime.UtcNow;
        submission.ReviewedByUserId = ResolveCurrentUserId();

        await _context.SaveChangesAsync();
        return Ok(new { submission = MapSubmission(submission) });
    }

    [HttpDelete("submissions/{id:int}")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> DeleteSubmission(int id, [FromBody] ReviewPublicationSubmissionDto? request)
    {
        var submission = await _context.PublicationSubmissions.FirstOrDefaultAsync(s => s.Id == id);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found." });
        }

        submission.IsDeleted = true;
        submission.Status = "deleted";
        submission.RejectedReason = string.IsNullOrWhiteSpace(request?.Reason) ? submission.RejectedReason : request.Reason.Trim();
        submission.RejectedEvidence = string.IsNullOrWhiteSpace(request?.Evidence) ? submission.RejectedEvidence : request.Evidence.Trim();
        submission.Decision = string.IsNullOrWhiteSpace(submission.RejectedReason)
            ? "Admin deleted this submission."
            : $"Admin deleted: {submission.RejectedReason}";
        submission.ReviewedAt = DateTime.UtcNow;
        submission.ReviewedByUserId = ResolveCurrentUserId();

        await _context.SaveChangesAsync();
        return Ok(new { message = "Submission deleted.", id });
    }

    private async Task<Publication> PublishSubmissionAsync(PublicationSubmission submission)
    {
        if (submission.PublishedPublicationId.HasValue)
        {
            var existing = await _context.Publications
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == submission.PublishedPublicationId.Value);
            if (existing != null)
            {
                return existing;
            }
        }

        var doi = $"10.9999/scholartrend.submission.{submission.Id}.{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        var publication = new Publication
        {
            Title = submission.Title,
            Abstract = submission.Abstract,
            Year = submission.SubmittedAt.Year,
            DOI = doi,
            JournalId = null,
            CitationCount = 0,
            SourceApi = "UserSubmission",
            MongoMetadataId = null,
            IsDeleted = false,
            IsOriginal = false,
            SyncedAt = DateTime.UtcNow
        };

        _context.Publications.Add(publication);
        await _context.SaveChangesAsync();

        var authorOrder = 1;
        foreach (var authorName in SplitCsv(submission.AuthorsText))
        {
            var author = await _context.Authors.FirstOrDefaultAsync(a => a.Name == authorName);
            if (author == null)
            {
                author = new Author { Name = authorName };
                _context.Authors.Add(author);
                await _context.SaveChangesAsync();
            }

            _context.PublicationAuthors.Add(new PublicationAuthor
            {
                PublicationId = publication.Id,
                AuthorId = author.Id,
                AuthorOrder = authorOrder++
            });
        }

        foreach (var keywordTerm in SplitCsv(submission.KeywordsText))
        {
            var normalized = keywordTerm.ToLowerInvariant().Trim();
            var keyword = await _context.Keywords.FirstOrDefaultAsync(k => k.NormalizedTerm == normalized);
            if (keyword == null)
            {
                keyword = new Keyword { Term = keywordTerm, NormalizedTerm = normalized };
                _context.Keywords.Add(keyword);
                await _context.SaveChangesAsync();
            }

            _context.PublicationKeywords.Add(new PublicationKeyword
            {
                PublicationId = publication.Id,
                KeywordId = keyword.Id
            });
        }

        return publication;
    }

    private static IEnumerable<string> SplitCsv(string value) =>
        value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase);

    private string ResolveSubmitterEmail(string requestEmail)
    {
        var claimEmail = User.FindFirstValue(ClaimTypes.Email);
        return (claimEmail ?? requestEmail ?? string.Empty).Trim().ToLowerInvariant();
    }

    private int? ResolveCurrentUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(userIdValue, out var userId) ? userId : null;
    }

    private static string NormalizeRoleLabel(string? role)
    {
        var value = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            ? "Administrator"
            : role;
        return string.IsNullOrWhiteSpace(value) ? "Researcher" : value.Trim();
    }

    private static byte[]? DecodeBase64File(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var payload = value.Contains(',', StringComparison.Ordinal)
            ? value[(value.IndexOf(',') + 1)..]
            : value;

        return Convert.FromBase64String(payload);
    }

    private static PublicationSubmissionDto MapSubmission(PublicationSubmission submission)
    {
        var candidates = string.IsNullOrWhiteSpace(submission.CandidatesJson)
            ? new List<PublicationSubmissionCandidateDto>()
            : JsonSerializer.Deserialize<List<PublicationSubmissionCandidateDto>>(submission.CandidatesJson) ?? new();

        return new PublicationSubmissionDto
        {
            Id = submission.Id,
            Title = submission.Title,
            Authors = submission.AuthorsText,
            Keywords = submission.KeywordsText,
            Abstract = submission.Abstract,
            Submitter = submission.SubmitterEmail,
            SubmitterName = submission.SubmitterName,
            Role = submission.SubmitterRole,
            FileName = submission.FileName,
            SimilarityPercent = submission.SimilarityPercent,
            MatchedTitle = submission.MatchedTitle ?? "No indexed match found",
            MatchedSource = submission.MatchedSource ?? "Google Scholar indexed record",
            MatchedLink = submission.MatchedLink,
            Status = submission.Status,
            Decision = submission.Decision,
            RejectedReason = submission.RejectedReason,
            RejectedEvidence = submission.RejectedEvidence,
            PublishedPublicationId = submission.PublishedPublicationId,
            SubmittedAt = submission.SubmittedAt,
            ReviewedAt = submission.ReviewedAt,
            Candidates = candidates
        };
    }
}
