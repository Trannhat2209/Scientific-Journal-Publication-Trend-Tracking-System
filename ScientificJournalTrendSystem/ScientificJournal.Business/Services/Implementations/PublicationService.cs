using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Publication;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Mongo;

namespace ScientificJournal.Business.Services.Implementations;

public class PublicationService : IPublicationService
{
    private readonly AppDbContext _context;
    private readonly IRecommendationService _recommendationService;
    private readonly ISimilarityService _similarityService;
    private readonly IPlagiarismCheckService _plagiarismCheckService;
    private readonly IMongoMetadataRepository _mongoRepository;

    public PublicationService(
        AppDbContext context, 
        IRecommendationService recommendationService,
        ISimilarityService similarityService,
        IPlagiarismCheckService plagiarismCheckService,
        IMongoMetadataRepository mongoRepository)
    {
        _context = context;
        _recommendationService = recommendationService;
        _similarityService = similarityService;
        _plagiarismCheckService = plagiarismCheckService;
        _mongoRepository = mongoRepository;
    }

    public async Task<PaginatedResponse<PublicationDto>> SearchPublicationsAsync(PublicationSearchRequestDto request, int? userId = null)
    {
        var query = _context.Publications
            .AsNoTracking()
            .Include(p => p.Journal)
            .Include(p => p.PublicationAuthors).ThenInclude(pa => pa.Author)
            .Include(p => p.PublicationKeywords).ThenInclude(pk => pk.Keyword)
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            query = query.Where(p => p.Title.Contains(request.Keyword)
                                    || (p.Abstract != null && p.Abstract.Contains(request.Keyword))
                                    || p.PublicationKeywords.Any(pk => pk.Keyword.Term.Contains(request.Keyword)));
        }

        if (request.Year > 0)
        {
            query = query.Where(p => p.Year == request.Year);
        }

        if (!string.IsNullOrWhiteSpace(request.JournalId) && int.TryParse(request.JournalId, out var journalId))
        {
            query = query.Where(p => p.JournalId == journalId);
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "title" => query.OrderBy(p => p.Title),
            "year" => query.OrderByDescending(p => p.Year),
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
                        Message = $"Search match: We found '{item.Title}' containing the keyword '{request.Keyword}' you searched.",
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

    public async Task<UploadResultDto> UploadPublicationAsync(UploadPublicationDto request)
    {
        // 1. Google Scholar AI external check
        var plagiarismReport = await _plagiarismCheckService.CheckPlagiarismAsync(request.Title, request.Abstract);
        if (!plagiarismReport.IsPassed)
        {
            return new UploadResultDto
            {
                Success = false,
                Message = $"Plagiarism check failed: Paper duplicates external sources by {plagiarismReport.DuplicationPercentage}% (exceeds 50% limit). Matching Source: {plagiarismReport.MatchingSource}",
                GoogleScholarDuplicationScore = plagiarismReport.DuplicationPercentage,
                InternalDuplicationScore = 0.0
            };
        }

        // 2. Internal duplication check
        var existingPubs = await _context.Publications.Where(p => !p.IsDeleted).ToListAsync();
        double highestInternalScore = 0.0;
        string matchingInternalTitle = string.Empty;

        foreach (var pub in existingPubs)
        {
            double titleSim = _similarityService.CalculateSimilarity(request.Title, pub.Title);
            double abstractSim = _similarityService.CalculateSimilarity(request.Abstract, pub.Abstract ?? string.Empty);
            double avgSim = (titleSim * 0.3) + (abstractSim * 0.7);

            if (avgSim > highestInternalScore)
            {
                highestInternalScore = avgSim;
                matchingInternalTitle = pub.Title;
            }
        }

        double internalPercentage = Math.Round(highestInternalScore * 100, 2);
        if (internalPercentage >= 51.0)
        {
            return new UploadResultDto
            {
                Success = false,
                Message = $"Upload rejected: Paper has 51% or higher similarity ({internalPercentage}%) with an existing publication: '{matchingInternalTitle}'.",
                GoogleScholarDuplicationScore = plagiarismReport.DuplicationPercentage,
                InternalDuplicationScore = internalPercentage
            };
        }

        // 3. Document in MongoDB (raw metadata)
        var doi = string.IsNullOrWhiteSpace(request.DOI) ? $"10.1016/uploaded.{new Random().Next(100000, 999999)}" : request.DOI;
        var rawMetadata = new PublicationRawMetadata
        {
            Doi = doi,
            SourceApi = "UserUpload",
            RawData = $"{{ \"title\": \"{request.Title.Replace("\"", "\\\"")}\", \"doi\": \"{doi}\", \"abstract\": \"{request.Abstract.Replace("\"", "\\\"")}\" }}",
            SyncedAt = DateTime.UtcNow
        };
        var mongoId = await _mongoRepository.InsertAsync(rawMetadata);

        // 4. Save to SQL Server database
        var publication = new Publication
        {
            Title = request.Title,
            Abstract = request.Abstract,
            Year = request.Year,
            DOI = doi,
            JournalId = request.JournalId,
            CitationCount = 0,
            SourceApi = "UserUpload",
            MongoMetadataId = mongoId,
            IsDeleted = false,
            IsOriginal = false,
            SyncedAt = DateTime.UtcNow
        };

        _context.Publications.Add(publication);
        await _context.SaveChangesAsync();

        // 5. Link Authors
        foreach (var authorName in request.Authors)
        {
            if (string.IsNullOrWhiteSpace(authorName)) continue;
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
                AuthorOrder = 1
            });
        }

        // 6. Link Keywords
        foreach (var keywordTerm in request.Keywords)
        {
            if (string.IsNullOrWhiteSpace(keywordTerm)) continue;
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

        // 7. Dynamic Alert: if new paper matched user followed keywords
        foreach (var keywordTerm in request.Keywords)
        {
            var norm = keywordTerm.ToLowerInvariant().Trim();
            var keyword = await _context.Keywords.FirstOrDefaultAsync(k => k.NormalizedTerm == norm);
            if (keyword != null)
            {
                var follows = await _context.Follows
                    .Where(f => f.FollowType == FollowType.Keyword && f.FollowTargetId == keyword.Id)
                    .ToListAsync();

                foreach (var follow in follows)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = follow.UserId,
                        PublicationId = publication.Id,
                        Message = $"New publication uploaded matching your followed keyword '{follow.FollowTargetName}': {publication.Title}",
                        NotificationType = NotificationType.NEW_PUBLICATION,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }
        await _context.SaveChangesAsync();

        return new UploadResultDto
        {
            Success = true,
            Message = "Paper uploaded successfully. Passed Google Scholar AI plagiarism check and internal Jaccard similarity validation.",
            PublicationId = publication.Id,
            GoogleScholarDuplicationScore = plagiarismReport.DuplicationPercentage,
            InternalDuplicationScore = internalPercentage
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
            CitationCount = publication.CitationCount,
            Authors = publication.PublicationAuthors.Select(pa => pa.Author?.Name ?? string.Empty).Where(name => !string.IsNullOrWhiteSpace(name)).ToList(),
            Keywords = publication.PublicationKeywords.Select(pk => pk.Keyword?.Term ?? string.Empty).Where(term => !string.IsNullOrWhiteSpace(term)).ToList()
        };
    }
}

