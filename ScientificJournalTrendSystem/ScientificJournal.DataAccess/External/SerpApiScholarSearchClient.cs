using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace ScientificJournal.DataAccess.External;

public class SerpApiScholarSearchClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public SerpApiScholarSearchClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(12);
        _configuration = configuration;
    }

    public async Task<IReadOnlyList<ExternalPublication>> SearchAsync(
        string query,
        int maxResults = 10,
        CancellationToken cancellationToken = default)
    {
        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Array.Empty<ExternalPublication>();
        }

        var searchTerm = string.IsNullOrWhiteSpace(query)
            ? "artificial intelligence"
            : query.Trim();
        var num = Math.Clamp(maxResults, 1, 20);
        var url =
            "https://serpapi.com/search.json" +
            "?engine=google_scholar" +
            $"&q={Uri.EscapeDataString(searchTerm)}" +
            $"&num={num}" +
            $"&api_key={Uri.EscapeDataString(apiKey)}";

        using var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return Array.Empty<ExternalPublication>();
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(json);
        if (document.RootElement.TryGetProperty("error", out _))
        {
            return Array.Empty<ExternalPublication>();
        }

        if (!document.RootElement.TryGetProperty("organic_results", out var results) ||
            results.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<ExternalPublication>();
        }

        return results.EnumerateArray()
            .Select(MapResult)
            .Where(item => !string.IsNullOrWhiteSpace(item.Title))
            .ToList();
    }

    private ExternalPublication MapResult(JsonElement item)
    {
        var title = GetString(item, "title") ?? string.Empty;
        var snippet = GetString(item, "snippet");
        var summary = string.Empty;
        var authors = new List<string>();

        if (item.TryGetProperty("publication_info", out var publicationInfo) &&
            publicationInfo.ValueKind == JsonValueKind.Object)
        {
            summary = GetString(publicationInfo, "summary") ?? string.Empty;
            if (publicationInfo.TryGetProperty("authors", out var authorItems) &&
                authorItems.ValueKind == JsonValueKind.Array)
            {
                authors = authorItems.EnumerateArray()
                    .Select(author => GetString(author, "name"))
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .Cast<string>()
                    .Take(8)
                    .ToList();
            }
        }

        var citationCount = 0;
        if (item.TryGetProperty("inline_links", out var inlineLinks) &&
            inlineLinks.ValueKind == JsonValueKind.Object &&
            inlineLinks.TryGetProperty("cited_by", out var citedBy) &&
            citedBy.ValueKind == JsonValueKind.Object)
        {
            citationCount = GetInt(citedBy, "total");
        }

        var year = ExtractYear(summary) ?? ExtractYear(snippet) ?? 0;
        var journal = string.IsNullOrWhiteSpace(summary)
            ? "Google Scholar"
            : $"Google Scholar - {summary}";

        return new ExternalPublication
        {
            Title = title,
            Abstract = snippet,
            Year = year,
            DOI = string.Empty,
            SourceApi = "Google Scholar",
            JournalName = journal,
            CitationCount = citationCount,
            Authors = authors,
            Keywords = ExtractKeywords(title, snippet),
            RawJson = item.GetRawText()
        };
    }

    private string ResolveApiKey()
    {
        var configured =
            _configuration["SerpApi:ApiKey"] ??
            _configuration["SERPAPI_API_KEY"] ??
            Environment.GetEnvironmentVariable("SERPAPI_API_KEY");

        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

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
            if (string.Equals(name, key, StringComparison.OrdinalIgnoreCase))
            {
                return trimmed[(separator + 1)..].Trim().Trim('"');
            }
        }

        return null;
    }

    private static List<string> ExtractKeywords(string title, string? snippet) =>
        $"{title} {snippet}"
            .Split(new[] { ' ', ',', '.', ':', ';', '/', '\\', '(', ')', '[', ']' },
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(word => word.Length > 4)
            .Select(word => char.ToUpperInvariant(word[0]) + word[1..].ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(6)
            .ToList();

    private static int? ExtractYear(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var match = System.Text.RegularExpressions.Regex.Match(value, @"\b(19|20)\d{2}\b");
        return match.Success && int.TryParse(match.Value, out var year) ? year : null;
    }

    private static string? GetString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) &&
        value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static int GetInt(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) &&
        value.ValueKind == JsonValueKind.Number &&
        value.TryGetInt32(out var number)
            ? number
            : 0;
}
