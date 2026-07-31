using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class BookmarkService : IBookmarkService
{
    private readonly AppDbContext _context;

    public BookmarkService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PublicationDto>> GetBookmarksAsync(int userId)
    {
        var bookmarks = await _context.Bookmarks
            .AsNoTracking()
            .Include(b => b.Publication).ThenInclude(p => p!.Journal)
            .Include(b => b.Publication).ThenInclude(p => p!.PublicationAuthors).ThenInclude(pa => pa.Author)
            .Include(b => b.Publication).ThenInclude(p => p!.PublicationKeywords).ThenInclude(pk => pk.Keyword)
            .Where(b => b.UserId == userId && b.Publication != null && !b.Publication.IsDeleted)
            .ToListAsync();

        return bookmarks
            .Where(b => b.Publication is not null)
            .Select(b =>
        {
            var publication = b.Publication!;
            return new PublicationDto
            {
                Id = publication.Id,
                Title = publication.Title,
                Abstract = publication.Abstract,
                Year = publication.Year,
                DOI = publication.DOI,
                JournalName = publication.Journal?.Name ?? string.Empty,
                SourceApi = publication.SourceApi,
                SourceUrl = publication.SourceUrl,
                CitationCount = publication.CitationCount,
                Authors = publication.PublicationAuthors?.Select(pa => pa.Author?.Name ?? string.Empty).Where(name => !string.IsNullOrWhiteSpace(name)).ToList() ?? new List<string>(),
                Keywords = publication.PublicationKeywords?.Select(pk => pk.Keyword?.Term ?? string.Empty).Where(term => !string.IsNullOrWhiteSpace(term)).ToList() ?? new List<string>()
            };
        }).ToList();
    }

    public async Task AddBookmarkAsync(int userId, int publicationId)
    {
        var exists = await _context.Bookmarks.AnyAsync(b => b.UserId == userId && b.PublicationId == publicationId);
        if (!exists)
        {
            var bookmark = new Bookmark
            {
                UserId = userId,
                PublicationId = publicationId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Bookmarks.Add(bookmark);
            await _context.SaveChangesAsync();
        }
    }

    public async Task RemoveBookmarkAsync(int userId, int publicationId)
    {
        var bookmark = await _context.Bookmarks.FirstOrDefaultAsync(b => b.UserId == userId && b.PublicationId == publicationId);
        if (bookmark != null)
        {
            _context.Bookmarks.Remove(bookmark);
            await _context.SaveChangesAsync();
        }
    }
}

