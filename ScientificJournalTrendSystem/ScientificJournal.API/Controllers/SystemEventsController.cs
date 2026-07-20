using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.API.Services;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/system-events")]
public class SystemEventsController : ControllerBase
{
    private readonly AppDbContext _context;
    public SystemEventsController(AppDbContext context) => _context = context;

    [AllowAnonymous]
    [HttpPost("frontend")]
    public async Task<IActionResult> RecordFrontendEvent([FromBody] FrontendEventRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message)) return BadRequest(new { message = "Message is required." });
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        _context.SystemEventLogs.Add(new SystemEventLog
        {
            Category = "Frontend",
            Level = NormalizeLevel(request.Level),
            EventCode = string.IsNullOrWhiteSpace(request.Code) ? "FRONTEND-EVENT" : request.Code.Trim()[..Math.Min(request.Code.Trim().Length, 100)],
            Message = SensitiveDataMasker.Mask(request.Message.Trim()[..Math.Min(request.Message.Trim().Length, 4000)])!,
            Path = request.Path?.Trim(),
            UserId = int.TryParse(userIdValue, out var userId) ? userId : null,
            Actor = User.FindFirstValue(ClaimTypes.Email) ?? "anonymous-browser",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers.UserAgent.ToString(),
            CorrelationId = HttpContext.TraceIdentifier,
            MetadataJson = SensitiveDataMasker.Mask(request.MetadataJson)
        });
        await _context.SaveChangesAsync();
        return Accepted(new { recorded = true });
    }

    private static string NormalizeLevel(string? level) => level?.Trim().ToLowerInvariant() switch
    {
        "error" => "Error",
        "warning" or "warn" => "Warning",
        _ => "Info"
    };
}

public class FrontendEventRequest
{
    public string? Level { get; set; }
    public string? Code { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Path { get; set; }
    public string? MetadataJson { get; set; }
}
