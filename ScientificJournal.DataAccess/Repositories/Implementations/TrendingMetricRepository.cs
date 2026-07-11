using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations;

public class TrendingMetricRepository : GenericRepository<TrendingMetric>, ITrendingMetricRepository
{
    public TrendingMetricRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<TrendingMetric>> GetTrendsByKeywordAsync(int keywordId, int fromYear, int toYear) =>
        await _context.TrendingMetrics
            .Where(tm => tm.KeywordId == keywordId && tm.Year >= fromYear && tm.Year <= toYear)
            .OrderBy(tm => tm.Year)
            .ToListAsync();
}
