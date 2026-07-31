using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations;

public class KeywordRepository : GenericRepository<Keyword>, IKeywordRepository
{
    public KeywordRepository(AppDbContext context) : base(context) { }

    public async Task<Keyword?> GetByNormalizedTermAsync(string term) =>
        await _context.Keywords.FirstOrDefaultAsync(k => k.NormalizedTerm == term.ToLower().Trim());
}
