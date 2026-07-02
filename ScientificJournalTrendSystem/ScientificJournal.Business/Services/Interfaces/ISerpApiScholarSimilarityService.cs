using ScientificJournal.Common.DTOs.Request.Publication;
using ScientificJournal.Common.DTOs.Response.Publication;

namespace ScientificJournal.Business.Services.Interfaces;

public interface ISerpApiScholarSimilarityService
{
    Task<PublicationSimilarityCheckResponseDto> CheckSimilarityAsync(
        PublicationSimilarityCheckRequestDto request,
        CancellationToken cancellationToken = default);
}
