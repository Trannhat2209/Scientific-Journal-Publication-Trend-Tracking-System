using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations;

public class SyncLogRepository : GenericRepository<SyncLog>, ISyncLogRepository
{
    public SyncLogRepository(AppDbContext context) : base(context) { }

    public async Task<SyncLog?> GetLatestLogAsync() =>
        await _context.SyncLogs.OrderByDescending(sl => sl.StartedAt).FirstOrDefaultAsync();
}
