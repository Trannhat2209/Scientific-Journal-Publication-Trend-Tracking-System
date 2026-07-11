using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace ScientificJournal.DataAccess.External;

public class GoogleScholarResultDto
{
    public string Title { get; set; } = string.Empty;
    public string? Snippet { get; set; }
    public string? Link { get; set; }
    public string? PublicationSummary { get; set; }
    public int? Year { get; set; }
    public int CitationCount { get; set; }
    public string RawJson { get; set; } = string.Empty;
}

/// <summary>
/// Google Scholar has no official public API, and scraping google.com/scholar directly would
/// violate Google's Terms of Service. SerpApi (https://serpapi.com) is a licensed third-party
/// data provider that exposes Google Scholar results through its own public, ToS-compliant REST
/// API — the same approach already used by SerpApiScholarSimilarityService for duplicate
/// checking. This client reuses that same API/key for the automatic sync job.
/// </summary>
public class GoogleScholarClient
{
    private readonly HttpClient _httpClient;

    public GoogleScholarClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    /// <summary>True if an API key is configured (via environment/.env or an explicit override), so callers can skip gracefully instead of throwing.</summary>
    public bool IsConfigured(string? apiKeyOverride = null) => !string.IsNullOrWhiteSpace(apiKeyOverride ?? ResolveApiKey());

    public async Task<List<GoogleScholarResultDto>> SearchRecentResultsAsync(string query, int count = 5, string? apiKeyOverride = null, CancellationToken cancellationToken = default)
    {
        var apiKey = apiKeyOverride ?? ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("SERPAPI_API_KEY is not configured.");
        }

        var effectiveQuery = string.IsNullOrWhiteSpace(query) ? "science" : query;
        var url = "https://serpapi.com/search.json" +
                  $"?engine=google_scholar&q={Uri.EscapeDataString(effectiveQuery)}" +
                  $"&num={Math.Clamp(count, 1, 20)}&api_key={Uri.EscapeDataString(apiKey)}";

        using var response = await _httpClient.GetAsync(url, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"SerpApi (Google Scholar) request failed: {(int)response.StatusCode}");
        }

        using var document = JsonDocument.Parse(json);
        if (document.RootElement.TryGetProperty("error", out var errorElement))
        {
            throw new InvalidOperationException(errorElement.GetString() ?? "SerpApi returned an error.");
        }

        if (!document.RootElement.TryGetProperty("organic_results", out var results) || results.ValueKind != JsonValueKind.Array)
        {
            return new List<GoogleScholarResultDto>();
        }

        var items = new List<GoogleScholarResultDto>();
        foreach (var item in results.EnumerateArray())
        {
            var parsed = ParseResult(item);
            if (parsed != null)
            {
                items.Add(parsed);
            }
        }

        return items.Take(count).ToList();
    }

    private static GoogleScholarResultDto? ParseResult(JsonElement item)
    {
        var title = GetString(item, "title");
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        string? summary = null;
        int? year = null;
        if (item.TryGetProperty("publication_info", out var publicationInfo))
        {
            summary = GetString(publicationInfo, "summary");
            if (!string.IsNullOrWhiteSpace(summary))
            {
                // publication_info.summary typically looks like "J Smith, A Doe - Nature, 2023 - nature.com"
                var parts = summary.Split(',', '-');
                foreach (var part in parts)
                {
                    if (int.TryParse(part.Trim(), out var parsedYear) && parsedYear > 1900 && parsedYear <= DateTime.UtcNow.Year + 1)
                    {
                        year = parsedYear;
                        break;
                    }
                }
            }
        }

        var citationCount = 0;
        if (item.TryGetProperty("inline_links", out var inlineLinks) &&
            inlineLinks.TryGetProperty("cited_by", out var citedBy) &&
            citedBy.TryGetProperty("total", out var totalElement) &&
            totalElement.ValueKind == JsonValueKind.Number)
        {
            citationCount = totalElement.GetInt32();
        }

        return new GoogleScholarResultDto
        {
            Title = title!,
            Snippet = GetString(item, "snippet"),
            Link = GetString(item, "link"),
            PublicationSummary = summary,
            Year = year,
            CitationCount = citationCount,
            RawJson = item.GetRawText()
        };
    }

    private static string? GetString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static string ResolveApiKey()
    {
        var configured = Environment.GetEnvironmentVariable("SERPAPI_API_KEY");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        // Same .env fallback lookup used by SerpApiScholarSimilarityService, kept here too so
        // both callers behave identically regardless of which one runs first.
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current != null)
        {
            var envPath = Path.Combine(current.FullName, ".env");
            if (File.Exists(envPath))
            {
                var value = ReadEnvValue(envPath, "SERPAPI_API_KEY");
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            current = current.Parent;
        }

        return string.Empty;
    }

    private static string? ReadEnvValue(string envPath, string key)
    {
        foreach (var line in File.ReadLines(envPath))
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.StartsWith("#", StringComparison.Ordinal))
            {
                continue;
            }

            var separator = trimmed.IndexOf('=');
            if (separator <= 0)
            {
                continue;
            }

            var name = trimmed[..separator].Trim();
            if (!string.Equals(name, key, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return trimmed[(separator + 1)..].Trim().Trim('"');
        }

        return null;
    }
}
