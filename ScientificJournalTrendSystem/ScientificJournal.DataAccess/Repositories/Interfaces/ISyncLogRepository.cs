using System.Threading.Tasks;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces;

public interface ISyncLogRepository : IGenericRepository<SyncLog>
{
    Task<SyncLog?> GetLatestLogAsync();
}
