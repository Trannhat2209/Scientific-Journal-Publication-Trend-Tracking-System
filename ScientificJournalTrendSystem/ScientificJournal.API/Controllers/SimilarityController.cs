using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/publications")]
[Authorize]
[VerifiedAcademicUser]
public class SimilarityController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;
    private readonly ISimilarityService _similarityService;
    private readonly AppDbContext _context;

    public SimilarityController(
        IRecommendationService recommendationService,
        ISimilarityService similarityService,
        AppDbContext context)
    {
        _recommendationService = recommendationService;
        _similarityService = similarityService;
        _context = context;
    }

    [HttpGet("{id:int}/similar")]
    public async Task<IActionResult> GetSimilar(int id, [FromQuery] int topN = 10)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var dbUser = await _context.Users.FindAsync(userId);
        if (dbUser == null) return Unauthorized();

        var related = await _recommendationService.GetRelatedPublicationsAsync(id, topN);
        var resultList = new List<object>();

        foreach (var r in related)
        {
            var capped = await _similarityService.GetSimilarityResultAsync(id, r.PublicationId);
            resultList.Add(new
            {
                r.PublicationId,
                r.Title,
                r.IsDuplicateRisk,
                capped.OriginalScore,
                capped.DisplayScore,
                capped.LimitApplied,
                capped.IsCapped,
                capped.Message
            });
        }

        return Ok(resultList);
    }
}
