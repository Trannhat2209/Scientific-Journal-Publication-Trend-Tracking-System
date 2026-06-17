using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class RecommendationService : IRecommendationService
{
    private readonly AppDbContext _context;
    private readonly ISimilarityService _similarityService;

    public RecommendationService(AppDbContext context, ISimilarityService similarityService)
    {
        _context = context;
        _similarityService = similarityService;
    }

    public async Task<IEnumerable<RelatedPublicationDto>> GetRelatedPublicationsAsync(Guid publicationId, int limit = 5)
    {
        var targetPub = await _context.Publications.FindAsync(publicationId);
        if (targetPub == null) return Enumerable.Empty<RelatedPublicationDto>();

        // Get target publication's keyword IDs
        var targetKeywordIds = await _context.PublicationKeywords
            .Where(pk => pk.PublicationId == publicationId)
            .Select(pk => pk.KeywordId)
            .ToListAsync();

        if (!targetKeywordIds.Any())
            return Enumerable.Empty<RelatedPublicationDto>();

        // Get candidates that share at least one keyword
        var candidateIds = await _context.PublicationKeywords
            .Where(pk => pk.PublicationId != publicationId && targetKeywordIds.Contains(pk.KeywordId))
            .Select(pk => pk.PublicationId)
            .Distinct()
            .ToListAsync();

        var candidates = await _context.Publications
            .Where(p => candidateIds.Contains(p.Id))
            .ToListAsync();

        var relatedList = new List<RelatedPublicationDto>();

        foreach (var candidate in candidates)
        {
            var score = await _similarityService.GetSimilarityScoreAsync(publicationId, candidate.Id);
            relatedList.Add(new RelatedPublicationDto
            {
                PublicationId = candidate.Id,
                Title = candidate.Title,
                SimilarityScore = score,
                IsDuplicateRisk = score >= 0.5
            });
        }

        return relatedList
            .OrderByDescending(r => r.SimilarityScore)
            .Take(limit)
            .ToList();
    }

    public async Task<IEnumerable<PublicationDto>> GetRecommendationsForUserAsync(Guid userId, int limit = 5)
    {
        // Get user's bookmarked publication IDs
        var bookmarkedPubIds = await _context.Bookmarks
            .Where(b => b.UserId == userId)
            .Select(b => b.PublicationId)
            .ToListAsync();

        // Get target keyword IDs from bookmarks
        var bookmarkedKeywordIds = await _context.PublicationKeywords
            .Where(pk => bookmarkedPubIds.Contains(pk.PublicationId))
            .Select(pk => pk.KeywordId)
            .ToListAsync();

        // Also get user's followed keywords (if user follows keywords directly)
        var followedTargetIds = await _context.Follows
            .Where(f => f.UserId == userId && f.FollowType == FollowType.Keyword)
            .Select(f => f.FollowTargetId)
            .ToListAsync();

        // Parse followed target IDs (assuming they are stored as Guid strings or raw terms)
        var followedGuids = new List<Guid>();
        foreach (var fid in followedTargetIds)
        {
            if (Guid.TryParse(fid, out var guid))
            {
                followedGuids.Add(guid);
            }
        }

        var allInterestKeywordIds = bookmarkedKeywordIds.Union(followedGuids).Distinct().ToList();

        if (!allInterestKeywordIds.Any())
        {
            // If user has no preferences, return latest/top cited publications as fallback
            var fallbacks = await _context.Publications
                .Include(p => p.Journal)
                .Include(p => p.PublicationAuthors).ThenInclude(pa => pa.Author)
                .Include(p => p.PublicationKeywords).ThenInclude(pk => pk.Keyword)
                .OrderByDescending(p => p.CitationCount)
                .Take(limit)
                .ToListAsync();

            return fallbacks.Select(MapToDto).ToList();
        }

        // Find publications that match these keyword IDs and are not already bookmarked
        var recommendedPubIds = await _context.PublicationKeywords
            .Where(pk => allInterestKeywordIds.Contains(pk.KeywordId) && !bookmarkedPubIds.Contains(pk.PublicationId))
            .Select(pk => pk.PublicationId)
            .Distinct()
            .ToListAsync();

        var recommendations = await _context.Publications
            .Include(p => p.Journal)
            .Include(p => p.PublicationAuthors).ThenInclude(pa => pa.Author)
            .Include(p => p.PublicationKeywords).ThenInclude(pk => pk.Keyword)
            .Where(p => recommendedPubIds.Contains(p.Id))
            .OrderByDescending(p => p.CitationCount)
            .Take(limit)
            .ToListAsync();

        return recommendations.Select(MapToDto).ToList();
    }

    private PublicationDto MapToDto(Publication p)
    {
        return new PublicationDto
        {
            Id = p.Id,
            Title = p.Title,
            Abstract = p.Abstract,
            Year = p.Year,
            DOI = p.DOI,
            JournalName = p.Journal?.Name ?? string.Empty,
            CitationCount = p.CitationCount,
            Authors = p.PublicationAuthors?.Select(pa => pa.Author?.Name ?? string.Empty).Where(n => !string.IsNullOrEmpty(n)).ToList() ?? new List<string>(),
            Keywords = p.PublicationKeywords?.Select(pk => pk.Keyword?.Term ?? string.Empty).Where(k => !string.IsNullOrEmpty(k)).ToList() ?? new List<string>()
        };
    }
}
