using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Publication;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class PublicationService : IPublicationService
{
    private readonly AppDbContext _context;
    private readonly IRecommendationService _recommendationService;

    public PublicationService(AppDbContext context, IRecommendationService recommendationService)
    {
        _context = context;
        _recommendationService = recommendationService;
    }

    public async Task<PaginatedResponse<PublicationDto>> SearchPublicationsAsync(PublicationSearchRequestDto request)
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
            CitationCount = publication.CitationCount,
            Authors = publication.PublicationAuthors.Select(pa => pa.Author?.Name ?? string.Empty).Where(name => !string.IsNullOrWhiteSpace(name)).ToList(),
            Keywords = publication.PublicationKeywords.Select(pk => pk.Keyword?.Term ?? string.Empty).Where(term => !string.IsNullOrWhiteSpace(term)).ToList()
        };
    }
}

