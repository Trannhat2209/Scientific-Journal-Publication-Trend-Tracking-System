using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.API.Filters;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Policies;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/plans")]
public class PlansController : ControllerBase
{
    private readonly AppDbContext _context;

    public PlansController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("policy")]
    public async Task<IActionResult> GetPolicy()
    {
        var policy = await LoadPolicyAsync();
        return Ok(new
        {
            monthlyPrice = policy.MonthlyPriceUsd,
            yearlyPrice = policy.YearlyPriceUsd,
            monthlyAmountVnd = policy.MonthlyAmountVnd,
            yearlyAmountVnd = policy.YearlyAmountVnd,
            freeAccuracy = ToPolicyObject(policy.FreeAccuracy),
            proAccuracy = ToPolicyObject(policy.ProAccuracy)
        });
    }

    [HttpPut("policy")]
    [AuthorizeRoles("Admin")]
    public async Task<IActionResult> UpdatePolicy([FromBody] PlanPolicyUpdateRequest request)
    {
        if (request is null)
        {
            return BadRequest(new { message = "Request body is required." });
        }

        var freeAccuracy = NormalizeAccuracy(request.FreeAccuracy, PlanPolicy.FreeAccuracy);
        var proAccuracy = NormalizeAccuracy(request.ProAccuracy, PlanPolicy.ProAccuracy);

        foreach (var value in freeAccuracy.Values.Concat(proAccuracy.Values))
        {
            if (value < 0 || value > 100)
            {
                return BadRequest(new { message = "Search accuracy values must be between 0 and 100." });
            }
        }

        var policy = new PlanPolicySettings
        {
            MonthlyPriceUsd = Math.Max(0, request.MonthlyPriceUsd),
            YearlyPriceUsd = Math.Max(0, request.YearlyPriceUsd),
            MonthlyAmountVnd = Math.Max(0, request.MonthlyAmountVnd),
            YearlyAmountVnd = Math.Max(0, request.YearlyAmountVnd),
            FreeAccuracy = freeAccuracy,
            ProAccuracy = proAccuracy
        };

        await SavePolicyAsync(policy);

        return Ok(new
        {
            message = "Plan policy updated.",
            monthlyPrice = policy.MonthlyPriceUsd,
            yearlyPrice = policy.YearlyPriceUsd,
            monthlyAmountVnd = policy.MonthlyAmountVnd,
            yearlyAmountVnd = policy.YearlyAmountVnd,
            freeAccuracy = ToPolicyObject(policy.FreeAccuracy),
            proAccuracy = ToPolicyObject(policy.ProAccuracy)
        });
    }

    private async Task<PlanPolicySettings> LoadPolicyAsync()
    {
        var latestPolicy = await _context.SyncLogs
            .Where(s => s.SourceApi == "PlanPolicy")
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

        if (latestPolicy?.ErrorMessage is not null)
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<PlanPolicySettings>(latestPolicy.ErrorMessage);
                if (parsed is not null)
                {
                    return parsed;
                }
            }
            catch
            {
                // Ignore malformed policy payloads and fall back to defaults.
            }
        }

        return CreateDefaultPolicy();
    }

    private async Task SavePolicyAsync(PlanPolicySettings policy)
    {
        // Keep this as a single row: update the existing "PlanPolicy" record if one exists,
        // instead of inserting a new sync_logs row on every save.
        var existing = await _context.SyncLogs.FirstOrDefaultAsync(s => s.SourceApi == "PlanPolicy");

        if (existing != null)
        {
            existing.ErrorMessage = JsonSerializer.Serialize(policy);
            existing.Status = SyncStatus.Completed;
            existing.FinishedAt = DateTime.UtcNow;
        }
        else
        {
            _context.SyncLogs.Add(new SyncLog
            {
                SourceApi = "PlanPolicy",
                Status = SyncStatus.Completed,
                ErrorMessage = JsonSerializer.Serialize(policy),
                StartedAt = DateTime.UtcNow,
                FinishedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
    }

    private static PlanPolicySettings CreateDefaultPolicy() => new()
    {
        MonthlyPriceUsd = PlanPolicy.MonthlyPriceUsd,
        YearlyPriceUsd = PlanPolicy.YearlyPriceUsd,
        MonthlyAmountVnd = PlanPolicy.MonthlyAmountVnd,
        YearlyAmountVnd = PlanPolicy.YearlyAmountVnd,
        FreeAccuracy = NormalizeAccuracy(null, PlanPolicy.FreeAccuracy),
        ProAccuracy = NormalizeAccuracy(null, PlanPolicy.ProAccuracy)
    };

    private static Dictionary<string, int> NormalizeAccuracy(IReadOnlyDictionary<string, int>? values, IReadOnlyDictionary<UserRole, int> defaults)
    {
        // Rebuild the incoming dictionary with a case-insensitive comparer first, so a client
        // sending "student"/"Student"/"STUDENT" all match correctly instead of silently
        // falling back to the default value.
        var incoming = values is null
            ? new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            : new Dictionary<string, int>(values, StringComparer.OrdinalIgnoreCase);

        return new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["Student"] = incoming.TryGetValue("Student", out var student) ? student : defaults[UserRole.Student],
            ["Lecturer"] = incoming.TryGetValue("Lecturer", out var lecturer) ? lecturer : defaults[UserRole.Lecturer],
            ["Researcher"] = incoming.TryGetValue("Researcher", out var researcher) ? researcher : defaults[UserRole.Researcher]
        };
    }

    private static object ToPolicyObject(IReadOnlyDictionary<string, int> values) => new
    {
        Student = values.GetValueOrDefault("Student"),
        Lecturer = values.GetValueOrDefault("Lecturer"),
        Researcher = values.GetValueOrDefault("Researcher")
    };
}

public class PlanPolicyUpdateRequest
{
    public int MonthlyPriceUsd { get; set; }
    public int YearlyPriceUsd { get; set; }
    public int MonthlyAmountVnd { get; set; }
    public int YearlyAmountVnd { get; set; }
    public Dictionary<string, int>? FreeAccuracy { get; set; }
    public Dictionary<string, int>? ProAccuracy { get; set; }
}

public class PlanPolicySettings
{
    public int MonthlyPriceUsd { get; set; }
    public int YearlyPriceUsd { get; set; }
    public int MonthlyAmountVnd { get; set; }
    public int YearlyAmountVnd { get; set; }
    public Dictionary<string, int> FreeAccuracy { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, int> ProAccuracy { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
