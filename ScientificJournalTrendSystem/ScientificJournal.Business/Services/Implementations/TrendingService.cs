using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Trend;
using ScientificJournal.Common.DTOs.Response.Trend;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.Business.Services.Implementations;

public class TrendingService : ITrendingService
{
    private readonly AppDbContext _context;

    public TrendingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TrendingMetricDto>> GetTrendingScoreAsync(TrendQueryRequestDto request)
    {
        var query = _context.TrendingMetrics
            .Include(m => m.Keyword)
            .Where(m => m.Keyword != null)
            .AsQueryable();

        if (request.FromYear > 0)
        {
            query = query.Where(m => m.Year >= request.FromYear);
        }

        if (request.ToYear > 0)
        {
            query = query.Where(m => m.Year <= request.ToYear);
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            query = query.Where(m => m.Keyword.Term.Contains(request.Keyword) || m.Keyword.NormalizedTerm.Contains(request.Keyword));
        }

        return await query
            .OrderByDescending(m => m.TrendingScore)
            .ThenByDescending(m => m.PublicationCount)
            .Select(m => new TrendingMetricDto
            {
                Keyword = m.Keyword!.Term,
                Year = m.Year,
                PublicationCount = m.PublicationCount,
                TrendingScore = m.TrendingScore
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<TopKeywordDto>> GetTopKeywordsAsync(int count)
    {
        return await _context.TrendingMetrics
            .Include(m => m.Keyword)
            .Where(m => m.Keyword != null)
            .GroupBy(m => new { m.KeywordId, m.Keyword.Term })
            .Select(g => new TopKeywordDto
            {
                Keyword = g.Key.Term,
                TotalCount = g.Sum(x => x.PublicationCount),
                TrendingScore = g.Average(x => x.TrendingScore)
            })
            .OrderByDescending(x => x.TrendingScore)
            .ThenByDescending(x => x.TotalCount)
            .Take(count)
            .ToListAsync();
    }

    public Task RecalculateTrendingMetricsAsync()
    {
        return Task.CompletedTask;
    }
}
