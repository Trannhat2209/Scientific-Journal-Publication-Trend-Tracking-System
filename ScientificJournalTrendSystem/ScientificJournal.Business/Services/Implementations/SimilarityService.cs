using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Helpers;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.Business.Services.Implementations;

public class SimilarityService : ISimilarityService
{
    private readonly AppDbContext _context;

    public SimilarityService(AppDbContext context)
    {
        _context = context;
    }

    public double CalculateSimilarity(string text1, string text2)
    {
        if (string.IsNullOrWhiteSpace(text1) || string.IsNullOrWhiteSpace(text2))
            return 0.0;

        var set1 = Tokenize(text1);
        var set2 = Tokenize(text2);

        return SimilarityHelper.CalculateJaccardSimilarity(set1, set2);
    }

    public async Task<double> GetSimilarityScoreAsync(int pubId1, int pubId2)
    {
        if (pubId1 == pubId2) return 1.0;

        var pub1Keywords = await GetPublicationKeywordTermsAsync(pubId1);
        var pub2Keywords = await GetPublicationKeywordTermsAsync(pubId2);

        return SimilarityHelper.CalculateJaccardSimilarity(pub1Keywords, pub2Keywords);
    }

    public async Task<bool> IsDuplicateRiskAsync(int pubId1, int pubId2)
    {
        var score = await GetSimilarityScoreAsync(pubId1, pubId2);
        return score >= 0.5;
    }

    public async Task<CappedSimilarityDto> GetCappedSimilarityAsync(int pubId1, int pubId2, UserRole role, bool isPro)
    {
        double originalScore = await GetSimilarityScoreAsync(pubId1, pubId2);

        // Determine limit
        double limit = 1.0;
        if (role == UserRole.Student)
        {
            limit = isPro ? 0.30 : 0.15;
        }
        else if (role == UserRole.Lecturer)
        {
            limit = isPro ? 0.40 : 0.20;
        }
        else if (role == UserRole.Researcher)
        {
            limit = isPro ? 0.45 : 0.25;
        }
        else if (role == UserRole.Admin)
        {
            limit = 1.0;
        }

        bool isCapped = originalScore > limit;
        double displayScore = isCapped ? limit : originalScore;

        string message = isCapped
            ? $"Similarity score is capped at {(limit * 100)}% for {role} ({(isPro ? "Pro" : "Free")} tier). Upgrade to Pro package to view higher scores."
            : $"Viewing similarity score (Limit is {(limit * 100)}% for {role}).";

        return new CappedSimilarityDto
        {
            OriginalScore = Math.Round(originalScore * 100, 2),
            DisplayScore = Math.Round(displayScore * 100, 2),
            LimitApplied = Math.Round(limit * 100, 2),
            IsCapped = isCapped,
            Message = message
        };
    }

    private HashSet<string> Tokenize(string text)
    {
        return text.ToLowerInvariant()
            .Split(new[] { ' ', '.', ',', ';', ':', '?', '!', '(', ')', '[', ']', '-', '_' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(w => w.Trim())
            .Where(w => w.Length > 2)
            .ToHashSet();
    }

    private async Task<HashSet<string>> GetPublicationKeywordTermsAsync(int publicationId)
    {
        var terms = await _context.PublicationKeywords
            .Where(pk => pk.PublicationId == publicationId)
            .Select(pk => pk.Keyword!.NormalizedTerm)
            .ToListAsync();

        return new HashSet<string>(terms, StringComparer.OrdinalIgnoreCase);
    }
}
