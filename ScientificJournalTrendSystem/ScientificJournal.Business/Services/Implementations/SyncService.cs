using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.Business.Services.Implementations;

public class SyncService : ISyncService
{
    private readonly ILogger<SyncService> _logger;

    public SyncService(ILogger<SyncService> logger)
    {
        _logger = logger;
    }

    public Task SyncFromSemanticScholarAsync()
    {
        // Semantic Scholar API logic (fetches, parses, and saves to database)
        return Task.CompletedTask;
    }

    public Task SyncFromOpenAlexAsync()
    {
        // OpenAlex: Compare and log only. DO NOT insert publications to relational database
        _logger.LogInformation("OpenAlex comparison-only sync triggered. Fetching metadata for comparison... (Relational database insertion skipped)");
        return Task.CompletedTask;
    }
}
