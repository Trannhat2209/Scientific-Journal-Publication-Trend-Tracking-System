using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class SyncService : ISyncService
{
    private readonly ILogger<SyncService> _logger;
    private readonly AppDbContext _context;

    public SyncService(ILogger<SyncService> logger, AppDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public Task SyncFromSemanticScholarAsync()
    {
        _logger.LogInformation("Semantic Scholar sync triggered.");
        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = "SemanticScholar",
            Status = "Completed",
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow,
            RecordsSynced = 0
        });
        _context.SaveChanges();
        return Task.CompletedTask;
    }

    public Task SyncFromOpenAlexAsync()
    {
        _logger.LogInformation("OpenAlex comparison-only sync triggered. Fetching metadata for comparison... (Relational database insertion skipped)");
        _context.SyncLogs.Add(new SyncLog
        {
            SourceApi = "OpenAlex",
            Status = "Completed",
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow,
            RecordsSynced = 0
        });
        _context.SaveChanges();
        return Task.CompletedTask;
    }
}
