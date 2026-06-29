using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
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
