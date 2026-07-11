using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations;

public class FollowRepository : GenericRepository<Follow>, IFollowRepository
{
    public FollowRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Follow>> GetByUserAsync(int userId) =>
        await _context.Follows.Where(f => f.UserId == userId).ToListAsync();
}
