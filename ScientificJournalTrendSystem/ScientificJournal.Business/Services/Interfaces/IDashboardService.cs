using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Response.Dashboard;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
}
