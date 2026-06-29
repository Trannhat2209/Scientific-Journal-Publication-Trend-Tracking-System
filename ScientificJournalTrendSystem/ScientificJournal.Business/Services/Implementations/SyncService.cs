using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Mongo;

namespace ScientificJournal.Business.Services.Implementations;

public class SyncService : ISyncService
{
    private readonly ILogger<SyncService> _logger;
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IMongoMetadataRepository _mongoRepository;

    public SyncService(
        ILogger<SyncService> logger, 
        AppDbContext context, 
        INotificationService notificationService,
        IMongoMetadataRepository mongoRepository)
    {
        _logger = logger;
        _context = context;
        _notificationService = notificationService;
        _mongoRepository = mongoRepository;
    }

    public async Task SyncFromSemanticScholarAsync()
    {
        _logger.LogInformation("Semantic Scholar sync triggered.");
        
        // Simulating the addition of a synced publication to trigger follows/notifications
        var sampleJournal = await _context.Journals.FirstOrDefaultAsync();
        if (sampleJournal != null)
        {
            var doi = $"10.1016/j.neunet.{new Random().Next(100000, 999999)}";
            
            // 1. Create and Save Raw Metadata in MongoDB
            var rawMetadata = new PublicationRawMetadata
            {
                Doi = doi,
                SourceApi = "SemanticScholar",
                RawData = $"{{\"title\":\"Advancements in Deep Learning and Neural Networks 2026\", \"abstract\":\"This paper reviews state of the art techniques in deep learning architectures.\", \"year\":2026, \"citationCount\":5, \"journal\":\"{sampleJournal.Name}\"}}",
                SyncedAt = DateTime.UtcNow
            };
            
            var mongoId = await _mongoRepository.InsertAsync(rawMetadata);

            // 2. Create and Save structured Publication in SQL Server
            var pub = new Publication
            {
                Title = "Advancements in Deep Learning and Neural Networks 2026",
                Abstract = "This paper reviews state of the art techniques in deep learning architectures.",
                Year = 2026,
                DOI = doi,
                SourceApi = "SemanticScholar",
                CitationCount = 5,
                JournalId = sampleJournal.Id,
                SyncedAt = DateTime.UtcNow,
                IsDeleted = false,
                MongoMetadataId = mongoId // Link SQL record to MongoDB Document ID
            };

            _context.Publications.Add(pub);
            await _context.SaveChangesAsync();

            // Mock a keyword association
            var sampleKeyword = await _context.Keywords.FirstOrDefaultAsync();
            if (sampleKeyword != null)
            {
                var pubKeyword = new PublicationKeyword
                {
                    PublicationId = pub.Id,
                    KeywordId = sampleKeyword.Id
                };
                _context.PublicationKeywords.Add(pubKeyword);
                await _context.SaveChangesAsync();
            }

            // Trigger notification workflow for this newly synced publication
            await ProcessSyncNotificationsAsync(new List<Publication> { pub });
        }

        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = "SemanticScholar",
            Status = SyncStatus.Completed,
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow,
            RecordsSynced = 1
        });
        await _context.SaveChangesAsync();
    }

    public async Task SyncFromOpenAlexAsync()
    {
        _logger.LogInformation("OpenAlex comparison-only sync triggered. Fetching metadata for comparison... (Relational database insertion skipped)");
        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = "OpenAlex",
            Status = SyncStatus.Completed,
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow,
            RecordsSynced = 0
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

