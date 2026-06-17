using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations;

public class BookmarkRepository : GenericRepository<Bookmark>, IBookmarkRepository
{
    public BookmarkRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Bookmark>> GetByUserAsync(Guid userId) =>
        await _context.Bookmarks
            .Include(b => b.Publication)
            .Where(b => b.UserId == userId)
            .ToListAsync();
}
