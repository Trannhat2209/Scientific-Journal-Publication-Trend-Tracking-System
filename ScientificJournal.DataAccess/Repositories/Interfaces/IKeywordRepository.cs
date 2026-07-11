using System.Threading.Tasks;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces;

public interface IKeywordRepository : IGenericRepository<Keyword>
{
    Task<Keyword?> GetByNormalizedTermAsync(string term);
}
