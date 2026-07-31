using System.Collections.Generic;

namespace ScientificJournal.Common.DTOs.Response.Publication;

public class RelationshipNetworkDto
{
    public List<NetworkNodeDto> Nodes { get; set; } = new();
    public List<NetworkEdgeDto> Edges { get; set; } = new();
}

public class NetworkNodeDto
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Type { get; set; } = "Publication";
    public string? Title { get; set; }
    public int Year { get; set; }
    public int CitationCount { get; set; }
    public List<string> Authors { get; set; } = new();
}

public class NetworkEdgeDto
{
    public string Source { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public double Weight { get; set; }
    public string RelationType { get; set; } = "Similarity";
}
