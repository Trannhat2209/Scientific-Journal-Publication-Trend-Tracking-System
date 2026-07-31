using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces;

public interface IPublicationRepository : IGenericRepository<Publication>
{
    Task<IEnumerable<Publication>> SearchAsync(string? keyword, int? year, int? journalId, int page, int pageSize);
    Task<Publication?> GetByDoiAsync(string doi);
}
