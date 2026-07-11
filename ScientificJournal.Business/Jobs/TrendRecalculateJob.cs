using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.Business.Jobs;

public class TrendRecalculateJob
{
    private readonly ITrendingService _trendingService;

    public TrendRecalculateJob(ITrendingService trendingService)
    {
        _trendingService = trendingService;
    }

    public async Task ExecuteAsync()
    {
        await _trendingService.RecalculateTrendingMetricsAsync();
    }
}
