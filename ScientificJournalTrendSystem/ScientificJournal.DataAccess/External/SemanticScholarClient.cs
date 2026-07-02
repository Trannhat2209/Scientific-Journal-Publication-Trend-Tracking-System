using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace ScientificJournal.DataAccess.External;

public class SemanticScholarClient
{
    private readonly HttpClient _httpClient;

    public SemanticScholarClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://api.semanticscholar.org/graph/v1/");
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "ScientificJournalTrendTrackingSystem/1.0");
    }

    public async Task<SemanticScholarSearchResponse?> SearchPapersAsync(string query, int limit = 10)
    {
        try
        {
            var url = $"paper/search?query={Uri.EscapeDataString(query)}&limit={limit}&fields=title,abstract,authors,year,externalIds,citationCount,venue";
            return await _httpClient.GetFromJsonAsync<SemanticScholarSearchResponse>(url);
        }
        catch (Exception)
        {
            return null;
        }
    }
}

public class SemanticScholarSearchResponse
{
    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("data")]
    public List<SemanticScholarPaperDto> Data { get; set; } = new();
}

public class SemanticScholarPaperDto
{
    [JsonPropertyName("paperId")]
    public string PaperId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("abstract")]
    public string? Abstract { get; set; }

    [JsonPropertyName("year")]
    public int? Year { get; set; }

    [JsonPropertyName("citationCount")]
    public int CitationCount { get; set; }

    [JsonPropertyName("venue")]
    public string? Venue { get; set; }

    [JsonPropertyName("externalIds")]
    public ExternalIdsDto? ExternalIds { get; set; }

    [JsonPropertyName("authors")]
    public List<SemanticScholarAuthorDto> Authors { get; set; } = new();
}

public class ExternalIdsDto
{
    [JsonPropertyName("DOI")]
    public string? DOI { get; set; }
}

public class SemanticScholarAuthorDto
{
    [JsonPropertyName("authorId")]
    public string? AuthorId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}
