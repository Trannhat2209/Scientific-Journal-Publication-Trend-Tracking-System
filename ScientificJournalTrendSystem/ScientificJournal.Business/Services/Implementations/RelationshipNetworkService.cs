using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.External;

namespace ScientificJournal.Business.Services.Implementations;

public class RelationshipNetworkService : IRelationshipNetworkService
{
    private readonly AppDbContext _context;
    private readonly ISimilarityService _similarityService;
    private readonly ConnectedPapersClient _connectedPapersClient;

    public RelationshipNetworkService(AppDbContext context, ISimilarityService similarityService, ConnectedPapersClient connectedPapersClient)
    {
        _context = context;
        _similarityService = similarityService;
        _connectedPapersClient = connectedPapersClient;
    }

    public async Task<RelationshipNetworkDto> GetRelationshipNetworkAsync(int publicationId, double similarityThreshold = 0.3)
    {
        var network = new RelationshipNetworkDto();

        // 1. Get central publication with authors
        var centralPub = await _context.Publications
            .Include(p => p.PublicationAuthors)
                .ThenInclude(pa => pa.Author)
            .FirstOrDefaultAsync(p => p.Id == publicationId);
        if (centralPub == null) return network;

        var centralAuthors = centralPub.PublicationAuthors
            .OrderBy(pa => pa.AuthorOrder)
            .Select(pa => pa.Author?.Name ?? string.Empty)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .ToList();

        network.Nodes.Add(new NetworkNodeDto
        {
            Id = centralPub.Id.ToString(),
            Label = centralPub.Title,
            Type = "Central",
            Title = centralPub.Title,
            Year = centralPub.Year,
            CitationCount = centralPub.CitationCount,
            Authors = centralAuthors,
        });

        // 2. Fetch candidates (sharing at least one keyword with central pub)
        var targetKeywordIds = await _context.PublicationKeywords
            .Where(pk => pk.PublicationId == publicationId)
            .Select(pk => pk.KeywordId)
            .ToListAsync();

        var relatedPubIds = await _context.PublicationKeywords
            .Where(pk => pk.PublicationId != publicationId && targetKeywordIds.Contains(pk.KeywordId))
            .Select(pk => pk.PublicationId)
            .Distinct()
            .ToListAsync();

        var relatedPubs = await _context.Publications
            .Where(p => relatedPubIds.Contains(p.Id))
            .Include(p => p.PublicationAuthors)
                .ThenInclude(pa => pa.Author)
            .ToListAsync();

        // 3. Compute similarity and add nodes + edges from central
        var nodesAdded = new HashSet<int> { publicationId };

        foreach (var pub in relatedPubs)
        {
            var score = await _similarityService.GetSimilarityScoreAsync(publicationId, pub.Id);
            if (score >= similarityThreshold)
            {
                if (!nodesAdded.Contains(pub.Id))
                {
                    var authors = pub.PublicationAuthors
                        .OrderBy(pa => pa.AuthorOrder)
                        .Select(pa => pa.Author?.Name ?? string.Empty)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .ToList();

                    network.Nodes.Add(new NetworkNodeDto
                    {
                        Id = pub.Id.ToString(),
                        Label = pub.Title,
                        Type = "Publication",
                        Title = pub.Title,
                        Year = pub.Year,
                        CitationCount = pub.CitationCount,
                        Authors = authors,
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

        // Enrich the local similarity network with real Connected Papers graph
        // nodes when API access is configured. Provider failures are optional and
        // must not prevent the local graph from being returned.
        if (_connectedPapersClient.IsConfigured)
        {
            try
            {
                var externalGraph = await _connectedPapersClient.GetGraphAsync(centralPub.DOI, centralPub.Title);
                if (externalGraph != null)
                {
                    foreach (var node in externalGraph.Nodes.Take(50))
                    {
                        if (node.Id == externalGraph.StartId) continue;
                        var id = $"cp:{node.Id}";
                        if (network.Nodes.Any(existing => existing.Id == id)) continue;
                        network.Nodes.Add(new NetworkNodeDto { Id = id, Label = node.Title, Type = "ConnectedPapers", Title = node.Title, Year = node.Year, CitationCount = node.CitationCount, Authors = node.Authors });
                    }
                    foreach (var edge in externalGraph.Edges.Take(150))
                    {
                        var source = edge.Source == externalGraph.StartId ? centralPub.Id.ToString() : $"cp:{edge.Source}";
                        var target = edge.Target == externalGraph.StartId ? centralPub.Id.ToString() : $"cp:{edge.Target}";
                        if (network.Nodes.Any(node => node.Id == source) && network.Nodes.Any(node => node.Id == target))
                            network.Edges.Add(new NetworkEdgeDto { Source = source, Target = target, Weight = edge.Weight, RelationType = "ConnectedPapersSimilarity" });
                    }
                }
            }
            catch (HttpRequestException) { }
            catch (TaskCanceledException) { }
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
