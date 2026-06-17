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
}
