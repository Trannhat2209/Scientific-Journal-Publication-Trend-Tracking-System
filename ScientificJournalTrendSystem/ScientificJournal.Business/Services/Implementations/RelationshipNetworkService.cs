using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.Business.Services.Implementations;

public class RelationshipNetworkService : IRelationshipNetworkService
{
    private readonly AppDbContext _context;
    private readonly ISimilarityService _similarityService;

    public RelationshipNetworkService(AppDbContext context, ISimilarityService similarityService)
    {
        _context = context;
        _similarityService = similarityService;
    }

    public async Task<RelationshipNetworkDto> GetRelationshipNetworkAsync(Guid publicationId, double similarityThreshold = 0.3)
    {
        var network = new RelationshipNetworkDto();

        // 1. Get central publication
        var centralPub = await _context.Publications.FindAsync(publicationId);
        if (centralPub == null) return network;

        // Add central node
        network.Nodes.Add(new NetworkNodeDto
        {
            Id = centralPub.Id.ToString(),
            Label = centralPub.Title,
            Type = "Central"
        });

        // 2. Fetch candidates (sharing at least one keyword with central pub)
        var targetKeywordIds = await _context.PublicationKeywords
            .Where(pk => pk.PublicationId == publicationId)
            .Select(pk => pk.KeywordId)
            .ToListAsync();

        if (!targetKeywordIds.Any())
            return network;

        var relatedPubIds = await _context.PublicationKeywords
            .Where(pk => pk.PublicationId != publicationId && targetKeywordIds.Contains(pk.KeywordId))
            .Select(pk => pk.PublicationId)
            .Distinct()
            .ToListAsync();

        var relatedPubs = await _context.Publications
            .Where(p => relatedPubIds.Contains(p.Id))
            .ToListAsync();

        // 3. Compute similarity and add nodes + edges from central
        var nodesAdded = new HashSet<Guid> { publicationId };

        foreach (var pub in relatedPubs)
        {
            var score = await _similarityService.GetSimilarityScoreAsync(publicationId, pub.Id);
            if (score >= similarityThreshold)
            {
                if (!nodesAdded.Contains(pub.Id))
                {
                    network.Nodes.Add(new NetworkNodeDto
                    {
                        Id = pub.Id.ToString(),
                        Label = pub.Title,
                        Type = "Publication"
                    });
                    nodesAdded.Add(pub.Id);
                }

                network.Edges.Add(new NetworkEdgeDto
                {
                    Source = publicationId.ToString(),
                    Target = pub.Id.ToString(),
                    Weight = score,
                    RelationType = "Similarity"
                });
            }
        }

        // 4. Discover secondary links between the added related publications
        var addedList = nodesAdded.Where(id => id != publicationId).ToList();
        for (int i = 0; i < addedList.Count; i++)
        {
            for (int j = i + 1; j < addedList.Count; j++)
            {
                var id1 = addedList[i];
                var id2 = addedList[j];
                var score = await _similarityService.GetSimilarityScoreAsync(id1, id2);
                if (score >= similarityThreshold)
                {
                    network.Edges.Add(new NetworkEdgeDto
                    {
                        Source = id1.ToString(),
                        Target = id2.ToString(),
                        Weight = score,
                        RelationType = "Similarity"
                    });
                }
            }
        }

        return network;
    }
}
