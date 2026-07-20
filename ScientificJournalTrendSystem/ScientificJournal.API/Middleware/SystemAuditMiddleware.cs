using System.Diagnostics;
using System.Security.Claims;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.API.Services;

namespace ScientificJournal.API.Middleware;

public class SystemAuditMiddleware
{
    private readonly RequestDelegate _next;

    public SystemAuditMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext httpContext, AppDbContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        Exception? failure = null;
        try
        {
            await _next(httpContext);
        }
        catch (Exception exception)
        {
            failure = exception;
            throw;
        }
        finally
        {
            stopwatch.Stop();
            if (httpContext.Request.Path.StartsWithSegments("/api"))
            {
                var status = failure == null ? httpContext.Response.StatusCode : 500;
                var userIdValue = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? httpContext.User.FindFirstValue("sub");
                _ = int.TryParse(userIdValue, out var userId);
                var category = httpContext.Request.Path.StartsWithSegments("/api/payments") ? "PayOS" :
                    httpContext.Request.Path.StartsWithSegments("/api/auth") ? "Authentication" : "API";
                context.SystemEventLogs.Add(new SystemEventLog
                {
                    Category = category,
                    Level = failure != null || status >= 500 ? "Error" : status is 401 or 403 ? "Warning" : "Info",
                    EventCode = status is 401 or 403 ? "ACCESS-DENIED" : failure != null ? "API-EXCEPTION" : "API-REQUEST",
                    Message = SensitiveDataMasker.Mask(failure?.Message) ?? $"{httpContext.Request.Method} {httpContext.Request.Path} returned {status} in {stopwatch.ElapsedMilliseconds}ms.",
                    Method = httpContext.Request.Method,
                    Path = httpContext.Request.Path.Value,
                    StatusCode = status,
                    UserId = userId == 0 ? null : userId,
                    Actor = httpContext.User.FindFirstValue(ClaimTypes.Email) ?? (httpContext.User.Identity?.IsAuthenticated == true ? "authenticated-user" : "anonymous"),
                    IpAddress = httpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = httpContext.Request.Headers.UserAgent.ToString(),
                    CorrelationId = httpContext.TraceIdentifier,
                    MetadataJson = $"{{\"durationMs\":{stopwatch.ElapsedMilliseconds}}}"
                });
                try { await context.SaveChangesAsync(); } catch { /* logging must not break the request */ }
            }
        }
    }
}
