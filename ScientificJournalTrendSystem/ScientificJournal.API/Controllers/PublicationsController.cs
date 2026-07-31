using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Data;
using System.Text;
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
[Authorize]
public class PublicationsController : ControllerBase
{
    private const double SimilarityLimitPercent = 50.0;
    private readonly IPublicationService _publicationService;
    private readonly ISerpApiScholarSimilarityService _scholarSimilarityService;
    private readonly IRelationshipNetworkService _relationshipNetworkService;
    private readonly AppDbContext _context;

    public PublicationsController(
        IPublicationService publicationService,
        ISerpApiScholarSimilarityService scholarSimilarityService,
        IRelationshipNetworkService relationshipNetworkService,
        AppDbContext context)
    {
        _publicationService = publicationService;
        _scholarSimilarityService = scholarSimilarityService;
        _relationshipNetworkService = relationshipNetworkService;
        _context = context;
    }

    [HttpGet]
    [HttpGet("search")]
    [HttpGet("filter")]
    [VerifiedAcademicUser]
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
    [VerifiedAcademicUser]
    public async Task<IActionResult> GetStatistics()
    {
        var result = await _publicationService.GetPublicationsStatisticsAsync();
        return Ok(result);
    }

    [HttpGet("autocomplete")]
    [VerifiedAcademicUser]
    public async Task<IActionResult> Autocomplete([FromQuery] string? q, [FromQuery] int limit = 8)
    {
        limit = Math.Clamp(limit, 1, 20);
        var term = (q ?? string.Empty).Trim();

        var keywordQuery = _context.Keywords.AsNoTracking().AsQueryable();
        var titleQuery = _context.Publications.AsNoTracking().Where(p => !p.IsDeleted);
        var authorQuery = _context.Authors.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var normalizedTerm = term.ToLower();
            keywordQuery = keywordQuery.Where(k => k.Term.Contains(term) || k.NormalizedTerm.Contains(normalizedTerm));
            titleQuery = titleQuery.Where(p => p.Title.Contains(term));
            authorQuery = authorQuery.Where(a => a.Name.Contains(term));
        }

        var keywords = await keywordQuery
            .OrderBy(k => k.Term)
            .Select(k => new { label = k.Term, type = "keyword" })
            .Take(limit)
            .ToListAsync();

        var titles = await titleQuery
            .OrderByDescending(p => p.CitationCount)
            .Select(p => new { label = p.Title, type = "publication" })
            .Take(Math.Max(0, limit - keywords.Count))
            .ToListAsync();

        var authors = await authorQuery
            .OrderBy(a => a.Name)
            .Select(a => new { label = a.Name, type = "author" })
            .Take(Math.Max(0, limit - keywords.Count - titles.Count))
            .ToListAsync();

        return Ok(new { items = keywords.Concat(titles).Concat(authors) });
    }

    [HttpGet("{id:int}/network")]
    [VerifiedAcademicUser]
    public async Task<IActionResult> GetCitationNetwork(int id, [FromQuery] double threshold = 0.3)
    {
        var result = await _relationshipNetworkService.GetRelationshipNetworkAsync(id, threshold);
        return Ok(result);
    }

    [HttpGet("export")]
    [VerifiedAcademicUser]
    public async Task<IActionResult> ExportReferences(
        [FromQuery] string format = "bibtex",
        [FromQuery] string? q = null,
        [FromQuery] string? ids = null,
        [FromQuery] int limit = 50)
    {
        limit = Math.Clamp(limit, 1, 200);
        var idSet = SplitCsv(ids ?? string.Empty)
            .Select(value => int.TryParse(value, out var id) ? id : 0)
            .Where(id => id > 0)
            .ToHashSet();

        var query = _context.Publications
            .AsNoTracking()
            .Include(p => p.Journal)
            .Include(p => p.PublicationAuthors).ThenInclude(pa => pa.Author)
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (idSet.Count > 0)
        {
            query = query.Where(p => idSet.Contains(p.Id));
        }
        else if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(p => p.Title.Contains(term) ||
                                     (p.Abstract != null && p.Abstract.Contains(term)) ||
                                     p.PublicationAuthors.Any(pa => pa.Author != null && pa.Author.Name.Contains(term)));
        }

        var publications = await query
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.CitationCount)
            .Take(limit)
            .ToListAsync();

        var normalizedFormat = format.Trim().ToLowerInvariant();
        var content = normalizedFormat == "ris" ? BuildRis(publications) : BuildBibTex(publications);
        var contentType = normalizedFormat == "ris"
            ? "application/x-research-info-systems; charset=utf-8"
            : "application/x-bibtex; charset=utf-8";
        var extension = normalizedFormat == "ris" ? "ris" : "bib";

        return File(Encoding.UTF8.GetBytes(content), contentType, $"scholartrend-references.{extension}");
    }

    [HttpPost("similarity-check")]
    [VerifiedAcademicUser]
    public async Task<IActionResult> CheckSimilarity(
        [FromBody] PublicationSimilarityCheckRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _scholarSimilarityService.CheckSimilarityAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [VerifiedAcademicUser]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await _publicationService.GetPublicationDetailAsync(id);
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> UpdatePublication(int id, [FromBody] UpdatePublicationRequest request)
    {
        var publication = await _context.Publications.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (publication == null) return NotFound(new { message = "Publication not found." });

        var changedFields = new List<string>();
        if (request.Title != null && request.Title.Trim() != publication.Title)
        {
            if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(new { message = "Title cannot be empty." });
            publication.Title = request.Title.Trim();
            changedFields.Add(nameof(Publication.Title));
        }
        if (request.Abstract != null && request.Abstract != publication.Abstract)
        {
            publication.Abstract = request.Abstract.Trim();
            changedFields.Add(nameof(Publication.Abstract));
        }
        if (request.Year.HasValue && request.Year.Value != publication.Year)
        {
            if (request.Year is < 1800 or > 2200) return BadRequest(new { message = "Year must be between 1800 and 2200." });
            publication.Year = request.Year.Value;
            changedFields.Add(nameof(Publication.Year));
        }
        if (request.DOI != null && request.DOI.Trim() != publication.DOI)
        {
            publication.DOI = request.DOI.Trim();
            changedFields.Add(nameof(Publication.DOI));
        }
        if (request.SourceUrl != null && request.SourceUrl.Trim() != publication.SourceUrl)
        {
            publication.SourceUrl = string.IsNullOrWhiteSpace(request.SourceUrl) ? null : request.SourceUrl.Trim();
            changedFields.Add(nameof(Publication.SourceUrl));
        }

        if (changedFields.Count == 0) return Ok(new { message = "No publication fields changed." });
        var nextVersion = (await _context.PublicationVersions
            .Where(v => v.PublicationId == id).MaxAsync(v => (int?)v.VersionNumber) ?? 0) + 1;
        _context.PublicationVersions.Add(new PublicationVersion
        {
            PublicationId = id,
            VersionNumber = nextVersion,
            ChangeType = $"edited:{string.Join(',', changedFields)}",
            ChangedByUserId = ResolveCurrentUserId(),
            SnapshotJson = JsonSerializer.Serialize(new { publication.Title, publication.Abstract, publication.Year, publication.DOI, publication.SourceUrl })
        });
        await _context.SaveChangesAsync();
        return Ok(new { message = "Publication updated and version recorded.", versionNumber = nextVersion, changedFields });
    }

    [HttpGet("{id:int}/versions")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> GetPublicationVersions(int id)
    {
        var exists = await _context.Publications.AsNoTracking().AnyAsync(p => p.Id == id);
        if (!exists) return NotFound(new { message = "Publication not found." });

        var versions = await _context.PublicationVersions.AsNoTracking()
            .Where(v => v.PublicationId == id)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync();

        return Ok(new
        {
            items = versions.Select(v => new
            {
                v.Id,
                v.PublicationId,
                v.VersionNumber,
                v.ChangeType,
                v.ChangedByUserId,
                v.CreatedAt,
                snapshot = JsonSerializer.Deserialize<JsonElement>(v.SnapshotJson)
            })
        });
    }

    [HttpPost("{id:int}/versions/{versionNumber:int}/restore")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> RestorePublicationVersion(int id, int versionNumber)
    {
        var publication = await _context.Publications.FirstOrDefaultAsync(p => p.Id == id);
        var version = await _context.PublicationVersions.AsNoTracking()
            .FirstOrDefaultAsync(v => v.PublicationId == id && v.VersionNumber == versionNumber);
        if (publication == null || version == null) return NotFound(new { message = "Publication version not found." });

        using var snapshotDocument = JsonDocument.Parse(version.SnapshotJson);
        var snapshot = snapshotDocument.RootElement;
        if (snapshot.TryGetProperty("Title", out var title) || snapshot.TryGetProperty("title", out title))
            publication.Title = title.GetString() ?? publication.Title;
        if (snapshot.TryGetProperty("Abstract", out var abstractValue) || snapshot.TryGetProperty("abstract", out abstractValue))
            publication.Abstract = abstractValue.ValueKind == JsonValueKind.Null ? null : abstractValue.GetString();
        if ((snapshot.TryGetProperty("Year", out var year) || snapshot.TryGetProperty("year", out year)) && year.TryGetInt32(out var parsedYear))
            publication.Year = parsedYear;
        if (snapshot.TryGetProperty("DOI", out var doi) || snapshot.TryGetProperty("doi", out doi))
            publication.DOI = doi.ValueKind == JsonValueKind.Null ? string.Empty : doi.GetString() ?? string.Empty;

        var nextVersion = (await _context.PublicationVersions
            .Where(v => v.PublicationId == id).MaxAsync(v => (int?)v.VersionNumber) ?? 0) + 1;
        _context.PublicationVersions.Add(new PublicationVersion
        {
            PublicationId = id,
            VersionNumber = nextVersion,
            ChangeType = $"restored-v{versionNumber}",
            ChangedByUserId = ResolveCurrentUserId(),
            SnapshotJson = JsonSerializer.Serialize(new { publication.Title, publication.Abstract, publication.Year, publication.DOI })
        });
        await _context.SaveChangesAsync();
        return Ok(new { message = $"Restored publication to version {versionNumber}.", versionNumber = nextVersion });
    }

    private static IEnumerable<string> SplitCsv(string value) =>
        value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase);

    private static string BuildBibTex(IEnumerable<Publication> publications)
    {
        var builder = new StringBuilder();
        foreach (var publication in publications)
        {
            var authors = string.Join(" and ", publication.PublicationAuthors
                .OrderBy(pa => pa.AuthorOrder)
                .Select(pa => pa.Author?.Name)
                .Where(name => !string.IsNullOrWhiteSpace(name)));

            builder.AppendLine($"@article{{{CreateReferenceKey(publication)},");
            builder.AppendLine($"  title = {{{EscapeBibTex(publication.Title)}}},");
            if (!string.IsNullOrWhiteSpace(authors)) builder.AppendLine($"  author = {{{EscapeBibTex(authors)}}},");
            if (!string.IsNullOrWhiteSpace(publication.Journal?.Name)) builder.AppendLine($"  journal = {{{EscapeBibTex(publication.Journal.Name)}}},");
            builder.AppendLine($"  year = {{{publication.Year}}},");
            if (!string.IsNullOrWhiteSpace(publication.DOI)) builder.AppendLine($"  doi = {{{EscapeBibTex(publication.DOI)}}},");
            builder.AppendLine($"  note = {{{publication.CitationCount} citations; source: {EscapeBibTex(publication.SourceApi ?? "ScholarTrend")}}}");
            builder.AppendLine("}");
            builder.AppendLine();
        }

        return builder.ToString();
    }

    private static string BuildRis(IEnumerable<Publication> publications)
    {
        var builder = new StringBuilder();
        foreach (var publication in publications)
        {
            builder.AppendLine("TY  - JOUR");
            builder.AppendLine($"TI  - {publication.Title}");
            foreach (var author in publication.PublicationAuthors
                         .OrderBy(pa => pa.AuthorOrder)
                         .Select(pa => pa.Author?.Name)
                         .Where(name => !string.IsNullOrWhiteSpace(name)))
            {
                builder.AppendLine($"AU  - {author}");
            }
            if (!string.IsNullOrWhiteSpace(publication.Journal?.Name)) builder.AppendLine($"JO  - {publication.Journal.Name}");
            builder.AppendLine($"PY  - {publication.Year}");
            if (!string.IsNullOrWhiteSpace(publication.DOI)) builder.AppendLine($"DO  - {publication.DOI}");
            builder.AppendLine($"N1  - {publication.CitationCount} citations; source: {publication.SourceApi ?? "ScholarTrend"}");
            builder.AppendLine("ER  -");
            builder.AppendLine();
        }

        return builder.ToString();
    }

    private static string CreateReferenceKey(Publication publication)
    {
        var firstAuthor = publication.PublicationAuthors
            .OrderBy(pa => pa.AuthorOrder)
            .Select(pa => pa.Author?.Name)
            .FirstOrDefault(name => !string.IsNullOrWhiteSpace(name)) ?? "scholartrend";
        var authorKey = new string(firstAuthor.Where(char.IsLetterOrDigit).Take(18).ToArray());
        return $"{authorKey}{publication.Year}{publication.Id}";
    }

    private static string EscapeBibTex(string value) =>
        value.Replace("\\", "\\\\").Replace("{", "\\{").Replace("}", "\\}");

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

        try
        {
            return Convert.FromBase64String(payload);
        }
        catch (FormatException)
        {
            return null;
        }
    }

}

public class UpdatePublicationRequest
{
    public string? Title { get; set; }
    public string? Abstract { get; set; }
    public int? Year { get; set; }
    public string? DOI { get; set; }
    public string? SourceUrl { get; set; }
}
