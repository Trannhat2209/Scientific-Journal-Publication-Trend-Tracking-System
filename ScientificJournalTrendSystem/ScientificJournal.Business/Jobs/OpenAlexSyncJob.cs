using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.Business.Jobs;

public class OpenAlexSyncJob
{
    private readonly ISyncService _syncService;

    public OpenAlexSyncJob(ISyncService syncService)
    {
        _syncService = syncService;
    }

    public async Task ExecuteAsync()
    {
        await _syncService.SyncFromOpenAlexAsync();
    }
}
