using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
	private readonly IDashboardService _dashboardService;

	public DashboardController(IDashboardService dashboardService)
	{
		_dashboardService = dashboardService;
	}

	[HttpGet("stats")]
	public async Task<IActionResult> GetStats()
	{
		var result = await _dashboardService.GetStatsAsync();
		return Ok(result);
	}
}
