using Microsoft.AspNetCore.Mvc;
using ScientificJournal.API.Filters;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Policies;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/plans")]
public class PlansController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public PlansController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet("policy")]
    public IActionResult GetPolicy()
    {
        var policy = PlanPolicy.GetSnapshot();
        return Ok(new
        {
            monthlyPrice = policy.MonthlyPrice,
            yearlyPrice = policy.YearlyPrice,
            monthlyAmountVnd = policy.MonthlyAmountVnd,
            yearlyAmountVnd = policy.YearlyAmountVnd,
            yearlySavingsPercent = policy.YearlySavingsPercent,
            checkoutHoldMinutes = policy.CheckoutHoldMinutes,
            freeAccuracy = ToPolicyObject(PlanPolicy.FreeAccuracy),
            proAccuracy = ToPolicyObject(PlanPolicy.ProAccuracy)
        });
    }

    [HttpPut("policy")]
    [AuthorizeRoles("Admin")]
    public IActionResult UpdatePolicy([FromBody] PlanPolicySnapshot request)
    {
        var policy = PlanPolicy.Update(request);
        PlanPolicy.SaveToFile(GetPolicyFilePath());

        return Ok(new
        {
            monthlyPrice = policy.MonthlyPrice,
            yearlyPrice = policy.YearlyPrice,
            monthlyAmountVnd = policy.MonthlyAmountVnd,
            yearlyAmountVnd = policy.YearlyAmountVnd,
            yearlySavingsPercent = policy.YearlySavingsPercent,
            checkoutHoldMinutes = policy.CheckoutHoldMinutes,
            freeAccuracy = ToPolicyObject(PlanPolicy.FreeAccuracy),
            proAccuracy = ToPolicyObject(PlanPolicy.ProAccuracy),
            saved = true
        });
    }

    [HttpPost("policy/reset")]
    [AuthorizeRoles("Admin")]
    public IActionResult ResetPolicy()
    {
        var policy = PlanPolicy.ResetDefaults();
        PlanPolicy.SaveToFile(GetPolicyFilePath());

        return Ok(new
        {
            monthlyPrice = policy.MonthlyPrice,
            yearlyPrice = policy.YearlyPrice,
            monthlyAmountVnd = policy.MonthlyAmountVnd,
            yearlyAmountVnd = policy.YearlyAmountVnd,
            yearlySavingsPercent = policy.YearlySavingsPercent,
            checkoutHoldMinutes = policy.CheckoutHoldMinutes,
            freeAccuracy = ToPolicyObject(PlanPolicy.FreeAccuracy),
            proAccuracy = ToPolicyObject(PlanPolicy.ProAccuracy),
            saved = true
        });
    }

    private static Dictionary<string, int> ToPolicyObject(IReadOnlyDictionary<UserRole, int> values) => new()
    {
        ["Student"] = values[UserRole.Student],
        ["Lecturer"] = values[UserRole.Lecturer],
        ["Researcher"] = values[UserRole.Researcher]
    };

    private string GetPolicyFilePath() =>
        Path.Combine(_environment.ContentRootPath, "App_Data", "plan-policy.json");
}
