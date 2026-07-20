using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public interface ISyncService
{
    Task<int> SyncFromSemanticScholarAsync(string? query = null, int maxResults = 20);
    Task<int> SyncFromOpenAlexAsync(string? query = null, int maxResults = 20);
    Task<int> SyncFromGoogleScholarAsync(string? query = null, int maxResults = 10);
    Task<int> SyncFromResearchGateAsync(string? query = null, int maxResults = 10);
}
