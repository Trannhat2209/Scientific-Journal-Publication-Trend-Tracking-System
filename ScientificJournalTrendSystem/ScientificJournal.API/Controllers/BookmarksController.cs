using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/bookmarks")]
[Authorize]
[VerifiedAcademicUser]
public class BookmarksController : ControllerBase
{
    private readonly IBookmarkService _bookmarkService;
    private readonly AppDbContext _context;

    public BookmarksController(IBookmarkService bookmarkService, AppDbContext context)
    {
        _bookmarkService = bookmarkService;
        _context = context;
    }

    [HttpPost("metadata")]
    public async Task<IActionResult> AddMetadataBookmark([FromBody] MetadataBookmarkRequest request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var title = NormalizeText(request.Title);
        if (string.IsNullOrWhiteSpace(title))
            return BadRequest(new { message = "Publication title is required." });

        var doi = NormalizeDoi(request.DOI);
        if (string.IsNullOrWhiteSpace(doi))
            doi = $"external:{Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(title.ToLowerInvariant())))[..24].ToLowerInvariant()}";

        var publication = await _context.Publications.IgnoreQueryFilters()
            .FirstOrDefaultAsync(item => item.DOI == doi || item.Title.ToLower() == title.ToLower());
        if (publication == null)
        {
            publication = new Publication
            {
                Title = title,
                Abstract = string.IsNullOrWhiteSpace(request.Abstract) ? null : NormalizeText(request.Abstract),
                DOI = doi,
                Year = request.Year is >= 1800 and <= 2200 ? request.Year : DateTime.UtcNow.Year,
                CitationCount = Math.Max(0, request.CitationCount),
                SourceApi = string.IsNullOrWhiteSpace(request.SourceApi) ? "External academic source" : NormalizeText(request.SourceApi),
                SourceUrl = Uri.TryCreate(request.SourceUrl, UriKind.Absolute, out var sourceUri) ? sourceUri.ToString() : null,
                SyncedAt = DateTime.UtcNow,
                IsOriginal = false,
                IsDeleted = false
            };
            _context.Publications.Add(publication);
            await _context.SaveChangesAsync();
        }
        else if (publication.IsDeleted)
        {
            publication.IsDeleted = false;
            await _context.SaveChangesAsync();
        }

        await _bookmarkService.AddBookmarkAsync(userId, publication.Id);
        return Ok(new { message = "Publication bookmarked.", publicationId = publication.Id });
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

    private bool TryGetUserId(out int userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(value, out userId);
    }

    private static string NormalizeText(string? value) =>
        string.Join(' ', (value ?? string.Empty).Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static string NormalizeDoi(string? value) =>
        (value ?? string.Empty).Trim().ToLowerInvariant()
            .Replace("https://doi.org/", string.Empty)
            .Replace("http://doi.org/", string.Empty)
            .Replace("doi:", string.Empty).Trim();
}

public sealed record MetadataBookmarkRequest(
    string Title,
    string? Abstract,
    string? DOI,
    int Year,
    int CitationCount,
    string? SourceApi,
    string? SourceUrl);

