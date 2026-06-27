using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Publication;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/publications")]
public class PublicationsController : ControllerBase
{
    private readonly IPublicationService _publicationService;

    public PublicationsController(IPublicationService publicationService)
    {
        _publicationService = publicationService;
    }

    [HttpGet]
    [HttpGet("search")]
    [HttpGet("filter")]
    public async Task<IActionResult> Search([FromQuery] PublicationSearchRequestDto request)
    {
        var result = await _publicationService.SearchPublicationsAsync(request);
        return Ok(result);
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        var result = await _publicationService.GetPublicationsStatisticsAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await _publicationService.GetPublicationDetailAsync(id);
        return Ok(result);
    }

}
