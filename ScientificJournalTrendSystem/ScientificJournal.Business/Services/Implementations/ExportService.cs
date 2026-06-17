using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Export;

namespace ScientificJournal.Business.Services.Implementations;

public class ExportService : IExportService
{
    public Task<byte[]> ExportTrendReportAsync(ExportRequestDto request)
    {
        return Task.FromResult(System.Array.Empty<byte>());
    }
}
