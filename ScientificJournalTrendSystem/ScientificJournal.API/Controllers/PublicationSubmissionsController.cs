using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/publication-submissions")]
[Authorize]
public class PublicationSubmissionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PublicationSubmissionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SubmissionCreateDto dto)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(new { message = "User session is invalid." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null || user.IsDeleted || !user.IsActive)
        {
            return Unauthorized(new { message = "User account is suspended or not found." });
        }

        if (user.Role == UserRole.Admin)
        {
            return BadRequest(new { message = "Administrators are not permitted to submit papers." });
        }

        var submission = new PublicationSubmission
        {
            Title = dto.Title.Trim(),
            Abstract = dto.Abstract?.Trim(),
            DOI = dto.DOI?.Trim(),
            Authors = string.Join(", ", dto.Authors.Select(a => a.Trim()).Where(a => !string.IsNullOrEmpty(a))),
            Keywords = string.Join(", ", dto.Keywords.Select(k => k.Trim()).Where(k => !string.IsNullOrEmpty(k))),
            Status = "Pending",
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.PublicationSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = submission.Id }, submission);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var submission = await _context.PublicationSubmissions
            .Include(ps => ps.SubmittedByUser)
            .FirstOrDefaultAsync(ps => ps.Id == id);

        if (submission == null)
        {
            return NotFound(new { message = "Submission not found." });
        }

        return Ok(submission);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingQueue()
    {
        var roleValue = User.FindFirstValue(ClaimTypes.Role);
        if (!string.Equals(roleValue, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Only administrators can view the pending approval queue.");
        }

        var items = await _context.PublicationSubmissions
            .Include(ps => ps.SubmittedByUser)
            .Where(ps => ps.Status == "Pending")
            .OrderByDescending(ps => ps.CreatedAt)
            .Select(ps => new
            {
                id = ps.Id,
                title = ps.Title,
                @abstract = ps.Abstract,
                doi = ps.DOI,
                authors = ps.Authors,
                keywords = ps.Keywords,
                status = ps.Status,
                submittedBy = ps.SubmittedByUser != null ? ps.SubmittedByUser.FullName : "Unknown",
                submittedByEmail = ps.SubmittedByUser != null ? ps.SubmittedByUser.Email : "",
                createdAt = ps.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("my-submissions")]
    public async Task<IActionResult> GetMySubmissions()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var items = await _context.PublicationSubmissions
            .Where(ps => ps.SubmittedByUserId == userId)
            .OrderByDescending(ps => ps.CreatedAt)
            .Select(ps => new
            {
                id = ps.Id,
                title = ps.Title,
                @abstract = ps.Abstract,
                doi = ps.DOI,
                authors = ps.Authors,
                keywords = ps.Keywords,
                status = ps.Status,
                rejectedReason = ps.RejectedReason,
                createdAt = ps.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPut("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var roleValue = User.FindFirstValue(ClaimTypes.Role);
        if (!string.Equals(roleValue, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Only administrators can approve submissions.");
        }

        var submission = await _context.PublicationSubmissions
            .Include(ps => ps.SubmittedByUser)
            .FirstOrDefaultAsync(ps => ps.Id == id);

        if (submission == null)
        {
            return NotFound(new { message = "Submission not found." });
        }

        if (submission.Status != "Pending")
        {
            return BadRequest(new { message = "Only pending submissions can be approved." });
        }

        submission.Status = "Approved";
        submission.UpdatedAt = DateTime.UtcNow;

        // Automatically create a real Publication
        var publication = new Publication
        {
            Title = submission.Title,
            Abstract = submission.Abstract,
            DOI = submission.DOI ?? $"10.scijtrend/{Guid.NewGuid().ToString().Substring(0, 8)}",
            Year = DateTime.UtcNow.Year,
            CitationCount = 0,
            SourceApi = "Upload",
            IsOriginal = true,
            SyncedAt = DateTime.UtcNow
        };

        _context.Publications.Add(publication);
        await _context.SaveChangesAsync(); // Generates publication.Id

        // Map and create Authors
        if (!string.IsNullOrEmpty(submission.Authors))
        {
            var authorNames = submission.Authors.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(a => a.Trim())
                .Where(a => !string.IsNullOrEmpty(a))
                .ToList();

            for (int i = 0; i < authorNames.Count; i++)
            {
                var authorName = authorNames[i];
                var author = await _context.Authors.FirstOrDefaultAsync(a => a.Name == authorName);
                if (author == null)
                {
                    author = new Author
                    {
                        Name = authorName,
                        ExternalId = Guid.NewGuid().ToString(),
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Authors.Add(author);
                    await _context.SaveChangesAsync();
                }

                _context.PublicationAuthors.Add(new PublicationAuthor
                {
                    PublicationId = publication.Id,
                    AuthorId = author.Id,
                    AuthorOrder = i + 1
                });
            }
        }

        // Map and create Keywords
        if (!string.IsNullOrEmpty(submission.Keywords))
        {
            var keywordTerms = submission.Keywords.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(k => k.Trim())
                .Where(k => !string.IsNullOrEmpty(k))
                .ToList();

            foreach (var term in keywordTerms)
            {
                var normalizedTerm = term.ToLowerInvariant();
                var keyword = await _context.Keywords.FirstOrDefaultAsync(k => k.NormalizedTerm == normalizedTerm);
                if (keyword == null)
                {
                    keyword = new Keyword
                    {
                        Term = term,
                        NormalizedTerm = normalizedTerm
                    };
                    _context.Keywords.Add(keyword);
                    await _context.SaveChangesAsync();
                }

                _context.PublicationKeywords.Add(new PublicationKeyword
                {
                    PublicationId = publication.Id,
                    KeywordId = keyword.Id
                });
            }
        }

        // Send a Notification to the user who submitted the paper
        _context.Notifications.Add(new Notification
        {
            UserId = submission.SubmittedByUserId,
            PublicationId = publication.Id,
            Message = $"Bài viết '{submission.Title}' của bạn đã được phê duyệt và xuất bản thành công.",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { message = "Submission approved and published successfully.", publicationId = publication.Id });
    }

    [HttpPut("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] SubmissionRejectDto dto)
    {
        var roleValue = User.FindFirstValue(ClaimTypes.Role);
        if (!string.Equals(roleValue, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Only administrators can reject submissions.");
        }

        var submission = await _context.PublicationSubmissions.FindAsync(id);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found." });
        }

        if (submission.Status != "Pending")
        {
            return BadRequest(new { message = "Only pending submissions can be rejected." });
        }

        submission.Status = "Rejected";
        submission.RejectedReason = dto.Reason?.Trim() ?? "Không đạt tiêu chuẩn duyệt bài.";
        submission.UpdatedAt = DateTime.UtcNow;

        // Send Notification to user
        _context.Notifications.Add(new Notification
        {
            UserId = submission.SubmittedByUserId,
            Message = $"Bài viết '{submission.Title}' của bạn đã bị từ chối phê duyệt. Lý do: {submission.RejectedReason}",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { message = "Submission rejected successfully." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var roleValue = User.FindFirstValue(ClaimTypes.Role);
        if (!string.Equals(roleValue, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var submission = await _context.PublicationSubmissions.FindAsync(id);
        if (submission == null)
        {
            return NotFound();
        }

        _context.PublicationSubmissions.Remove(submission);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Submission deleted successfully." });
    }
}

public class SubmissionCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public string? DOI { get; set; }
    public List<string> Authors { get; set; } = new();
    public List<string> Keywords { get; set; } = new();
}

public class SubmissionRejectDto
{
    public string Reason { get; set; } = string.Empty;
}
