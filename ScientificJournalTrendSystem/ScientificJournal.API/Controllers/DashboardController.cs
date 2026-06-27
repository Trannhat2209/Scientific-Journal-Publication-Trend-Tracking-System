using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Export;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly IExportService _exportService;
    private readonly ITrendingService _trendingService;

    public DashboardController(IDashboardService dashboardService, IExportService exportService, ITrendingService trendingService)
    {
        _dashboardService = dashboardService;
        _exportService = exportService;
        _trendingService = trendingService;
    }

    [HttpGet("stats")]
    [HttpGet("overview")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _dashboardService.GetStatsAsync();
        return Ok(result);
    }

    [HttpGet("growth")]
    public async Task<IActionResult> GetGrowth()
    {
        var result = await _dashboardService.GetGrowthDataAsync();
        return Ok(result);
    }

    [HttpGet("top-keywords")]
    public async Task<IActionResult> GetTopKeywords([FromQuery] int limit = 10)
    {
        var result = await _trendingService.GetTopKeywordsAsync(limit);
        return Ok(result);
    }

    [HttpGet("top-journals")]
    public async Task<IActionResult> GetTopJournals([FromQuery] int limit = 10)
    {
        var result = await _dashboardService.GetTopJournalsAsync(limit);
        return Ok(result);
    }

    [HttpGet("top-authors")]
    public async Task<IActionResult> GetTopAuthors([FromQuery] int limit = 10)
    {
        var result = await _dashboardService.GetTopAuthorsAsync(limit);
        return Ok(result);
    }


    [HttpPost("export")]
    public async Task<IActionResult> Export([FromBody] ExportRequestDto request)
    {
        var bytes = await _exportService.ExportTrendReportAsync(request);
        return File(bytes, "text/csv", $"trend-report-{request.Keyword}.csv");
    }
}

