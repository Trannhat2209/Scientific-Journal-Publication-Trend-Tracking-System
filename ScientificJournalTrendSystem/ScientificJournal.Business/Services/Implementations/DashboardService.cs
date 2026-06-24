using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Response.Dashboard;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.Business.Services.Implementations;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        return new DashboardStatsDto
        {
            TotalPublications = await _context.Publications.CountAsync(p => !p.IsDeleted),
            TotalKeywords = await _context.Keywords.CountAsync(),
            TotalUsers = await _context.Users.CountAsync(u => !u.IsDeleted),
            RecentSyncAt = await _context.SyncLogs
                .Where(s => s.FinishedAt != null)
                .OrderByDescending(s => s.FinishedAt)
                .Select(s => s.FinishedAt)
                .FirstOrDefaultAsync()
        };
    }
}
