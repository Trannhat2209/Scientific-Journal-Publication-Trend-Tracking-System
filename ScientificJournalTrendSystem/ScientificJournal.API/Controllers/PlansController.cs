using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Policies;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/plans")]
public class PlansController : ControllerBase
{
    [HttpGet("policy")]
    public IActionResult GetPolicy()
    {
        return Ok(new
        {
            monthlyPrice = PlanPolicy.MonthlyPriceUsd,
            yearlyPrice = PlanPolicy.YearlyPriceUsd,
            monthlyAmountVnd = PlanPolicy.MonthlyAmountVnd,
            yearlyAmountVnd = PlanPolicy.YearlyAmountVnd,
            freeAccuracy = ToPolicyObject(PlanPolicy.FreeAccuracy),
            proAccuracy = ToPolicyObject(PlanPolicy.ProAccuracy)
        });
    }

    private static object ToPolicyObject(IReadOnlyDictionary<UserRole, int> values) => new
    {
        Student = values[UserRole.Student],
        Lecturer = values[UserRole.Lecturer],
        Researcher = values[UserRole.Researcher]
    };
}
