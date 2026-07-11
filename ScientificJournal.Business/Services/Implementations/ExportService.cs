using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Export;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.Business.Services.Implementations;

public class ExportService : IExportService
{
    private readonly AppDbContext _context;

    public ExportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportTrendReportAsync(ExportRequestDto request)
    {
        var data = await _context.TrendingMetrics
            .Include(m => m.Keyword)
            .Where(m => m.Keyword != null &&
                        (m.Keyword.Term.Contains(request.Keyword) || m.Keyword.NormalizedTerm.Contains(request.Keyword)) &&
                        m.Year >= request.FromYear &&
                        m.Year <= request.ToYear)
            .OrderBy(m => m.Year)
            .ToListAsync();

        var sb = new StringBuilder();
        // Add UTF-8 BOM to support Excel opening Vietnamese characters properly
        sb.Append('\uFEFF');
        sb.AppendLine("Keyword,Year,Publication Count,Trending Score");

        foreach (var item in data)
        {
            sb.AppendLine($"\"{item.Keyword!.Term}\",{item.Year},{item.PublicationCount},{item.TrendingScore}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}

