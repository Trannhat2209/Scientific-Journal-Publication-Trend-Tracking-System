using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
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
    private const string PolicySourceKey = "PlanPolicy";
    private readonly AppDbContext _context;

    public PlansController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("policy")]
    public async Task<IActionResult> GetPolicy()
    {
        return Ok(await ReadPolicyAsync());
    }

    [AuthorizeRoles("Admin")]
    [HttpPut("policy")]
    public async Task<IActionResult> UpdatePolicy([FromBody] PlanPolicyUpdateRequest request)
    {
        if (request == null)
        {
            return BadRequest(new { message = "Policy payload is required." });
        }

        var payload = new
        {
            monthlyPrice = request.MonthlyPriceUsd ?? PlanPolicy.MonthlyPriceUsd,
            yearlyPrice = request.YearlyPriceUsd ?? PlanPolicy.YearlyPriceUsd,
            monthlyAmountVnd = request.MonthlyAmountVnd ?? PlanPolicy.MonthlyAmountVnd,
            yearlyAmountVnd = request.YearlyAmountVnd ?? PlanPolicy.YearlyAmountVnd,
            freeAccuracy = ToPolicyObject(
                request.FreeAccuracy?.Student ?? PlanPolicy.FreeAccuracy[UserRole.Student],
                request.FreeAccuracy?.Lecturer ?? PlanPolicy.FreeAccuracy[UserRole.Lecturer],
                request.FreeAccuracy?.Researcher ?? PlanPolicy.FreeAccuracy[UserRole.Researcher]),
            proAccuracy = ToPolicyObject(
                request.ProAccuracy?.Student ?? PlanPolicy.ProAccuracy[UserRole.Student],
                request.ProAccuracy?.Lecturer ?? PlanPolicy.ProAccuracy[UserRole.Lecturer],
                request.ProAccuracy?.Researcher ?? PlanPolicy.ProAccuracy[UserRole.Researcher])
        };

        var json = JsonSerializer.Serialize(payload);
        var latest = await _context.SyncLogs
            .Where(s => s.SourceApi == PolicySourceKey)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

        if (latest == null)
        {
            _context.SyncLogs.Add(new SyncLog
            {
                SourceApi = PolicySourceKey,
                Status = SyncStatus.Completed,
                ErrorMessage = json,
                StartedAt = DateTime.UtcNow,
                FinishedAt = DateTime.UtcNow
            });
        }
        else
        {
            latest.Status = SyncStatus.Completed;
            latest.ErrorMessage = json;
            latest.FinishedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(payload);
    }

    private async Task<object> ReadPolicyAsync()
    {
        var latest = await _context.SyncLogs
            .Where(s => s.SourceApi == PolicySourceKey)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

        if (latest?.ErrorMessage != null)
        {
            try
            {
                using var document = JsonDocument.Parse(latest.ErrorMessage);
                var root = document.RootElement;
                return new
                {
                    monthlyPrice = root.TryGetProperty("monthlyPrice", out var monthlyPrice) ? monthlyPrice.GetDecimal() : PlanPolicy.MonthlyPriceUsd,
                    yearlyPrice = root.TryGetProperty("yearlyPrice", out var yearlyPrice) ? yearlyPrice.GetDecimal() : PlanPolicy.YearlyPriceUsd,
                    monthlyAmountVnd = root.TryGetProperty("monthlyAmountVnd", out var monthlyAmountVnd) ? monthlyAmountVnd.GetInt32() : PlanPolicy.MonthlyAmountVnd,
                    yearlyAmountVnd = root.TryGetProperty("yearlyAmountVnd", out var yearlyAmountVnd) ? yearlyAmountVnd.GetInt32() : PlanPolicy.YearlyAmountVnd,
                    freeAccuracy = ReadAccuracy(root, "freeAccuracy"),
                    proAccuracy = ReadAccuracy(root, "proAccuracy")
                };
            }
            catch
            {
                // Keep the default values if the stored policy payload is invalid.
            }
        }

        return DefaultPolicy();
    }

    private static object DefaultPolicy() => new
    {
        monthlyPrice = PlanPolicy.MonthlyPriceUsd,
        yearlyPrice = PlanPolicy.YearlyPriceUsd,
        monthlyAmountVnd = PlanPolicy.MonthlyAmountVnd,
        yearlyAmountVnd = PlanPolicy.YearlyAmountVnd,
        freeAccuracy = ToPolicyObject(PlanPolicy.FreeAccuracy),
        proAccuracy = ToPolicyObject(PlanPolicy.ProAccuracy)
    };

    private static object ReadAccuracy(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var section))
        {
            return ToPolicyObject(PlanPolicy.FreeAccuracy);
        }

        return new
        {
            Student = section.TryGetProperty("Student", out var student) ? student.GetInt32() : PlanPolicy.FreeAccuracy[UserRole.Student],
            Lecturer = section.TryGetProperty("Lecturer", out var lecturer) ? lecturer.GetInt32() : PlanPolicy.FreeAccuracy[UserRole.Lecturer],
            Researcher = section.TryGetProperty("Researcher", out var researcher) ? researcher.GetInt32() : PlanPolicy.FreeAccuracy[UserRole.Researcher]
        };
    }

    private static object ToPolicyObject(IReadOnlyDictionary<UserRole, int> values) => new
    {
        Student = values[UserRole.Student],
        Lecturer = values[UserRole.Lecturer],
        Researcher = values[UserRole.Researcher]
    };

    private static object ToPolicyObject(int student, int lecturer, int researcher) => new
    {
        Student = student,
        Lecturer = lecturer,
        Researcher = researcher
    };
}

public class PlanPolicyUpdateRequest
{
    public decimal? MonthlyPriceUsd { get; set; }
    public decimal? YearlyPriceUsd { get; set; }
    public int? MonthlyAmountVnd { get; set; }
    public int? YearlyAmountVnd { get; set; }
    public PlanAccuracyPolicyRequest? FreeAccuracy { get; set; }
    public PlanAccuracyPolicyRequest? ProAccuracy { get; set; }
}

public class PlanAccuracyPolicyRequest
{
    public int? Student { get; set; }
    public int? Lecturer { get; set; }
    public int? Researcher { get; set; }
}
