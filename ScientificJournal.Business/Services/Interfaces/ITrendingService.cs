using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Request.Trend;
using ScientificJournal.Common.DTOs.Response.Trend;

namespace ScientificJournal.Business.Services.Interfaces;

public interface ITrendingService
{
    Task<IEnumerable<TrendingMetricDto>> GetTrendingScoreAsync(TrendQueryRequestDto request);
    Task<IEnumerable<TopKeywordDto>> GetTopKeywordsAsync(int count);
    Task<IEnumerable<object>> GetKeywordTrendHistoryAsync(int keywordId);
    Task<IEnumerable<object>> GetTrendingKeywordsAsync(int limit);
    Task RecalculateTrendingMetricsAsync();
}

