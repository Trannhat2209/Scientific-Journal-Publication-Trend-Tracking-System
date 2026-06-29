using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/admin")]
[AuthorizeRoles("Admin")]
public class AdminController : ControllerBase
{
	private readonly ISyncService _syncService;
	private readonly ITrendingService _trendingService;

	public AdminController(ISyncService syncService, ITrendingService trendingService)
	{
		_syncService = syncService;
		_trendingService = trendingService;
	}

	[HttpPost("sync/semantic-scholar")]
	public async Task<IActionResult> SyncSemanticScholar()
	{
		await _syncService.SyncFromSemanticScholarAsync();
		return Ok(new { message = "Semantic Scholar sync started." });
	}

	[HttpPost("sync/openalex")]
	public async Task<IActionResult> SyncOpenAlex()
	{
		await _syncService.SyncFromOpenAlexAsync();
		return Ok(new { message = "OpenAlex sync started." });
	}

	[HttpPost("recalculate-trends")]
	public async Task<IActionResult> RecalculateTrends()
	{
		await _trendingService.RecalculateTrendingMetricsAsync();
		return Ok(new { message = "Trending metrics recalculated successfully." });
	}
}
