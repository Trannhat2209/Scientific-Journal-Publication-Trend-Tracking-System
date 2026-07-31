using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces;

public interface IBookmarkRepository : IGenericRepository<Bookmark>
{
    Task<IEnumerable<Bookmark>> GetByUserAsync(int userId);
}
