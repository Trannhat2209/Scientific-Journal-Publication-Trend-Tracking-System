using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.Business.Services.Implementations;

public class GoogleScholarAiService : IPlagiarismCheckService
{
    private readonly AppDbContext _context;
    private readonly ISimilarityService _similarityService;

    public GoogleScholarAiService(AppDbContext context, ISimilarityService similarityService)
    {
        _context = context;
        _similarityService = similarityService;
    }

    public async Task<PlagiarismReportDto> CheckPlagiarismAsync(string title, string abstractText)
    {
        // Get all publications to compare
        var existingPubs = await _context.Publications
            .Where(p => !p.IsDeleted)
            .ToListAsync();

        double maxScore = 0.0;
        string matchingSource = "None";

        foreach (var pub in existingPubs)
        {
            // Compute similarity based on title & abstract text
            double titleSim = _similarityService.CalculateSimilarity(title, pub.Title);
            double abstractSim = _similarityService.CalculateSimilarity(abstractText, pub.Abstract ?? string.Empty);
            
            // Average similarity of title (30%) and abstract (70%)
            double avgSim = (titleSim * 0.3) + (abstractSim * 0.7);

            if (avgSim > maxScore)
            {
                maxScore = avgSim;
                matchingSource = pub.Title;
            }
        }

        // Mock external Google Scholar AI checking triggers
        if (!string.IsNullOrEmpty(abstractText))
        {
            if (abstractText.Contains("plagiarism-test-high"))
            {
                maxScore = 0.85;
                matchingSource = "Google Scholar External Index #9482";
            }
            else if (abstractText.Contains("plagiarism-test-medium"))
            {
                maxScore = 0.45;
                matchingSource = "Google Scholar External Index #1042";
            }
        }

        return new PlagiarismReportDto
        {
            DuplicationPercentage = Math.Round(maxScore * 100, 2),
            MatchingSource = matchingSource,
            IsPassed = (maxScore * 100) <= 50
        };
    }
}
