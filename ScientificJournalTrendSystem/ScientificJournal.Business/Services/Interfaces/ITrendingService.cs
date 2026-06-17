using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Request.Trend;
using ScientificJournal.Common.DTOs.Response.Trend;

namespace ScientificJournal.Business.Services.Interfaces;

public interface ITrendingService
{
    Task<IEnumerable<TrendingMetricDto>> GetTrendingScoreAsync(TrendQueryRequestDto request);
    Task<IEnumerable<TopKeywordDto>> GetTopKeywordsAsync(int count);
}
