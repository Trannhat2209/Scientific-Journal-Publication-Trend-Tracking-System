using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Trend;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/trends")]
public class TrendsController : ControllerBase
{
    private readonly ITrendingService _trendingService;

    public TrendsController(ITrendingService trendingService)
    {
        _trendingService = trendingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTrends([FromQuery] TrendQueryRequestDto request)
    {
        var result = await _trendingService.GetTrendingScoreAsync(request);
        return Ok(result);
    }

    [HttpGet("keywords")]
    public async Task<IActionResult> GetTrendingKeywords([FromQuery] int limit = 10)
    {
        var result = await _trendingService.GetTrendingKeywordsAsync(limit);
        return Ok(result);
    }

    [HttpGet("top-keywords")]
    public async Task<IActionResult> GetTopKeywords([FromQuery] int count = 10)
    {
        var result = await _trendingService.GetTopKeywordsAsync(count);
        return Ok(result);
    }

    [HttpGet("keyword/{id:int}/history")]
    public async Task<IActionResult> GetKeywordHistory(int id)
    {
        var result = await _trendingService.GetKeywordTrendHistoryAsync(id);
        return Ok(result);
    }

}
