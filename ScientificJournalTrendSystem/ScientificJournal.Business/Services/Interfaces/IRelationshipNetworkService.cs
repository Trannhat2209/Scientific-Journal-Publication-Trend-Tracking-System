using System;
using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Response.Publication;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IRelationshipNetworkService
{
    Task<RelationshipNetworkDto> GetRelationshipNetworkAsync(int publicationId, double similarityThreshold = 0.3);
}
