using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Publication;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.External;
using ScientificJournal.DataAccess.Mongo;

namespace ScientificJournal.Business.Services.Implementations;

public class PublicationService : IPublicationService
{
    private static readonly ConcurrentDictionary<string, DateTime> ExternalSearchAttempts = new();
    private static readonly TimeSpan ExternalSearchAttemptTtl = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan ExternalSearchTimeout = TimeSpan.FromSeconds(10);
    private readonly AppDbContext _context;
    private readonly IRecommendationService _recommendationService;
    private readonly IMongoMetadataRepository _mongoRepository;
    private readonly OpenAlexClient _openAlexClient;
    private readonly SerpApiScholarSearchClient _scholarSearchClient;
    private readonly SemanticScholarClient _semanticScholarClient;

    public PublicationService(
        AppDbContext context,
        IRecommendationService recommendationService,
        IMongoMetadataRepository mongoRepository,
        OpenAlexClient openAlexClient,
        SerpApiScholarSearchClient scholarSearchClient,
        SemanticScholarClient semanticScholarClient)
    {
        _context = context;
        _recommendationService = recommendationService;
        _mongoRepository = mongoRepository;
        _openAlexClient = openAlexClient;
        _scholarSearchClient = scholarSearchClient;
        _semanticScholarClient = semanticScholarClient;
    }

    public async Task<PaginatedResponse<PublicationDto>> SearchPublicationsAsync(PublicationSearchRequestDto request, int? userId = null)
    {
        // A keyword search refreshes the local cache from the configured public
        // scholarly providers. Results are persisted so the graph, list view and
        // publication detail all use the same real records and source URLs.
        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            await EnsureExternalSearchCacheAsync(request);
        }

        var query = _context.Publications
            .AsNoTracking()
            .Include(p => p.Journal)
            .Include(p => p.PublicationAuthors).ThenInclude(pa => pa.Author)
            .Include(p => p.PublicationKeywords).ThenInclude(pk => pk.Keyword)
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            foreach (var term in GetSearchTerms(request.Keyword))
            {
                query = query.Where(p => p.Title.Contains(term)
                                        || (p.Abstract != null && p.Abstract.Contains(term))
                                        || p.PublicationKeywords.Any(pk => pk.Keyword != null && pk.Keyword.Term.Contains(term)));
            }
        }

        if (request.Year > 0)
        {
            query = query.Where(p => p.Year == request.Year);
        }
        else
        {
            if (request.YearFrom > 0)
            {
                query = query.Where(p => p.Year >= request.YearFrom);
            }

            if (request.YearTo > 0)
            {
                query = query.Where(p => p.Year <= request.YearTo);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.JournalId) && int.TryParse(request.JournalId, out var journalId))
        {
            query = query.Where(p => p.JournalId == journalId);
        }

        if (!string.IsNullOrWhiteSpace(request.Source))
        {
            var source = NormalizeSourceName(request.Source);
            if (!string.IsNullOrWhiteSpace(source))
            {
                query = query.Where(p => p.SourceApi == source);
            }
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "title" => query.OrderBy(p => p.Title),
            "year" => query.OrderByDescending(p => p.Year),
            "citations" => query.OrderByDescending(p => p.CitationCount),
            _ => query.OrderByDescending(p => p.CitationCount)
        };

        var total = await query.CountAsync();
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Search trigger dynamic recommendation alert
        if (userId.HasValue && !string.IsNullOrWhiteSpace(request.Keyword))
        {
            foreach (var item in items)
            {
                var existsNotification = await _context.Notifications
                    .AnyAsync(n => n.UserId == userId.Value
                                   && n.PublicationId == item.Id
                                   && n.NotificationType == NotificationType.RECOMMENDATION);

                if (!existsNotification)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = userId.Value,
                        PublicationId = item.Id,
                        Title = "Search match",
                        Message = $"Search match: We found '{item.Title}' containing the keyword '{request.Keyword}' you searched.",
                        Route = $"/student-publication?id={item.Id}",
                        NotificationType = NotificationType.RECOMMENDATION,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            await _context.SaveChangesAsync();
        }

        return new PaginatedResponse<PublicationDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PublicationDetailDto> GetPublicationDetailAsync(int id)
    {
        var publication = await _context.Publications
            .AsNoTracking()
            .Include(p => p.Journal)
            .Include(p => p.PublicationAuthors).ThenInclude(pa => pa.Author)
            .Include(p => p.PublicationKeywords).ThenInclude(pk => pk.Keyword)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

        if (publication == null)
        {
            throw new KeyNotFoundException($"Publication '{id}' was not found.");
        }

        var related = await _recommendationService.GetRelatedPublicationsAsync(id, 5);

        return new PublicationDetailDto
        {
            Publication = MapToDto(publication),
            RelatedPublications = related.ToList()
        };
    }

    public async Task<object> GetPublicationsStatisticsAsync()
    {
        var publications = await _context.Publications.Where(p => !p.IsDeleted).ToListAsync();
        if (!publications.Any())
        {
            return new
            {
                totalPublications = 0,
                avgCitation = 0.0,
                topYear = 0
            };
        }

        var totalPublications = publications.Count;
        var avgCitation = Math.Round(publications.Average(p => p.CitationCount), 2);

        var topYear = publications
            .GroupBy(p => p.Year)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefault();

        return new
        {
            totalPublications,
            avgCitation,
            topYear
        };
    }

    private static PublicationDto MapToDto(Publication publication)
    {
        return new PublicationDto
        {
            Id = publication.Id,
            Title = publication.Title,
            Abstract = publication.Abstract,
            Year = publication.Year,
            DOI = publication.DOI,
            JournalName = publication.Journal?.Name ?? string.Empty,
            SourceApi = publication.SourceApi,
            SourceUrl = ResolveSourceUrl(publication),
            CitationCount = publication.CitationCount,
            Authors = publication.PublicationAuthors.Select(pa => pa.Author?.Name ?? string.Empty).Where(name => !string.IsNullOrWhiteSpace(name)).ToList(),
            Keywords = publication.PublicationKeywords.Select(pk => pk.Keyword?.Term ?? string.Empty).Where(term => !string.IsNullOrWhiteSpace(term)).ToList(),
            KeywordIds = publication.PublicationKeywords.Select(pk => pk.KeywordId).ToList()
        };
    }

    private static string? ResolveSourceUrl(Publication publication)
    {
        if (!string.IsNullOrWhiteSpace(publication.SourceUrl))
        {
            return publication.SourceUrl;
        }

        var query = Uri.EscapeDataString(publication.Title);
        if (publication.SourceApi.Contains("Google Scholar", StringComparison.OrdinalIgnoreCase))
        {
            return $"https://scholar.google.com/scholar?q={query}";
        }

        if (publication.SourceApi.Contains("ResearchGate", StringComparison.OrdinalIgnoreCase))
        {
            return $"https://www.researchgate.net/search/publication?q={query}";
        }

        if (publication.SourceApi.Contains("OpenAlex", StringComparison.OrdinalIgnoreCase))
        {
            return $"https://openalex.org/search?q={query}";
        }

        return string.IsNullOrWhiteSpace(publication.DOI) ||
               publication.DOI.Contains(':', StringComparison.Ordinal)
            ? null
            : $"https://doi.org/{Uri.EscapeDataString(publication.DOI)}";
    }

    private async Task EnsureExternalSearchCacheAsync(PublicationSearchRequestDto request)
    {
        var keyword = string.IsNullOrWhiteSpace(request.Keyword)
            ? "artificial intelligence"
            : request.Keyword.Trim();
        // Pagination controls rendering, not which scholarly providers are
        // queried. Build a broad shared cache for the entered keyword.
        var maxResults = 80;
        var source = NormalizeSourceName(request.Source);
        var cachedCount = await CountCachedSearchMatchesAsync(request, source);
        var cacheTarget = string.IsNullOrWhiteSpace(source) ? 40 : 20;
        if (cachedCount >= cacheTarget)
        {
            return;
        }

        var attemptKey = string.Join('|',
            keyword.ToLowerInvariant(),
            source.ToLowerInvariant(),
            request.Year,
            request.YearFrom,
            request.YearTo,
            maxResults);
        var now = DateTime.UtcNow;
        if (ExternalSearchAttempts.TryGetValue(attemptKey, out var lastAttempt) &&
            now - lastAttempt < ExternalSearchAttemptTtl)
        {
            return;
        }
        ExternalSearchAttempts[attemptKey] = now;

        using var timeout = new CancellationTokenSource(ExternalSearchTimeout);

        var importTasks = new List<Task<IReadOnlyList<ExternalPublication>>>();
        if (string.IsNullOrWhiteSpace(source) || source == "OpenAlex")
        {
            importTasks.Add(_openAlexClient.SearchWorksAsync(keyword, maxResults, timeout.Token));
        }

        if (string.IsNullOrWhiteSpace(source) || source == "Google Scholar")
        {
            importTasks.Add(_scholarSearchClient.SearchAsync(keyword, 20, timeout.Token));
        }

        if (string.IsNullOrWhiteSpace(source) || source == "ResearchGate")
        {
            importTasks.Add(_scholarSearchClient.SearchResearchGateAsync(keyword, 20, timeout.Token));
        }

        if (string.IsNullOrWhiteSpace(source) || source == "Semantic Scholar")
        {
            importTasks.Add(_semanticScholarClient.SearchAsync(keyword, maxResults, timeout.Token));
        }

        if (importTasks.Count == 0)
        {
            return;
        }

        var results = await Task.WhenAll(importTasks.Select(FetchSafelyAsync));
        var publications = results
            .SelectMany(items => items)
            .Where(item => !string.IsNullOrWhiteSpace(item.Title))
            .GroupBy(item => string.IsNullOrWhiteSpace(item.DOI)
                ? item.Title.Trim()
                : item.DOI.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .OrderByDescending(item => item.CitationCount)
            .Take(100);
        foreach (var publication in publications)
        {
            await UpsertExternalPublicationAsync(publication, persistRawMetadata: false);
        }
    }

    private async Task<int> CountCachedSearchMatchesAsync(PublicationSearchRequestDto request, string source)
    {
        var query = _context.Publications
            .AsNoTracking()
            .Where(p => !p.IsDeleted);

        if (!string.IsNullOrWhiteSpace(source))
        {
            query = query.Where(p => p.SourceApi == source);
        }

        if (request.Year > 0)
        {
            query = query.Where(p => p.Year == request.Year);
        }
        else
        {
            if (request.YearFrom > 0)
            {
                query = query.Where(p => p.Year >= request.YearFrom);
            }

            if (request.YearTo > 0)
            {
                query = query.Where(p => p.Year <= request.YearTo);
            }
        }

        var keywordTerms = GetSearchTerms(request.Keyword);
        foreach (var term in keywordTerms)
        {
            query = query.Where(p => p.Title.Contains(term)
                                    || (p.Abstract != null && p.Abstract.Contains(term))
                                    || p.PublicationKeywords.Any(pk => pk.Keyword != null && pk.Keyword.Term.Contains(term)));
        }

        return await query.CountAsync();
    }

    private static async Task<IReadOnlyList<ExternalPublication>> FetchSafelyAsync(
        Task<IReadOnlyList<ExternalPublication>> sourceTask)
    {
        try
        {
            return await sourceTask;
        }
        catch
        {
            return Array.Empty<ExternalPublication>();
        }
    }

    private async Task UpsertExternalPublicationAsync(
        ExternalPublication external,
        bool persistRawMetadata = true)
    {
        var title = external.Title.Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            return;
        }

        var doi = string.IsNullOrWhiteSpace(external.DOI)
            ? $"{external.SourceApi.ToLowerInvariant().Replace(" ", "-")}:{StableHash(title)}"
            : external.DOI.Trim();
        var normalizedTitle = title.ToLowerInvariant();
        var existing = await _context.Publications
            .Include(p => p.Journal)
            .FirstOrDefaultAsync(p =>
                p.DOI == doi ||
                p.Title.ToLower() == normalizedTitle);

        if (existing != null)
        {
            existing.CitationCount = Math.Max(existing.CitationCount, external.CitationCount);
            existing.SourceApi = external.SourceApi;
            if (!string.IsNullOrWhiteSpace(external.SourceUrl))
            {
                existing.SourceUrl = external.SourceUrl;
            }
            existing.SyncedAt = DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(existing.Abstract) && !string.IsNullOrWhiteSpace(external.Abstract))
            {
                existing.Abstract = external.Abstract;
            }
            await _context.SaveChangesAsync();
            return;
        }

        var journal = await GetOrCreateExternalJournalAsync(external);
        var mongoId = persistRawMetadata
            ? await TryInsertRawMetadataAsync(external, doi)
            : null;
        var publication = new Publication
        {
            Title = title,
            Abstract = external.Abstract,
            Year = external.Year <= 0 ? DateTime.UtcNow.Year : external.Year,
            DOI = doi,
            JournalId = journal?.Id,
            CitationCount = external.CitationCount,
            SourceApi = external.SourceApi,
            SourceUrl = external.SourceUrl,
            MongoMetadataId = mongoId,
            IsDeleted = false,
            IsOriginal = true,
            SyncedAt = DateTime.UtcNow
        };

        _context.Publications.Add(publication);
        await _context.SaveChangesAsync();

        var authorOrder = 1;
        foreach (var authorName in external.Authors.Where(name => !string.IsNullOrWhiteSpace(name)).Distinct().Take(8))
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

        foreach (var keywordTerm in external.Keywords.Where(term => !string.IsNullOrWhiteSpace(term)).Distinct().Take(8))
        {
            var norm = keywordTerm.ToLowerInvariant().Trim();
            var keyword = await _context.Keywords.FirstOrDefaultAsync(k => k.NormalizedTerm == norm);
            if (keyword == null)
            {
                keyword = new Keyword { Term = keywordTerm, NormalizedTerm = norm };
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
    }

    private async Task<Journal?> GetOrCreateExternalJournalAsync(ExternalPublication external)
    {
        var name = string.IsNullOrWhiteSpace(external.JournalName)
            ? external.SourceApi
            : external.JournalName.Trim();
        var journal = await _context.Journals.FirstOrDefaultAsync(j => j.Name == name);
        if (journal != null)
        {
            return journal;
        }

        journal = new Journal
        {
            Name = name,
            Publisher = external.Publisher ?? external.SourceApi,
            ISSNOnline = $"ex-{StableHash(name)}"
        };
        _context.Journals.Add(journal);
        await _context.SaveChangesAsync();
        return journal;
    }

    private async Task<string?> TryInsertRawMetadataAsync(ExternalPublication external, string doi)
    {
        try
        {
            var insertTask = _mongoRepository.InsertAsync(new PublicationRawMetadata
            {
                Doi = doi,
                SourceApi = external.SourceApi,
                RawData = string.IsNullOrWhiteSpace(external.RawJson)
                    ? $"{{\"title\":\"{external.Title.Replace("\"", "\\\"")}\"}}"
                    : external.RawJson,
                SyncedAt = DateTime.UtcNow
            });

            var completedTask = await Task.WhenAny(insertTask, Task.Delay(TimeSpan.FromMilliseconds(200)));
            return completedTask == insertTask ? await insertTask : null;
        }
        catch
        {
            return null;
        }
    }

    private static string NormalizeSourceName(string? source)
    {
        if (string.IsNullOrWhiteSpace(source))
        {
            return string.Empty;
        }

        if (source.Contains("openalex", StringComparison.OrdinalIgnoreCase))
        {
            return "OpenAlex";
        }

        if (source.Contains("semantic", StringComparison.OrdinalIgnoreCase))
        {
            return "Semantic Scholar";
        }

        if (source.Contains("google", StringComparison.OrdinalIgnoreCase) ||
            source.Contains("scholar", StringComparison.OrdinalIgnoreCase))
        {
            return "Google Scholar";
        }

        if (source.Contains("researchgate", StringComparison.OrdinalIgnoreCase) ||
            source.Contains("research gate", StringComparison.OrdinalIgnoreCase))
        {
            return "ResearchGate";
        }

        if (source.Contains("connected", StringComparison.OrdinalIgnoreCase))
        {
            return "Connected Papers";
        }

        return source.Trim();
    }

    private static List<string> GetSearchTerms(string? keyword)
    {
        return string.IsNullOrWhiteSpace(keyword)
            ? new List<string>()
            : keyword
                .Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(term => term.Length > 2)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(8)
                .ToList();
    }

    private static string StableHash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value.ToLowerInvariant().Trim()));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }
}

