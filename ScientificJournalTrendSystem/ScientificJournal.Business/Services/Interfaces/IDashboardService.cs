using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Response.Dashboard;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
    Task<IEnumerable<object>> GetGrowthDataAsync();
    Task<IEnumerable<object>> GetTopJournalsAsync(int limit);
    Task<IEnumerable<object>> GetTopAuthorsAsync(int limit);
}


