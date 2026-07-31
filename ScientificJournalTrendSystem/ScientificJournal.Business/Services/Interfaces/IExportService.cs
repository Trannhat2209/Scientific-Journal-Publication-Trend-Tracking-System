using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Request.Export;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IExportService
{
    Task<byte[]> ExportTrendReportAsync(ExportRequestDto request);
}
