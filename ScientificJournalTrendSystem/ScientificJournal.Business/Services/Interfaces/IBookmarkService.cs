using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Response.Publication;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IBookmarkService
{
    Task<IEnumerable<PublicationDto>> GetBookmarksAsync(Guid userId);
    Task AddBookmarkAsync(Guid userId, Guid publicationId);
    Task RemoveBookmarkAsync(Guid userId, Guid publicationId);
}
