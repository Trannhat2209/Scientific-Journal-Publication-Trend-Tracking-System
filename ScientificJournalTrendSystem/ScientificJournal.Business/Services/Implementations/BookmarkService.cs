using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Response.Publication;

namespace ScientificJournal.Business.Services.Implementations;

public class BookmarkService : IBookmarkService
{
    public Task<IEnumerable<PublicationDto>> GetBookmarksAsync(Guid userId)
    {
        return Task.FromResult<IEnumerable<PublicationDto>>(new List<PublicationDto>());
    }

    public Task AddBookmarkAsync(Guid userId, Guid publicationId)
    {
        return Task.CompletedTask;
    }

    public Task RemoveBookmarkAsync(Guid userId, Guid publicationId)
    {
        return Task.CompletedTask;
    }
}
