using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.Business.Jobs;

public class SemanticScholarSyncJob
{
    private readonly ISyncService _syncService;

    public SemanticScholarSyncJob(ISyncService syncService)
    {
        _syncService = syncService;
    }

    public async Task ExecuteAsync()
    {
        await _syncService.SyncFromSemanticScholarAsync();
    }
}
