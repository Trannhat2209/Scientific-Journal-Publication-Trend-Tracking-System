using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.Business.Jobs;

public class GoogleScholarSyncJob
{
    private readonly ISyncService _syncService;

    public GoogleScholarSyncJob(ISyncService syncService)
    {
        _syncService = syncService;
    }

    public async Task ExecuteAsync()
    {
        await _syncService.SyncFromGoogleScholarAsync();
    }
}
