using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.External;
using ScientificJournal.DataAccess.Mongo;

namespace ScientificJournal.Business.Services.Implementations;

public class SyncService : ISyncService
{
    // How many candidate works we ask each external source for per scheduled run. Kept small
    // since this runs automatically (daily) — the goal is a steady trickle of fresh publications
    // for trend tracking, not a bulk one-time import.
    private const int RecordsPerRun = 5;

    private readonly ILogger<SyncService> _logger;
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IMongoMetadataRepository _mongoRepository;
    private readonly OpenAlexClient _openAlexClient;
    private readonly SemanticScholarClient _semanticScholarClient;
    private readonly GoogleScholarClient _googleScholarClient;
    private readonly IConfiguration _configuration;

    public SyncService(
        ILogger<SyncService> logger,
        AppDbContext context,
        INotificationService notificationService,
        IMongoMetadataRepository mongoRepository,
        OpenAlexClient openAlexClient,
        SemanticScholarClient semanticScholarClient,
        GoogleScholarClient googleScholarClient,
        IConfiguration configuration)
    {
        _logger = logger;
        _context = context;
        _notificationService = notificationService;
        _mongoRepository = mongoRepository;
        _openAlexClient = openAlexClient;
        _semanticScholarClient = semanticScholarClient;
        _googleScholarClient = googleScholarClient;
        _configuration = configuration;
    }

    public async Task SyncFromSemanticScholarAsync()
    {
        _logger.LogInformation("Semantic Scholar sync triggered.");
        var startedAt = DateTime.UtcNow;

        try
        {
            var query = await BuildTrendingQueryAsync();
            var papers = await _semanticScholarClient.SearchRecentPapersAsync(query, RecordsPerRun);

            var inserted = new List<Publication>();
            foreach (var paper in papers)
            {
                var publication = await UpsertPublicationAsync(
                    title: paper.Title,
                    abstractText: paper.Abstract,
                    doi: paper.Doi,
                    year: paper.Year,
                    citationCount: paper.CitationCount,
                    journalName: paper.Venue,
                    sourceUrl: paper.Url,
                    authors: paper.Authors,
                    keywords: new List<string>(),
                    sourceApi: "SemanticScholar",
                    rawJson: paper.RawJson);

                if (publication != null)
                {
                    inserted.Add(publication);
                }
            }

            if (inserted.Count > 0)
            {
                await ProcessSyncNotificationsAsync(inserted);
            }

            await WriteSyncLogAsync("SemanticScholar", SyncStatus.Completed, inserted.Count, null, startedAt);
        }
        catch (Exception ex)
        {
            // A failed external call must not crash the scheduled job or take down the app —
            // log it as a failed sync run so Admin can see it in the sync history, and move on.
            _logger.LogWarning(ex, "Semantic Scholar sync failed.");
            await WriteSyncLogAsync("SemanticScholar", SyncStatus.Failed, 0, ex.Message, startedAt);
        }
    }

    public async Task SyncFromOpenAlexAsync()
    {
        _logger.LogInformation("OpenAlex sync triggered.");
        var startedAt = DateTime.UtcNow;

        try
        {
            var query = await BuildTrendingQueryAsync();
            var works = await _openAlexClient.SearchRecentWorksAsync(query, RecordsPerRun);

            var inserted = new List<Publication>();
            foreach (var work in works)
            {
                var publication = await UpsertPublicationAsync(
                    title: work.Title,
                    abstractText: work.Abstract,
                    doi: work.Doi,
                    year: work.Year,
                    citationCount: work.CitationCount,
                    journalName: work.JournalName,
                    sourceUrl: work.LandingPageUrl,
                    authors: work.Authors,
                    keywords: work.Keywords,
                    sourceApi: "OpenAlex",
                    rawJson: work.RawJson);

                if (publication != null)
                {
                    inserted.Add(publication);
                }
            }

            if (inserted.Count > 0)
            {
                await ProcessSyncNotificationsAsync(inserted);
            }

            await WriteSyncLogAsync("OpenAlex", SyncStatus.Completed, inserted.Count, null, startedAt);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAlex sync failed.");
            await WriteSyncLogAsync("OpenAlex", SyncStatus.Failed, 0, ex.Message, startedAt);
        }
    }

    public async Task SyncFromGoogleScholarAsync()
    {
        _logger.LogInformation("Google Scholar sync triggered.");
        var startedAt = DateTime.UtcNow;

        // Google Scholar has no official public API; scraping it directly would violate Google's
        // Terms of Service. We go through SerpApi (a licensed third-party data provider with its
        // own public API) instead — see GoogleScholarClient for details. If no API key has been
        // configured, skip gracefully rather than failing: this source is optional.
        var apiKey = _configuration["SerpApi:ApiKey"] ?? _configuration["SERPAPI_API_KEY"];
        if (!_googleScholarClient.IsConfigured(apiKey))
        {
            _logger.LogInformation("Google Scholar sync skipped: SERPAPI_API_KEY is not configured.");
            await WriteSyncLogAsync("GoogleScholar", SyncStatus.Completed, 0, "Skipped: SERPAPI_API_KEY not configured.", startedAt);
            return;
        }

        try
        {
            var query = await BuildTrendingQueryAsync();
            var results = await _googleScholarClient.SearchRecentResultsAsync(query, RecordsPerRun, apiKey);

            var inserted = new List<Publication>();
            foreach (var result in results)
            {
                // SerpApi's Google Scholar results don't include a DOI, only a title/link/summary.
                // We still record them (deduped by title, see UpsertPublicationAsync) since the
                // primary value here is the direct link back to the source page.
                var publication = await UpsertPublicationAsync(
                    title: result.Title,
                    abstractText: result.Snippet,
                    doi: null,
                    year: result.Year ?? DateTime.UtcNow.Year,
                    citationCount: result.CitationCount,
                    journalName: null,
                    sourceUrl: result.Link,
                    authors: new List<string>(),
                    keywords: new List<string>(),
                    sourceApi: "GoogleScholar",
                    rawJson: result.RawJson);

                if (publication != null)
                {
                    inserted.Add(publication);
                }
            }

            if (inserted.Count > 0)
            {
                await ProcessSyncNotificationsAsync(inserted);
            }

            await WriteSyncLogAsync("GoogleScholar", SyncStatus.Completed, inserted.Count, null, startedAt);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Google Scholar sync failed.");
            await WriteSyncLogAsync("GoogleScholar", SyncStatus.Failed, 0, ex.Message, startedAt);
        }
    }

    /// <summary>
    /// Inserts a newly-synced publication, unless a matching one already exists — deduped by DOI
    /// when available, otherwise by exact title. This is what stops the sync job from creating
    /// endless near-duplicate rows every time it runs (the bug in the previous mock implementation).
    /// Returns null if nothing was inserted (duplicate, or missing required data).
    /// </summary>
    private async Task<Publication?> UpsertPublicationAsync(
        string title,
        string? abstractText,
        string? doi,
        int year,
        int citationCount,
        string? journalName,
        string? sourceUrl,
        List<string> authors,
        List<string> keywords,
        string sourceApi,
        string rawJson)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        var normalizedDoi = string.IsNullOrWhiteSpace(doi) ? null : doi.Trim();

        var alreadyExists = normalizedDoi != null
            ? await _context.Publications.AnyAsync(p => p.DOI == normalizedDoi && !p.IsDeleted)
            : await _context.Publications.AnyAsync(p => p.Title == title && !p.IsDeleted);

        if (alreadyExists)
        {
            return null;
        }

        int? journalId = null;
        if (!string.IsNullOrWhiteSpace(journalName))
        {
            var journal = await _context.Journals.FirstOrDefaultAsync(j => j.Name == journalName && !j.IsDeleted);
            if (journal == null)
            {
                journal = new Journal { Name = journalName, ISSNOnline = string.Empty };
                _context.Journals.Add(journal);
                await _context.SaveChangesAsync();
            }

            journalId = journal.Id;
        }

        // Store the raw source payload in MongoDB (schemaless — no SQL Server schema change
        // needed) including an explicit "sourceUrl" field. The detail page reads this back to
        // give users a direct link to the exact page the publication was sourced from.
        var rawMetadata = new PublicationRawMetadata
        {
            Doi = normalizedDoi ?? string.Empty,
            SourceApi = sourceApi,
            RawData = System.Text.Json.JsonSerializer.Serialize(new
            {
                sourceUrl,
                original = System.Text.Json.JsonSerializer.Deserialize<object>(string.IsNullOrWhiteSpace(rawJson) ? "{}" : rawJson)
            }),
            SyncedAt = DateTime.UtcNow
        };
        var mongoId = await _mongoRepository.InsertAsync(rawMetadata);

        var publication = new Publication
        {
            Title = title,
            Abstract = abstractText,
            Year = year > 0 ? year : DateTime.UtcNow.Year,
            DOI = normalizedDoi ?? string.Empty,
            JournalId = journalId,
            CitationCount = Math.Max(0, citationCount),
            SourceApi = sourceApi,
            MongoMetadataId = mongoId,
            IsDeleted = false,
            IsOriginal = false,
            SyncedAt = DateTime.UtcNow
        };

        _context.Publications.Add(publication);
        await _context.SaveChangesAsync();

        foreach (var authorName in authors.Where(a => !string.IsNullOrWhiteSpace(a)).Distinct())
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
                AuthorOrder = 0
            });
        }

        foreach (var term in keywords.Where(k => !string.IsNullOrWhiteSpace(k)).Distinct())
        {
            var normalizedTerm = term.ToLowerInvariant().Trim();
            var keyword = await _context.Keywords.FirstOrDefaultAsync(k => k.NormalizedTerm == normalizedTerm);
            if (keyword == null)
            {
                keyword = new Keyword { Term = term, NormalizedTerm = normalizedTerm };
                _context.Keywords.Add(keyword);
                await _context.SaveChangesAsync();
            }

            _context.PublicationKeywords.Add(new PublicationKeyword
            {
                PublicationId = publication.Id,
                KeywordId = keyword.Id
            });
        }

        await _context.SaveChangesAsync();
        return publication;
    }

    /// <summary>
    /// Picks a query to feed the external search APIs: the most-followed keyword in the system,
    /// so the automatic sync stays relevant to what users here actually care about. Falls back to
    /// a generic query if nobody has followed anything yet.
    /// </summary>
    private async Task<string> BuildTrendingQueryAsync()
    {
        var topFollowedKeyword = await _context.Follows
            .Where(f => f.FollowType == FollowType.Keyword && f.FollowTargetName != null)
            .GroupBy(f => f.FollowTargetName)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(topFollowedKeyword))
        {
            return topFollowedKeyword;
        }

        var anyKeyword = await _context.Keywords.Select(k => k.Term).FirstOrDefaultAsync();
        return string.IsNullOrWhiteSpace(anyKeyword) ? "science" : anyKeyword;
    }

    private async Task WriteSyncLogAsync(string sourceApi, SyncStatus status, int recordsSynced, string? errorMessage, DateTime startedAt)
    {
        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = sourceApi,
            Status = status,
            RecordsSynced = recordsSynced,
            ErrorMessage = errorMessage,
            StartedAt = startedAt,
            FinishedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    private async Task ProcessSyncNotificationsAsync(List<Publication> newPublications)
    {
        foreach (var pub in newPublications)
        {
            var keywords = await _context.PublicationKeywords
                .Include(pk => pk.Keyword)
                .Where(pk => pk.PublicationId == pub.Id && pk.Keyword != null)
                .Select(pk => pk.Keyword!)
                .ToListAsync();

            var keywordTerms = keywords.Select(k => k.Term).ToList();
            var keywordIds = keywords.Select(k => k.Id).ToList();

            var matchingFollows = await _context.Follows
                .Where(f => (f.FollowType == FollowType.Keyword && (keywordIds.Contains(f.FollowTargetId) || keywordTerms.Contains(f.FollowTargetName))) ||
                            (f.FollowType == FollowType.Journal && pub.JournalId.HasValue && f.FollowTargetId == pub.JournalId.Value))
                .ToListAsync();

            var notifiedUsers = new HashSet<int>();
            foreach (var follow in matchingFollows)
            {
                if (notifiedUsers.Contains(follow.UserId)) continue;

                var message = follow.FollowType == FollowType.Keyword
                    ? $"New publication synced matching your followed keyword '{follow.FollowTargetName}': {pub.Title}"
                    : $"New publication synced in your followed journal '{follow.FollowTargetName}': {pub.Title}";

                await _notificationService.CreateNotificationAsync(follow.UserId, message, pub.Id);
                notifiedUsers.Add(follow.UserId);
            }
        }
    }
}
