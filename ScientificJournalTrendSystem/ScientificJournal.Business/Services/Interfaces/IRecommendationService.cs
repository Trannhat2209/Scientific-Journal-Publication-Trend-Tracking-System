using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Response.Publication;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IRecommendationService
{
    Task<IEnumerable<PublicationDto>> GetRecommendationsForUserAsync(int userId, int limit = 5);
    Task<IEnumerable<RelatedPublicationDto>> GetRelatedPublicationsAsync(int publicationId, int limit = 5);
}
