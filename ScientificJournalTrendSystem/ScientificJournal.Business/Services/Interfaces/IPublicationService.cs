using System;
using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Request.Publication;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.Common.DTOs.Response.Publication;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IPublicationService
{
    Task<PaginatedResponse<PublicationDto>> SearchPublicationsAsync(PublicationSearchRequestDto request);
    Task<PublicationDetailDto> GetPublicationDetailAsync(int id);
    Task<object> GetPublicationsStatisticsAsync();
}

