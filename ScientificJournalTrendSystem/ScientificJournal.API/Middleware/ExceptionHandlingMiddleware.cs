using System.Net;
using System.Text.Json;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access.");
            await LogSystemExceptionAsync(context, dbContext, ex, HttpStatusCode.Unauthorized);
            await WriteErrorAsync(context, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found.");
            await LogSystemExceptionAsync(context, dbContext, ex, HttpStatusCode.NotFound);
            await WriteErrorAsync(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Bad request.");
            await LogSystemExceptionAsync(context, dbContext, ex, HttpStatusCode.BadRequest);
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception.");
            await LogSystemExceptionAsync(context, dbContext, ex, HttpStatusCode.InternalServerError);
            await WriteErrorAsync(context, HttpStatusCode.InternalServerError, "An unexpected error occurred.");
        }
    }

    private async Task LogSystemExceptionAsync(
        HttpContext context,
        AppDbContext dbContext,
        Exception exception,
        HttpStatusCode statusCode)
    {
        try
        {
            var module = ResolveModule(context.Request.Path.Value);
            var code = $"HTTP-{(int)statusCode}";
            dbContext.SyncLogs.Add(new SyncLog
            {
                SourceApi = $"Admin Audit: {module}",
                Status = statusCode == HttpStatusCode.InternalServerError
                    ? SyncStatus.Failed
                    : SyncStatus.Completed,
                RecordsSynced = null,
                ErrorMessage = $"{code}: {context.Request.Method} {context.Request.Path} - {exception.Message}",
                StartedAt = DateTime.UtcNow,
                FinishedAt = DateTime.UtcNow
            });
            await dbContext.SaveChangesAsync();
        }
        catch (Exception logException)
        {
            _logger.LogError(logException, "Failed to persist exception in system logs.");
        }
    }

    private static string ResolveModule(string? path)
    {
        var value = (path ?? string.Empty).ToLowerInvariant();
        if (value.Contains("auth") || value.Contains("users"))
        {
            return "User Management";
        }
        if (value.Contains("sync") || value.Contains("semantic-scholar") || value.Contains("openalex"))
        {
            return "Sync Management";
        }
        if (value.Contains("publication") || value.Contains("search") || value.Contains("similarity"))
        {
            return "Publication Management";
        }
        if (value.Contains("notification"))
        {
            return "Notification Management";
        }
        return "System";
    }

    private static async Task WriteErrorAsync(HttpContext context, HttpStatusCode code, string message)
    {
        context.Response.StatusCode = (int)code;
        context.Response.ContentType = "application/json";

        var body = JsonSerializer.Serialize(new
        {
            statusCode = (int)code,
            message,
            timestamp = DateTime.UtcNow
        });

        await context.Response.WriteAsync(body);
    }
}
