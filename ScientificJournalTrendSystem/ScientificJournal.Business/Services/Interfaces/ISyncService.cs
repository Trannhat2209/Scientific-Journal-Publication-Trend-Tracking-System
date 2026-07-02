using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public interface ISyncService
{
    Task SyncFromSemanticScholarAsync(string? specificKeyword = null);
    Task SyncFromOpenAlexAsync();
}
