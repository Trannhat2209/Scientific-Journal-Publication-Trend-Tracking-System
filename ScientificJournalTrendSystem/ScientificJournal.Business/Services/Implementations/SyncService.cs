using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Mongo;
using ScientificJournal.DataAccess.External;
using System.Text.Json;

namespace ScientificJournal.Business.Services.Implementations;

public class SyncService : ISyncService
{
    private readonly ILogger<SyncService> _logger;
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IMongoMetadataRepository _mongoRepository;
    private readonly SemanticScholarClient _scholarClient;

    public SyncService(
        ILogger<SyncService> logger, 
        AppDbContext context, 
        INotificationService notificationService,
        IMongoMetadataRepository mongoRepository,
        SemanticScholarClient scholarClient)
    {
        _logger = logger;
        _context = context;
        _notificationService = notificationService;
        _mongoRepository = mongoRepository;
        _scholarClient = scholarClient;
    }

    public async Task SyncFromSemanticScholarAsync(string? specificKeyword = null)
    {
        _logger.LogInformation("Semantic Scholar sync triggered (Real API connection).");

        // 1. Get the list of keywords to sync
        List<string> keywords;
        if (!string.IsNullOrWhiteSpace(specificKeyword))
        {
            keywords = new List<string> { specificKeyword };
            // Ensure the specific keyword is in the database Keywords table
            var dbKeyword = await _context.Keywords.FirstOrDefaultAsync(k => k.Term == specificKeyword);
            if (dbKeyword == null)
            {
                dbKeyword = new Keyword
                {
                    Term = specificKeyword,
                    NormalizedTerm = specificKeyword.ToLowerInvariant().Trim()
                };
                _context.Keywords.Add(dbKeyword);
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            keywords = await _context.Keywords.Select(k => k.Term).ToListAsync();
            if (keywords.Count == 0)
            {
                // Seed default keywords if none exist
                keywords = new List<string> { "Deep Learning", "NLP", "artificial intelligence" };
                foreach (var term in keywords)
                {
                    _context.Keywords.Add(new Keyword
                    {
                        Term = term,
                        NormalizedTerm = term.ToLowerInvariant().Trim()
                    });
                }
                await _context.SaveChangesAsync();
            }
        }

        int syncedCount = 0;
        var newPublications = new List<Publication>();

        // 2. Loop through each keyword and search the Semantic Scholar API
        for (int i = 0; i < keywords.Count; i++)
        {
            var keyword = keywords[i];
            
            // Add delay to prevent hitting Semantic Scholar rate limits (429) if querying multiple keywords
            if (i > 0)
            {
                _logger.LogInformation("Waiting 2 seconds to avoid rate limits...");
                await Task.Delay(2000);
            }

            _logger.LogInformation($"Fetching papers for keyword: {keyword}");
            var searchResponse = await _scholarClient.SearchPapersAsync(keyword, 5);
            if (searchResponse == null || searchResponse.Data.Count == 0)
            {
                _logger.LogWarning($"Semantic Scholar failed or rate-limited for '{keyword}'. Attempting SerpApi Google Scholar fallback...");
                var syncedFromFallback = await SyncFromSerpApiAsync(keyword);
                if (syncedFromFallback > 0)
                {
                    syncedCount += syncedFromFallback;
                }
                continue;
            }

            foreach (var paper in searchResponse.Data)
            {
                var doi = paper.ExternalIds?.DOI;
                var title = paper.Title;

                if (string.IsNullOrWhiteSpace(title)) continue;

                // Check if already synced using DOI (or title if DOI is missing)
                bool exists = false;
                if (!string.IsNullOrWhiteSpace(doi))
                {
                    exists = await _context.Publications.AnyAsync(p => p.DOI == doi && !p.IsDeleted);
                }
                else
                {
                    exists = await _context.Publications.AnyAsync(p => p.Title == title && !p.IsDeleted);
                }

                if (exists) continue;

                // Find or create Journal based on venue
                var journalName = string.IsNullOrWhiteSpace(paper.Venue) ? "Unknown Journal" : paper.Venue;
                var journal = await _context.Journals.FirstOrDefaultAsync(j => j.Name == journalName);
                if (journal == null)
                {
                    journal = new Journal
                    {
                        Name = journalName,
                        Publisher = "Unknown",
                        ISSNOnline = "",
                        IsDeleted = false
                    };
                    _context.Journals.Add(journal);
                    await _context.SaveChangesAsync();
                }

                // A. Insert raw metadata into MongoDB
                var rawJson = JsonSerializer.Serialize(paper);
                var rawMetadata = new PublicationRawMetadata
                {
                    Doi = doi ?? string.Empty,
                    SourceApi = "SemanticScholar",
                    RawData = rawJson,
                    SyncedAt = DateTime.UtcNow
                };
                var mongoId = await _mongoRepository.InsertAsync(rawMetadata);

                // B. Insert structured publication into SQL Server
                var publication = new Publication
                {
                    Title = title,
                    Abstract = paper.Abstract ?? "No abstract provided.",
                    Year = paper.Year ?? DateTime.UtcNow.Year,
                    DOI = doi,
                    SourceApi = "SemanticScholar",
                    CitationCount = paper.CitationCount,
                    JournalId = journal.Id,
                    SyncedAt = DateTime.UtcNow,
                    IsDeleted = false,
                    MongoMetadataId = mongoId
                };

                _context.Publications.Add(publication);
                await _context.SaveChangesAsync();

                // C. Map Authors
                if (paper.Authors != null && paper.Authors.Count > 0)
                {
                    int authorOrder = 1;
                    foreach (var authorDto in paper.Authors)
                    {
                        var authorName = authorDto.Name?.Trim();
                        if (string.IsNullOrWhiteSpace(authorName)) continue;

                        var author = await _context.Authors.FirstOrDefaultAsync(a => a.Name == authorName);
                        if (author == null)
                        {
                            author = new Author
                            {
                                Name = authorName,
                                ExternalId = string.IsNullOrWhiteSpace(authorDto.AuthorId) ? Guid.NewGuid().ToString("N") : authorDto.AuthorId,
                                Affiliation = "Unknown"
                            };
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
                    await _context.SaveChangesAsync();
                }

                // D. Map Keywords
                var dbKeyword = await _context.Keywords.FirstOrDefaultAsync(k => k.Term == keyword);
                if (dbKeyword != null)
                {
                    _context.PublicationKeywords.Add(new PublicationKeyword
                    {
                        PublicationId = publication.Id,
                        KeywordId = dbKeyword.Id
                    });
                    await _context.SaveChangesAsync();
                }

                newPublications.Add(publication);
                syncedCount++;
            }
        }

        // 3. Trigger notification workflow for all newly synced publications
        if (newPublications.Count > 0)
        {
            await ProcessSyncNotificationsAsync(newPublications);
        }

        // 4. Save Sync Log
        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = "SemanticScholar",
            Status = SyncStatus.Completed,
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow,
            RecordsSynced = syncedCount
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

    private async Task<int> SyncFromSerpApiAsync(string keyword)
    {
        var apiKey = ResolveSerpApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("SerpApi API key not found. Fallback skipped.");
            return 0;
        }

        try
        {
            using var client = new HttpClient();
            var url = $"https://serpapi.com/search.json?engine=google_scholar&q={Uri.EscapeDataString(keyword)}&num=5&api_key={Uri.EscapeDataString(apiKey)}";
            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning($"SerpApi request failed with status: {response.StatusCode}");
                return 0;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            if (root.TryGetProperty("error", out var errorElement))
            {
                _logger.LogWarning($"SerpApi returned error: {errorElement.GetString()}");
                return 0;
            }

            if (!root.TryGetProperty("organic_results", out var results) || results.ValueKind != JsonValueKind.Array)
            {
                _logger.LogInformation("No results returned from SerpApi Google Scholar.");
                return 0;
            }

            int syncedCount = 0;
            var newPublications = new List<Publication>();

            foreach (var item in results.EnumerateArray())
            {
                var title = item.TryGetProperty("title", out var titleEl) ? titleEl.GetString() : null;
                if (string.IsNullOrWhiteSpace(title)) continue;

                // Check duplicate
                bool exists = await _context.Publications.AnyAsync(p => p.Title == title && !p.IsDeleted);
                if (exists) continue;

                var snippet = item.TryGetProperty("snippet", out var snipEl) ? snipEl.GetString() : "No abstract provided.";
                var link = item.TryGetProperty("link", out var linkEl) ? linkEl.GetString() : null;

                // Try to parse citation count
                int citations = 0;
                if (item.TryGetProperty("inline_links", out var inlineLinks) &&
                    inlineLinks.TryGetProperty("cited_by", out var citedBy) &&
                    citedBy.TryGetProperty("total", out var totalEl))
                {
                    if (totalEl.ValueKind == JsonValueKind.Number)
                    {
                        citations = totalEl.GetInt32();
                    }
                    else if (totalEl.ValueKind == JsonValueKind.String && int.TryParse(totalEl.GetString(), out var parsedCites))
                    {
                        citations = parsedCites;
                    }
                }

                // Try to parse year and venue from summary
                int year = DateTime.UtcNow.Year;
                string journalName = "Google Scholar Publication";
                if (item.TryGetProperty("publication_info", out var pubInfo))
                {
                    var summary = pubInfo.TryGetProperty("summary", out var sumEl) ? sumEl.GetString() : null;
                    if (!string.IsNullOrWhiteSpace(summary))
                    {
                        // Find a 4 digit number for the year
                        var yearMatch = System.Text.RegularExpressions.Regex.Match(summary, @"\b(19|20)\d{2}\b");
                        if (yearMatch.Success && int.TryParse(yearMatch.Value, out var parsedYear))
                        {
                            year = parsedYear;
                        }

                        // Try to find journal name (often between dashes in the summary)
                        var parts = summary.Split('-');
                        if (parts.Length > 1)
                        {
                            var possibleJournal = parts[1].Trim();
                            // If it has commas, take the last part
                            if (possibleJournal.Contains(","))
                            {
                                possibleJournal = possibleJournal.Split(',').Last().Trim();
                            }
                            if (!string.IsNullOrWhiteSpace(possibleJournal) && !System.Text.RegularExpressions.Regex.IsMatch(possibleJournal, @"^\d+$"))
                            {
                                journalName = possibleJournal;
                            }
                        }
                    }
                }

                // Find or create Journal
                var journal = await _context.Journals.FirstOrDefaultAsync(j => j.Name == journalName);
                if (journal == null)
                {
                    journal = new Journal
                    {
                        Name = journalName,
                        Publisher = "Google Scholar Publisher",
                        ISSNOnline = "",
                        IsDeleted = false
                    };
                    _context.Journals.Add(journal);
                    await _context.SaveChangesAsync();
                }

                // Raw metadata for MongoDB
                var rawJson = JsonSerializer.Serialize(item);
                var rawMetadata = new PublicationRawMetadata
                {
                    Doi = link ?? string.Empty,
                    SourceApi = "GoogleScholarViaSerpApi",
                    RawData = rawJson,
                    SyncedAt = DateTime.UtcNow
                };
                var mongoId = await _mongoRepository.InsertAsync(rawMetadata);

                // SQL Publication
                var publication = new Publication
                {
                    Title = title,
                    Abstract = snippet,
                    Year = year,
                    DOI = link,
                    SourceApi = "GoogleScholarViaSerpApi",
                    CitationCount = citations,
                    JournalId = journal.Id,
                    SyncedAt = DateTime.UtcNow,
                    IsDeleted = false,
                    MongoMetadataId = mongoId
                };

                _context.Publications.Add(publication);
                await _context.SaveChangesAsync();

                // Map authors
                if (pubInfo.TryGetProperty("authors", out var authorsEl) && authorsEl.ValueKind == JsonValueKind.Array)
                {
                    int authorOrder = 1;
                    foreach (var authorItem in authorsEl.EnumerateArray())
                    {
                        var authorName = authorItem.TryGetProperty("name", out var nameEl) ? nameEl.GetString()?.Trim() : null;
                        if (string.IsNullOrWhiteSpace(authorName)) continue;

                        var author = await _context.Authors.FirstOrDefaultAsync(a => a.Name == authorName);
                        if (author == null)
                        {
                            author = new Author
                            {
                                Name = authorName,
                                ExternalId = (!authorItem.TryGetProperty("id", out var idEl) || string.IsNullOrWhiteSpace(idEl.GetString())) ? Guid.NewGuid().ToString("N") : idEl.GetString()!,
                                Affiliation = "Google Scholar Author"
                            };
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
                    await _context.SaveChangesAsync();
                }

                // Map Keyword
                var dbKeyword = await _context.Keywords.FirstOrDefaultAsync(k => k.Term == keyword);
                if (dbKeyword != null)
                {
                    _context.PublicationKeywords.Add(new PublicationKeyword
                    {
                        PublicationId = publication.Id,
                        KeywordId = dbKeyword.Id
                    });
                    await _context.SaveChangesAsync();
                }

                newPublications.Add(publication);
                syncedCount++;
            }

            if (newPublications.Count > 0)
            {
                await ProcessSyncNotificationsAsync(newPublications);
            }

            return syncedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error during SerpApi Google Scholar fallback sync for keyword '{keyword}'");
            return 0;
        }
    }

    private string ResolveSerpApiKey()
    {
        var val = Environment.GetEnvironmentVariable("SERPAPI_API_KEY");
        if (!string.IsNullOrWhiteSpace(val)) return val;

        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current != null)
        {
            var envPath = Path.Combine(current.FullName, ".env");
            if (File.Exists(envPath))
            {
                foreach (var line in File.ReadLines(envPath))
                {
                    var trimmed = line.Trim();
                    if (trimmed.Length == 0 || trimmed.StartsWith("#")) continue;
                    var separator = trimmed.IndexOf('=');
                    if (separator <= 0) continue;
                    var name = trimmed[..separator].Trim();
                    if (string.Equals(name, "SERPAPI_API_KEY", StringComparison.OrdinalIgnoreCase))
                    {
                        return trimmed[(separator + 1)..].Trim().Trim('"');
                    }
                }
            }
            current = current.Parent;
        }
        return string.Empty;
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
