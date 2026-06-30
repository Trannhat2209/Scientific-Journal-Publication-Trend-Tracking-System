using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Publication;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/publications")]
public class PublicationsController : ControllerBase
{
    private readonly IPublicationService _publicationService;
    private readonly ISerpApiScholarSimilarityService _scholarSimilarityService;

    public PublicationsController(
        IPublicationService publicationService,
        ISerpApiScholarSimilarityService scholarSimilarityService)
    {
        _publicationService = publicationService;
        _scholarSimilarityService = scholarSimilarityService;
    }

    [HttpGet]
    [HttpGet("search")]
    [HttpGet("filter")]
    public async Task<IActionResult> Search([FromQuery] PublicationSearchRequestDto request)
    {
        int? userId = null;
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (int.TryParse(userIdValue, out var parsedId))
        {
            userId = parsedId;
        }

        var result = await _publicationService.SearchPublicationsAsync(request, userId);
        return Ok(result);
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        var result = await _publicationService.GetPublicationsStatisticsAsync();
        return Ok(result);
    }

    [HttpPost("similarity-check")]
    public async Task<IActionResult> CheckSimilarity(
        [FromBody] PublicationSimilarityCheckRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _scholarSimilarityService.CheckSimilarityAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await _publicationService.GetPublicationDetailAsync(id);
        return Ok(result);
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> Upload([FromBody] UploadPublicationDto request)
    {
        var roleValue = User.FindFirstValue(ClaimTypes.Role);
        if (string.Equals(roleValue, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Admin is not allowed to upload publications.");
        }

        var result = await _publicationService.UploadPublicationAsync(request);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetDetail), new { id = result.PublicationId }, result);
    }
}
