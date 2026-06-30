using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;

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

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromServices] AppDbContext context, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = context.Users.Where(u => !u.IsDeleted);
        var total = await query.CountAsync();
        var items = await query
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                Role = u.Role.ToString(),
                u.IsActive,
                u.IsPro,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(new { items, totalCount = total, page, pageSize });
    }

    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleDto request, [FromServices] AppDbContext context)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound("User not found.");

        if (!Enum.TryParse<ScientificJournal.Common.Enums.UserRole>(request.Role, true, out var newRole))
        {
            return BadRequest("Invalid role. Role must be: Student, Lecturer, Researcher, or Admin.");
        }

        user.Role = newRole;
        await context.SaveChangesAsync();
        return Ok(new { message = $"User role updated to '{newRole}'.", role = newRole.ToString() });
    }

    [HttpPut("users/{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id, [FromServices] AppDbContext context)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound("User not found.");

        user.IsActive = !user.IsActive;
        await context.SaveChangesAsync();
        return Ok(new { message = $"User status updated. IsActive: {user.IsActive}", isActive = user.IsActive });
    }

    [HttpPut("users/{id:int}/toggle-pro")]
    public async Task<IActionResult> TogglePro(int id, [FromServices] AppDbContext context)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null) return NotFound("User not found.");

        user.IsPro = !user.IsPro;
        await context.SaveChangesAsync();
        return Ok(new { message = $"User premium status updated. IsPro: {user.IsPro}", isPro = user.IsPro });
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics([FromServices] AppDbContext context)
    {
        var totalUsers = await context.Users.CountAsync(u => !u.IsDeleted);
        var totalPublications = await context.Publications.CountAsync(p => !p.IsDeleted);
        
        var successSyncs = await context.SyncLogs.CountAsync(l => l.Status == ScientificJournal.Common.Enums.SyncStatus.Completed);
        var failedSyncs = await context.SyncLogs.CountAsync(l => l.Status == ScientificJournal.Common.Enums.SyncStatus.Failed);

        var roleDistribution = await context.Users
            .Where(u => !u.IsDeleted)
            .GroupBy(u => u.Role)
            .Select(g => new
            {
                Role = g.Key.ToString(),
                Count = g.Count(),
                Percentage = totalUsers > 0 ? Math.Round((double)g.Count() / totalUsers * 100, 2) : 0.0
            })
            .ToListAsync();

        var recentActivities = await context.SyncLogs
            .OrderByDescending(l => l.StartedAt)
            .Take(5)
            .Select(l => new
            {
                l.Id,
                l.SourceApi,
                l.Status,
                l.RecordsSynced,
                l.StartedAt,
                l.ErrorMessage
            })
            .ToListAsync();

        return Ok(new
        {
            totalUsers,
            totalPublications,
            successSyncs,
            failedSyncs,
            roleDistribution,
            recentActivities,
            systemStatus = "Healthy"
        });
    }

    [HttpGet("sync-logs")]
    public async Task<IActionResult> GetSyncLogs([FromServices] AppDbContext context, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = context.SyncLogs;
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, totalCount = total, page, pageSize });
    }
}

public class ChangeRoleDto
{
    public string Role { get; set; } = string.Empty;
}
