using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Trend;
using ScientificJournal.Common.DTOs.Response.Trend;

namespace ScientificJournal.Business.Services.Implementations;

public class TrendingService : ITrendingService
{
    public Task<IEnumerable<TrendingMetricDto>> GetTrendingScoreAsync(TrendQueryRequestDto request)
    {
        return Task.FromResult<IEnumerable<TrendingMetricDto>>(new List<TrendingMetricDto>());
    }

    public Task<IEnumerable<TopKeywordDto>> GetTopKeywordsAsync(int count)
    {
        return Task.FromResult<IEnumerable<TopKeywordDto>>(new List<TopKeywordDto>());
    }
}
