using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/publications")]
public class RelationshipNetworkController : ControllerBase
{
    private readonly IRelationshipNetworkService _relationshipNetworkService;

    public RelationshipNetworkController(IRelationshipNetworkService relationshipNetworkService)
    {
        _relationshipNetworkService = relationshipNetworkService;
    }

    [HttpGet("{id:int}/network")]
    public async Task<IActionResult> GetRelationshipNetwork(int id, [FromQuery] double threshold = 0.3)
    {
        var result = await _relationshipNetworkService.GetRelationshipNetworkAsync(id, threshold);
        return Ok(result);
    }
}
