using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace ScientificJournal.DataAccess.External;

public class SemanticScholarClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ExternalApiRateLimiter _rateLimiter;

    public SemanticScholarClient(HttpClient httpClient, IConfiguration configuration, ExternalApiRateLimiter rateLimiter)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(12);
        _configuration = configuration;
        _rateLimiter = rateLimiter;
    }

    public async Task<IReadOnlyList<ExternalPublication>> SearchAsync(
        string query,
        int maxResults = 20,
        CancellationToken cancellationToken = default)
    {
        var searchTerm = string.IsNullOrWhiteSpace(query)
            ? "artificial intelligence"
            : query.Trim();
        var limit = Math.Clamp(maxResults, 1, 100);
        var fields = string.Join(
            ",",
            "paperId",
            "title",
            "abstract",
            "year",
            "citationCount",
            "authors",
            "journal",
            "venue",
            "publicationVenue",
            "externalIds",
            "fieldsOfStudy",
            "s2FieldsOfStudy",
            "tldr",
            "url");
        var url =
            "https://api.semanticscholar.org/graph/v1/paper/search" +
            $"?query={Uri.EscapeDataString(searchTerm)}" +
            $"&limit={limit}" +
            $"&fields={Uri.EscapeDataString(fields)}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("ScholarTrend/1.0");

        var apiKey = ResolveApiKey();
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            request.Headers.TryAddWithoutValidation("x-api-key", apiKey);
        }

        await _rateLimiter.WaitAsync("SemanticScholar", cancellationToken);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return Array.Empty<ExternalPublication>();
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(json);
        if (!document.RootElement.TryGetProperty("data", out var data) ||
            data.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<ExternalPublication>();
        }

        return data.EnumerateArray()
            .Select(MapPaper)
            .Where(item => !string.IsNullOrWhiteSpace(item.Title))
            .ToList();
    }

    private static ExternalPublication MapPaper(JsonElement paper)
    {
        var title = GetString(paper, "title") ?? string.Empty;
        var abstractText = GetString(paper, "abstract") ?? GetTldrText(paper);
        var year = GetInt(paper, "year");
        var citationCount = GetInt(paper, "citationCount");
        var doi = GetDoi(paper);
        var venue = GetVenueName(paper);
        var paperId = GetString(paper, "paperId");
        var sourceUrl = GetString(paper, "url");

        return new ExternalPublication
        {
            Title = title,
            Abstract = abstractText,
            Year = year,
            DOI = string.IsNullOrWhiteSpace(doi)
                ? (string.IsNullOrWhiteSpace(paperId) ? string.Empty : $"semanticscholar:{paperId}")
                : doi,
            SourceUrl = string.IsNullOrWhiteSpace(sourceUrl) && !string.IsNullOrWhiteSpace(paperId)
                ? $"https://www.semanticscholar.org/paper/{paperId}"
                : sourceUrl,
            SourceApi = "Semantic Scholar",
            JournalName = string.IsNullOrWhiteSpace(venue)
                ? "Semantic Scholar"
                : $"Semantic Scholar - {venue}",
            Publisher = "Semantic Scholar",
            CitationCount = citationCount,
            Authors = GetAuthors(paper).Take(8).ToList(),
            Keywords = GetKeywords(paper).Take(8).ToList(),
            RawJson = paper.GetRawText()
        };
    }

    private string ResolveApiKey()
    {
        var configured =
            _configuration["SemanticScholar:ApiKey"] ??
            _configuration["SEMANTIC_SCHOLAR_API_KEY"] ??
            Environment.GetEnvironmentVariable("SEMANTIC_SCHOLAR_API_KEY");

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
                var value = ReadEnvValue(envPath, "SEMANTIC_SCHOLAR_API_KEY");
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

    private static string? GetDoi(JsonElement paper)
    {
        if (paper.TryGetProperty("externalIds", out var externalIds) &&
            externalIds.ValueKind == JsonValueKind.Object)
        {
            return GetString(externalIds, "DOI");
        }

        return null;
    }

    private static string? GetTldrText(JsonElement paper)
    {
        if (paper.TryGetProperty("tldr", out var tldr) &&
            tldr.ValueKind == JsonValueKind.Object)
        {
            return GetString(tldr, "text");
        }

        return null;
    }

    private static string GetVenueName(JsonElement paper)
    {
        if (paper.TryGetProperty("publicationVenue", out var publicationVenue) &&
            publicationVenue.ValueKind == JsonValueKind.Object)
        {
            var name = GetString(publicationVenue, "name");
            if (!string.IsNullOrWhiteSpace(name))
            {
                return name;
            }
        }

        if (paper.TryGetProperty("journal", out var journal) &&
            journal.ValueKind == JsonValueKind.Object)
        {
            var name = GetString(journal, "name");
            if (!string.IsNullOrWhiteSpace(name))
            {
                return name;
            }
        }

        return GetString(paper, "venue") ?? string.Empty;
    }

    private static IEnumerable<string> GetAuthors(JsonElement paper)
    {
        if (!paper.TryGetProperty("authors", out var authors) ||
            authors.ValueKind != JsonValueKind.Array)
        {
            yield break;
        }

        foreach (var author in authors.EnumerateArray())
        {
            var name = GetString(author, "name");
            if (!string.IsNullOrWhiteSpace(name))
            {
                yield return name;
            }
        }
    }

    private static IEnumerable<string> GetKeywords(JsonElement paper)
    {
        if (paper.TryGetProperty("fieldsOfStudy", out var fieldsOfStudy) &&
            fieldsOfStudy.ValueKind == JsonValueKind.Array)
        {
            foreach (var field in fieldsOfStudy.EnumerateArray())
            {
                if (field.ValueKind == JsonValueKind.String &&
                    !string.IsNullOrWhiteSpace(field.GetString()))
                {
                    yield return field.GetString()!;
                }
            }
        }

        if (!paper.TryGetProperty("s2FieldsOfStudy", out var s2Fields) ||
            s2Fields.ValueKind != JsonValueKind.Array)
        {
            yield break;
        }

        foreach (var field in s2Fields.EnumerateArray())
        {
            if (field.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var category = GetString(field, "category");
            if (!string.IsNullOrWhiteSpace(category))
            {
                yield return category;
            }
        }
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
