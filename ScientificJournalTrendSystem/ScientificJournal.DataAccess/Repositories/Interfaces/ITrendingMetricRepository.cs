using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces;

public interface ITrendingMetricRepository : IGenericRepository<TrendingMetric>
{
    Task<IEnumerable<TrendingMetric>> GetTrendsByKeywordAsync(Guid keywordId, int fromYear, int toYear);
}
