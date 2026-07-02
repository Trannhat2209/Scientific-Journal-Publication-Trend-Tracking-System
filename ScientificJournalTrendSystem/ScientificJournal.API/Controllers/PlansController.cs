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

        var policy = new PlanPolicySettings
        {
            MonthlyPriceUsd = Math.Max(0, request.MonthlyPriceUsd),
            YearlyPriceUsd = Math.Max(0, request.YearlyPriceUsd),
            MonthlyAmountVnd = Math.Max(0, request.MonthlyAmountVnd),
            YearlyAmountVnd = Math.Max(0, request.YearlyAmountVnd),
            FreeAccuracy = NormalizeAccuracy(request.FreeAccuracy, PlanPolicy.FreeAccuracy),
            ProAccuracy = NormalizeAccuracy(request.ProAccuracy, PlanPolicy.ProAccuracy)
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
        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = "PlanPolicy",
            Status = SyncStatus.Completed,
            ErrorMessage = JsonSerializer.Serialize(policy),
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow
        });

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

    private static Dictionary<string, int> NormalizeAccuracy(IReadOnlyDictionary<string, int>? values, IReadOnlyDictionary<UserRole, int> defaults) => new(StringComparer.OrdinalIgnoreCase)
    {
        ["Student"] = values?.TryGetValue("Student", out var student) == true ? student : defaults[UserRole.Student],
        ["Lecturer"] = values?.TryGetValue("Lecturer", out var lecturer) == true ? lecturer : defaults[UserRole.Lecturer],
        ["Researcher"] = values?.TryGetValue("Researcher", out var researcher) == true ? researcher : defaults[UserRole.Researcher]
    };

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
