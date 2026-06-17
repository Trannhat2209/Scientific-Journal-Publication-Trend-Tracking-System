using System;
using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Publication;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.Common.DTOs.Response.Publication;

namespace ScientificJournal.Business.Services.Implementations;

public class PublicationService : IPublicationService
{
    public Task<PaginatedResponse<PublicationDto>> SearchPublicationsAsync(PublicationSearchRequestDto request)
    {
        return Task.FromResult(new PaginatedResponse<PublicationDto>());
    }

    public Task<PublicationDetailDto> GetPublicationDetailAsync(Guid id)
    {
        return Task.FromResult(new PublicationDetailDto());
    }
}
