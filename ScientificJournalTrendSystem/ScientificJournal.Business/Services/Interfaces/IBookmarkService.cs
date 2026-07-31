using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Response.Publication;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IBookmarkService
{
    Task<IEnumerable<PublicationDto>> GetBookmarksAsync(int userId);
    Task AddBookmarkAsync(int userId, int publicationId);
    Task RemoveBookmarkAsync(int userId, int publicationId);
}
