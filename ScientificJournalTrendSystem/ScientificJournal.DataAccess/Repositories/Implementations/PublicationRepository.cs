using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.DataAccess.Repositories.Implementations;

public class PublicationRepository : GenericRepository<Publication>, IPublicationRepository
{
    public PublicationRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Publication>> SearchAsync(string? keyword, int? year, int? journalId, int page, int pageSize)
    {
        IQueryable<Publication> query = _context.Publications.Include(p => p.Journal);

        if (!string.IsNullOrEmpty(keyword))
            query = query.Where(p => p.Title.Contains(keyword) || (p.Abstract != null && p.Abstract.Contains(keyword)));

        if (year.HasValue)
            query = query.Where(p => p.Year == year.Value);

        if (journalId.HasValue)
            query = query.Where(p => p.JournalId == journalId.Value);

        return await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public async Task<Publication?> GetByDoiAsync(string doi) =>
        await _context.Publications.FirstOrDefaultAsync(p => p.DOI == doi);
}
