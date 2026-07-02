using System.Collections.Generic;
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

    public async Task<IEnumerable<object>> GetGrowthDataAsync()
    {
        var data = await _context.Publications
            .Where(p => !p.IsDeleted)
            .GroupBy(p => p.Year)
            .Select(g => new
            {
                Year = g.Key,
                Count = g.Count()
            })
            .OrderBy(x => x.Year)
            .ToListAsync();

        return data.Select(x => (object)x).ToList();
    }

    public async Task<IEnumerable<object>> GetTopJournalsAsync(int limit)
    {
        var data = await _context.Publications
            .Where(p => !p.IsDeleted && p.Journal != null)
            .GroupBy(p => new { p.JournalId, p.Journal!.Name })
            .Select(g => new
            {
                JournalId = g.Key.JournalId,
                JournalName = g.Key.Name,
                PublicationCount = g.Count(),
                CitationCount = g.Sum(x => x.CitationCount)
            })
            .OrderByDescending(x => x.PublicationCount)
            .Take(limit)
            .ToListAsync();

        return data.Select(x => (object)x).ToList();
    }

    public async Task<IEnumerable<object>> GetTopAuthorsAsync(int limit)
    {
        var data = await _context.PublicationAuthors
            .Include(pa => pa.Author)
            .Where(pa => pa.Author != null)
            .GroupBy(pa => new { pa.AuthorId, pa.Author!.Name })
            .Select(g => new
            {
                AuthorId = g.Key.AuthorId,
                AuthorName = g.Key.Name,
                PublicationCount = g.Count()
            })
            .OrderByDescending(x => x.PublicationCount)
            .Take(limit)
            .ToListAsync();

        return data.Select(x => (object)x).ToList();
    }
}


