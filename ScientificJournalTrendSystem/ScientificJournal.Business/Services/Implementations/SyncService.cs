using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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
    private readonly ILogger<SyncService> _logger;
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IMongoMetadataRepository _mongoRepository;
    private readonly SemanticScholarClient _semanticScholarClient;
    private readonly OpenAlexClient _openAlexClient;

    public SyncService(
        ILogger<SyncService> logger, 
        AppDbContext context, 
        INotificationService notificationService,
        IMongoMetadataRepository mongoRepository,
        SemanticScholarClient semanticScholarClient,
        OpenAlexClient openAlexClient)
    {
        _logger = logger;
        _context = context;
        _notificationService = notificationService;
        _mongoRepository = mongoRepository;
        _semanticScholarClient = semanticScholarClient;
        _openAlexClient = openAlexClient;
    }

    public async Task SyncFromSemanticScholarAsync()
    {
        _logger.LogInformation("Semantic Scholar sync triggered.");
        var publications = await _semanticScholarClient.SearchAsync("machine learning OR artificial intelligence", 20);
        var synced = await ImportExternalPublicationsAsync(publications);

        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = "Semantic Scholar",
            Status = SyncStatus.Completed,
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow,
            RecordsSynced = synced
        });
        await _context.SaveChangesAsync();
    }

    public async Task SyncFromOpenAlexAsync()
    {
        _logger.LogInformation("OpenAlex sync triggered.");
        var publications = await _openAlexClient.SearchWorksAsync("machine learning OR artificial intelligence", 20);
        var synced = await ImportExternalPublicationsAsync(publications);

        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = "OpenAlex",
            Status = SyncStatus.Completed,
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow,
            RecordsSynced = synced
        });
        await _context.SaveChangesAsync();
    }

    private async Task<int> ImportExternalPublicationsAsync(IReadOnlyList<ExternalPublication> publications)
    {
        var synced = 0;
        var newPublications = new List<Publication>();
        foreach (var external in publications)
        {
            var publication = await UpsertExternalPublicationAsync(external);
            if (publication != null)
            {
                synced++;
                newPublications.Add(publication);
            }
        }

        if (newPublications.Count > 0)
        {
            await ProcessSyncNotificationsAsync(newPublications);
        }

        return synced;
    }

    private async Task<Publication?> UpsertExternalPublicationAsync(ExternalPublication external)
    {
        var title = external.Title.Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        var doi = string.IsNullOrWhiteSpace(external.DOI)
            ? $"{external.SourceApi.ToLowerInvariant().Replace(" ", "-")}:{StableHash(title)}"
            : external.DOI.Trim();
        var normalizedTitle = title.ToLowerInvariant();
        var existing = await _context.Publications.FirstOrDefaultAsync(p =>
            p.DOI == doi ||
            p.Title.ToLower() == normalizedTitle);

        if (existing != null)
        {
            existing.CitationCount = Math.Max(existing.CitationCount, external.CitationCount);
            existing.SourceApi = external.SourceApi;
            existing.SyncedAt = DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(existing.Abstract) && !string.IsNullOrWhiteSpace(external.Abstract))
            {
                existing.Abstract = external.Abstract;
            }
            await _context.SaveChangesAsync();
            return existing;
        }

        var journal = await GetOrCreateExternalJournalAsync(external);
        var mongoId = await TryInsertRawMetadataAsync(external, doi);
        var publication = new Publication
        {
            Title = title,
            Abstract = external.Abstract,
            Year = external.Year <= 0 ? DateTime.UtcNow.Year : external.Year,
            DOI = doi,
            JournalId = journal?.Id,
            CitationCount = external.CitationCount,
            SourceApi = external.SourceApi,
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
        return publication;
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

            var completedTask = await Task.WhenAny(insertTask, Task.Delay(TimeSpan.FromSeconds(2)));
            return completedTask == insertTask ? await insertTask : null;
        }
        catch
        {
            return null;
        }
    }

    private static string StableHash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value.ToLowerInvariant().Trim()));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
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
                .Where(f => (f.FollowType == FollowType.Keyword && (keywordIds.Contains(f.FollowTargetId) || (f.FollowTargetName != null && keywordTerms.Contains(f.FollowTargetName)))) ||
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

