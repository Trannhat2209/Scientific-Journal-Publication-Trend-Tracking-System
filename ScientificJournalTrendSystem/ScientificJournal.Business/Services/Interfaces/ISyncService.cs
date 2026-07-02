using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public interface ISyncService
{
    Task SyncFromSemanticScholarAsync();
    Task SyncFromOpenAlexAsync();
}
