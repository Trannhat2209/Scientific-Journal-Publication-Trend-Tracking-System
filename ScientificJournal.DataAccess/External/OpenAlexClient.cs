using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace ScientificJournal.DataAccess.External;

public class OpenAlexWorkDto
{
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public string? Doi { get; set; }
    public int Year { get; set; }
    public int CitationCount { get; set; }
    public string? JournalName { get; set; }
    public string? LandingPageUrl { get; set; }
    public string? OpenAlexId { get; set; }
    public List<string> Authors { get; set; } = new();
    public List<string> Keywords { get; set; } = new();
    public string RawJson { get; set; } = string.Empty;
}

/// <summary>
/// Real client for the OpenAlex REST API (https://api.openalex.org). OpenAlex is fully public,
/// requires no API key, and its "polite pool" (faster, more reliable) is unlocked simply by
/// sending an identifying email via the `mailto` query parameter.
/// Docs: https://docs.openalex.org/api-entities/works/search-works
/// </summary>
public class OpenAlexClient
{
    private readonly HttpClient _httpClient;

    public OpenAlexClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress ??= new Uri("https://api.openalex.org/");
        if (!_httpClient.DefaultRequestHeaders.UserAgent.Any())
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "ScientificJournalTrendSystem/1.0 (mailto:sync-bot@scientificjournal.local)");
        }
    }

    /// <summary>
    /// Fetches the most recently indexed works matching <paramref name="query"/> (or, if empty,
    /// simply the most recently indexed works overall), newest first.
    /// </summary>
    public async Task<List<OpenAlexWorkDto>> SearchRecentWorksAsync(string query, int count = 5, CancellationToken cancellationToken = default)
    {
        var filterParts = new List<string> { "has_doi:true" };
        var searchPart = string.IsNullOrWhiteSpace(query) ? string.Empty : $"&search={Uri.EscapeDataString(query)}";
        var url = $"works?filter={Uri.EscapeDataString(string.Join(",", filterParts))}" +
                  $"{searchPart}&sort=publication_date:desc&per-page={Math.Clamp(count, 1, 25)}" +
                  "&mailto=sync-bot@scientificjournal.local";

        using var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAlex request failed with status {(int)response.StatusCode}.");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(json);

        if (!document.RootElement.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
        {
            return new List<OpenAlexWorkDto>();
        }

        var works = new List<OpenAlexWorkDto>();
        foreach (var item in results.EnumerateArray())
        {
            var work = ParseWork(item);
            if (work != null)
            {
                works.Add(work);
            }
        }

        return works;
    }

    private static OpenAlexWorkDto? ParseWork(JsonElement item)
    {
        var title = GetString(item, "display_name") ?? GetString(item, "title");
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        var doi = GetString(item, "doi");
        if (!string.IsNullOrWhiteSpace(doi))
        {
            // OpenAlex returns DOIs as full URLs (https://doi.org/10.xxxx/yyyy) — normalize to the bare DOI
            doi = doi.Replace("https://doi.org/", string.Empty, StringComparison.OrdinalIgnoreCase);
        }

        var year = item.TryGetProperty("publication_year", out var yearElement) && yearElement.ValueKind == JsonValueKind.Number
            ? yearElement.GetInt32()
            : DateTime.UtcNow.Year;

        var citationCount = item.TryGetProperty("cited_by_count", out var citedElement) && citedElement.ValueKind == JsonValueKind.Number
            ? citedElement.GetInt32()
            : 0;

        string? journalName = null;
        string? landingPageUrl = null;
        if (item.TryGetProperty("primary_location", out var primaryLocation) && primaryLocation.ValueKind == JsonValueKind.Object)
        {
            landingPageUrl = GetString(primaryLocation, "landing_page_url");
            if (primaryLocation.TryGetProperty("source", out var source) && source.ValueKind == JsonValueKind.Object)
            {
                journalName = GetString(source, "display_name");
            }
        }

        var openAlexId = GetString(item, "id");
        // Fall back to the OpenAlex work page itself as the "go to source" link if the publisher
        // didn't expose a landing page URL.
        landingPageUrl ??= openAlexId;

        var authors = new List<string>();
        if (item.TryGetProperty("authorships", out var authorships) && authorships.ValueKind == JsonValueKind.Array)
        {
            foreach (var authorship in authorships.EnumerateArray())
            {
                if (authorship.TryGetProperty("author", out var author) && author.ValueKind == JsonValueKind.Object)
                {
                    var name = GetString(author, "display_name");
                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        authors.Add(name);
                    }
                }
            }
        }

        var keywords = new List<string>();
        if (item.TryGetProperty("concepts", out var concepts) && concepts.ValueKind == JsonValueKind.Array)
        {
            keywords = concepts.EnumerateArray()
                .Select(c => GetString(c, "display_name"))
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name!)
                .Take(5)
                .ToList();
        }

        string? abstractText = null;
        if (item.TryGetProperty("abstract_inverted_index", out var invertedIndex) && invertedIndex.ValueKind == JsonValueKind.Object)
        {
            abstractText = ReconstructAbstract(invertedIndex);
        }

        return new OpenAlexWorkDto
        {
            Title = title!,
            Abstract = abstractText,
            Doi = doi,
            Year = year,
            CitationCount = citationCount,
            JournalName = journalName,
            LandingPageUrl = landingPageUrl,
            OpenAlexId = openAlexId,
            Authors = authors,
            Keywords = keywords,
            RawJson = item.GetRawText()
        };
    }

    /// <summary>
    /// OpenAlex doesn't return abstracts as plain text (to respect publisher copyright on the
    /// exact wording); instead it returns an "inverted index" mapping each distinct word to the
    /// list of positions it appears at. This rebuilds the plain-text abstract from that index.
    /// </summary>
    private static string ReconstructAbstract(JsonElement invertedIndex)
    {
        var positions = new SortedDictionary<int, string>();
        foreach (var property in invertedIndex.EnumerateObject())
        {
            if (property.Value.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var positionElement in property.Value.EnumerateArray())
            {
                if (positionElement.ValueKind == JsonValueKind.Number)
                {
                    positions[positionElement.GetInt32()] = property.Name;
                }
            }
        }

        return string.Join(' ', positions.Values);
    }

    private static string? GetString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
}
