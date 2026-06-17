using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Response.Dashboard;

namespace ScientificJournal.Business.Services.Implementations;

public class DashboardService : IDashboardService
{
    public Task<DashboardStatsDto> GetStatsAsync()
    {
        return Task.FromResult(new DashboardStatsDto());
    }
}
