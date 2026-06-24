using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/publications")]
[Authorize]
public class SimilarityController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;

    public SimilarityController(IRecommendationService recommendationService)
    {
        _recommendationService = recommendationService;
    }

    [HttpGet("{id:guid}/similar")]
    public async Task<IActionResult> GetSimilar(Guid id, [FromQuery] int topN = 10)
    {
        var result = await _recommendationService.GetRelatedPublicationsAsync(id, topN);
        return Ok(result);
    }
}