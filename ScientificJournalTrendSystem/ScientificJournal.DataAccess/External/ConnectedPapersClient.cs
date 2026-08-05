using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace ScientificJournal.DataAccess.External;

public sealed class ConnectedPapersClient
{
    private const string DefaultBaseUrl = "https://rest.prod.connectedpapers.com";
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ExternalApiRateLimiter _rateLimiter;

    public ConnectedPapersClient(HttpClient httpClient, IConfiguration configuration, ExternalApiRateLimiter rateLimiter)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(20);
        _configuration = configuration;
        _rateLimiter = rateLimiter;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ResolveApiKey());

    public async Task<int?> GetRemainingUsagesAsync(CancellationToken cancellationToken = default)
    {
        var key = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(key)) return null;
        using var request = CreateRequest("papers-api/remaining-usages", key);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        return TryGetInt(document.RootElement, "remaining_uses");
    }

    public async Task<ConnectedPapersGraph?> GetGraphAsync(string? doi, string? title, CancellationToken cancellationToken = default)
    {
        var key = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(key)) return null;
        var paperId = await ResolvePaperIdAsync(doi, title, cancellationToken);
        if (string.IsNullOrWhiteSpace(paperId)) return null;

        var path = $"papers-api/graph/0/{Uri.EscapeDataString(paperId)}";
        for (var attempt = 0; attempt < 12; attempt++)
        {
            await _rateLimiter.WaitAsync("ConnectedPapers", cancellationToken);
            using var request = CreateRequest(path, key);
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var root = document.RootElement;
            var status = TryGetString(root, "status") ?? "ERROR";
            if (status is "FRESH_GRAPH" or "OLD_GRAPH" && root.TryGetProperty("graph_json", out var graph))
                return ParseGraph(graph);
            if (status is "OVERLOADED")
            {
                await Task.Delay(TimeSpan.FromSeconds(Math.Min(5, attempt + 1)), cancellationToken);
                continue;
            }
            if (status is not ("QUEUED" or "IN_PROGRESS")) return null;
            await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
        }
        return null;
    }

    private async Task<string?> ResolvePaperIdAsync(string? doi, string? title, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(doi))
        {
            var normalized = doi.Trim().Replace("https://doi.org/", "", StringComparison.OrdinalIgnoreCase).Replace("http://doi.org/", "", StringComparison.OrdinalIgnoreCase);
            var id = await GetSemanticScholarIdAsync($"https://api.semanticscholar.org/graph/v1/paper/DOI:{Uri.EscapeDataString(normalized)}?fields=paperId", false, cancellationToken);
            if (!string.IsNullOrWhiteSpace(id)) return id;
        }
        if (string.IsNullOrWhiteSpace(title)) return null;
        return await GetSemanticScholarIdAsync($"https://api.semanticscholar.org/graph/v1/paper/search?query={Uri.EscapeDataString(title.Trim())}&limit=1&fields=paperId,title", true, cancellationToken);
    }

    private async Task<string?> GetSemanticScholarIdAsync(string url, bool search, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("ScholarTrend/1.0");
        var semanticKey = _configuration["SemanticScholar:ApiKey"] ?? _configuration["SEMANTIC_SCHOLAR_API_KEY"] ?? Environment.GetEnvironmentVariable("SEMANTIC_SCHOLAR_API_KEY");
        if (!string.IsNullOrWhiteSpace(semanticKey)) request.Headers.TryAddWithoutValidation("x-api-key", semanticKey);
        await _rateLimiter.WaitAsync("SemanticScholar", cancellationToken);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var root = document.RootElement;
        if (search)
        {
            if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array || data.GetArrayLength() == 0) return null;
            root = data[0];
        }
        return TryGetString(root, "paperId");
    }

    private HttpRequestMessage CreateRequest(string path, string key)
    {
        var baseUrl = (_configuration["ConnectedPapers:BaseUrl"] ?? _configuration["CONNECTED_PAPERS_REST_API"] ?? DefaultBaseUrl).TrimEnd('/');
        var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/{path}");
        request.Headers.TryAddWithoutValidation("X-Api-Key", key);
        request.Headers.UserAgent.ParseAdd("ScholarTrend/1.0");
        return request;
    }

    private static ConnectedPapersGraph ParseGraph(JsonElement graph)
    {
        var result = new ConnectedPapersGraph { StartId = TryGetString(graph, "start_id") ?? string.Empty };
        if (graph.TryGetProperty("nodes", out var nodes) && nodes.ValueKind == JsonValueKind.Object)
            foreach (var property in nodes.EnumerateObject())
            {
                var paper = property.Value;
                result.Nodes.Add(new ConnectedPapersNode
                {
                    Id = TryGetString(paper, "id") ?? TryGetString(paper, "paperId") ?? property.Name,
                    Title = TryGetString(paper, "title") ?? "Untitled publication",
                    Abstract = TryGetString(paper, "abstract") ?? TryGetString(paper, "tldr"),
                    Year = TryGetInt(paper, "year") ?? 0,
                    CitationCount = TryGetInt(paper, "citationCount") ?? TryGetInt(paper, "citations_length") ?? 0,
                    Doi = TryGetString(paper, "doi"), Url = TryGetString(paper, "url"), Authors = ParseAuthors(paper)
                });
            }
        if (graph.TryGetProperty("edges", out var edges) && edges.ValueKind == JsonValueKind.Array)
            foreach (var edge in edges.EnumerateArray())
                if (edge.ValueKind == JsonValueKind.Array && edge.GetArrayLength() >= 2)
                    result.Edges.Add(new ConnectedPapersEdge { Source = edge[0].GetString() ?? "", Target = edge[1].GetString() ?? "", Weight = edge.GetArrayLength() > 2 && edge[2].TryGetDouble(out var weight) ? weight : 1 });
        return result;
    }

    private static List<string> ParseAuthors(JsonElement paper)
    {
        var result = new List<string>();
        if (!paper.TryGetProperty("authors", out var authors) || authors.ValueKind != JsonValueKind.Array) return result;
        foreach (var author in authors.EnumerateArray())
        {
            var name = author.ValueKind == JsonValueKind.String ? author.GetString() : TryGetString(author, "name");
            if (!string.IsNullOrWhiteSpace(name)) result.Add(name);
        }
        return result;
    }

    private string ResolveApiKey() => _configuration["ConnectedPapers:ApiKey"] ?? _configuration["CONNECTED_PAPERS_API_KEY"] ?? Environment.GetEnvironmentVariable("CONNECTED_PAPERS_API_KEY") ?? "";
    private static string? TryGetString(JsonElement element, string name) => element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    private static int? TryGetInt(JsonElement element, string name) => element.TryGetProperty(name, out var value) && value.TryGetInt32(out var number) ? number : null;
}

public sealed class ConnectedPapersGraph
{
    public string StartId { get; set; } = string.Empty;
    public List<ConnectedPapersNode> Nodes { get; set; } = new();
    public List<ConnectedPapersEdge> Edges { get; set; } = new();
}
public sealed class ConnectedPapersNode
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public int Year { get; set; }
    public int CitationCount { get; set; }
    public string? Doi { get; set; }
    public string? Url { get; set; }
    public List<string> Authors { get; set; } = new();
}
public sealed class ConnectedPapersEdge
{
    public string Source { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public double Weight { get; set; }
}
