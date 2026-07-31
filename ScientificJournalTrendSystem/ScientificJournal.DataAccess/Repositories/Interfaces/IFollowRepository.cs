using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces;

public interface IFollowRepository : IGenericRepository<Follow>
{
    Task<IEnumerable<Follow>> GetByUserAsync(int userId);
}
