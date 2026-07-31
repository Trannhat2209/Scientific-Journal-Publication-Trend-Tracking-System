using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.Business.Jobs;

public class OpenAlexSyncJob
{
    private static readonly SemaphoreSlim ExecutionGate = new(1, 1);
    private readonly ISyncService _syncService;

    public OpenAlexSyncJob(ISyncService syncService)
    {
        _syncService = syncService;
    }

    public async Task ExecuteAsync()
    {
        if (!await ExecutionGate.WaitAsync(0)) return;
        try
        {
            await _syncService.SyncFromOpenAlexAsync();
        }
        finally
        {
            ExecutionGate.Release();
        }
    }
}
