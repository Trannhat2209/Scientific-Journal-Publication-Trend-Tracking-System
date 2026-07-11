using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace ScientificJournal.DataAccess.External;

public class SemanticScholarPaperDto
{
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public string? Doi { get; set; }
    public int Year { get; set; }
    public int CitationCount { get; set; }
    public string? Venue { get; set; }
    public string? Url { get; set; }
    public List<string> Authors { get; set; } = new();
    public string RawJson { get; set; } = string.Empty;
}

/// <summary>
/// Real client for the Semantic Scholar Academic Graph API (https://api.semanticscholar.org).
/// The search endpoint is public and works without an API key at a modest, unauthenticated
/// rate limit — fine for a scheduled sync job that only pulls a handful of records per run.
/// Docs: https://api.semanticscholar.org/api-docs/graph
/// </summary>
public class SemanticScholarClient
{
    private const string Fields = "title,abstract,year,externalIds,citationCount,venue,url,authors";
    private readonly HttpClient _httpClient;

    public SemanticScholarClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress ??= new Uri("https://api.semanticscholar.org/graph/v1/");
    }

    public async Task<List<SemanticScholarPaperDto>> SearchRecentPapersAsync(string query, int limit = 5, CancellationToken cancellationToken = default)
    {
        var effectiveQuery = string.IsNullOrWhiteSpace(query) ? "science" : query;
        var url = $"paper/search?query={Uri.EscapeDataString(effectiveQuery)}&limit={Math.Clamp(limit, 1, 20)}&fields={Fields}";

        using var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Semantic Scholar request failed with status {(int)response.StatusCode}.");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(json);

        if (!document.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
        {
            return new List<SemanticScholarPaperDto>();
        }

        var papers = new List<SemanticScholarPaperDto>();
        foreach (var item in data.EnumerateArray())
        {
            var paper = ParsePaper(item);
            if (paper != null)
            {
                papers.Add(paper);
            }
        }

        return papers;
    }

    private static SemanticScholarPaperDto? ParsePaper(JsonElement item)
    {
        var title = GetString(item, "title");
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        string? doi = null;
        if (item.TryGetProperty("externalIds", out var externalIds) && externalIds.ValueKind == JsonValueKind.Object)
        {
            doi = GetString(externalIds, "DOI");
        }

        var year = item.TryGetProperty("year", out var yearElement) && yearElement.ValueKind == JsonValueKind.Number
            ? yearElement.GetInt32()
            : DateTime.UtcNow.Year;

        var citationCount = item.TryGetProperty("citationCount", out var citedElement) && citedElement.ValueKind == JsonValueKind.Number
            ? citedElement.GetInt32()
            : 0;

        var authors = new List<string>();
        if (item.TryGetProperty("authors", out var authorsElement) && authorsElement.ValueKind == JsonValueKind.Array)
        {
            authors = authorsElement.EnumerateArray()
                .Select(a => GetString(a, "name"))
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name!)
                .ToList();
        }

        return new SemanticScholarPaperDto
        {
            Title = title!,
            Abstract = GetString(item, "abstract"),
            Doi = doi,
            Year = year,
            CitationCount = citationCount,
            Venue = GetString(item, "venue"),
            Url = GetString(item, "url"),
            Authors = authors,
            RawJson = item.GetRawText()
        };
    }

    private static string? GetString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
}
