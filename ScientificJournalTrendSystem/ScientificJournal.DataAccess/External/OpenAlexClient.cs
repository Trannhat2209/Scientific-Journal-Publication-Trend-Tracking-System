using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace ScientificJournal.DataAccess.External;

public class OpenAlexClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public OpenAlexClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(8);
        _configuration = configuration;
    }

    public async Task<IReadOnlyList<ExternalPublication>> SearchWorksAsync(
        string query,
        int maxResults = 20,
        CancellationToken cancellationToken = default)
    {
        var searchTerm = string.IsNullOrWhiteSpace(query)
            ? "artificial intelligence"
            : query.Trim();
        var perPage = Math.Clamp(maxResults, 1, 50);
        var queryParams = new List<string>
        {
            $"search={Uri.EscapeDataString(searchTerm)}",
            $"per-page={perPage}",
            "sort=cited_by_count:desc",
            "mailto=research@scholartrend.local"
        };
        var apiKey = ResolveApiKey();
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            queryParams.Add($"api_key={Uri.EscapeDataString(apiKey)}");
        }

        var url = "https://api.openalex.org/works?" + string.Join("&", queryParams);

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("ScholarTrend/1.0 (mailto:research@scholartrend.local)");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(json);
        if (!document.RootElement.TryGetProperty("results", out var results) ||
            results.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<ExternalPublication>();
        }

        return results.EnumerateArray()
            .Select(MapWork)
            .Where(item => !string.IsNullOrWhiteSpace(item.Title))
            .ToList();
    }

    private static ExternalPublication MapWork(JsonElement work)
    {
        var title = GetString(work, "title") ?? GetString(work, "display_name") ?? string.Empty;
        var doi = NormalizeDoi(GetString(work, "doi"));
        var year = GetInt(work, "publication_year");
        var citationCount = GetInt(work, "cited_by_count");
        var abstractText = BuildAbstract(work);
        var journalName = GetOpenAlexSourceName(work);
        var authors = GetAuthors(work).Take(8).ToList();
        var keywords = GetConcepts(work).Take(8).ToList();

        return new ExternalPublication
        {
            Title = title,
            Abstract = abstractText,
            Year = year,
            DOI = doi,
            SourceApi = "OpenAlex",
            JournalName = string.IsNullOrWhiteSpace(journalName)
                ? "OpenAlex"
                : $"OpenAlex - {journalName}",
            CitationCount = citationCount,
            Authors = authors,
            Keywords = keywords,
            RawJson = work.GetRawText()
        };
    }

    private static string? BuildAbstract(JsonElement work)
    {
        if (!work.TryGetProperty("abstract_inverted_index", out var index) ||
            index.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        var tokens = new SortedDictionary<int, string>();
        foreach (var property in index.EnumerateObject())
        {
            if (property.Value.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var position in property.Value.EnumerateArray())
            {
                if (position.TryGetInt32(out var slot))
                {
                    tokens[slot] = property.Name;
                }
            }
        }

        return tokens.Count == 0 ? null : string.Join(" ", tokens.Values);
    }

    private static string GetOpenAlexSourceName(JsonElement work)
    {
        if (work.TryGetProperty("primary_location", out var primaryLocation) &&
            primaryLocation.ValueKind == JsonValueKind.Object &&
            primaryLocation.TryGetProperty("source", out var source) &&
            source.ValueKind == JsonValueKind.Object)
        {
            return GetString(source, "display_name") ?? string.Empty;
        }

        if (work.TryGetProperty("locations", out var locations) &&
            locations.ValueKind == JsonValueKind.Array)
        {
            foreach (var location in locations.EnumerateArray())
            {
                if (location.TryGetProperty("source", out var locationSource) &&
                    locationSource.ValueKind == JsonValueKind.Object)
                {
                    var name = GetString(locationSource, "display_name");
                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        return name;
                    }
                }
            }
        }

        return string.Empty;
    }

    private static IEnumerable<string> GetAuthors(JsonElement work)
    {
        if (!work.TryGetProperty("authorships", out var authorships) ||
            authorships.ValueKind != JsonValueKind.Array)
        {
            yield break;
        }

        foreach (var authorship in authorships.EnumerateArray())
        {
            if (authorship.TryGetProperty("author", out var author) &&
                author.ValueKind == JsonValueKind.Object)
            {
                var name = GetString(author, "display_name");
                if (!string.IsNullOrWhiteSpace(name))
                {
                    yield return name;
                }
            }
        }
    }

    private static IEnumerable<string> GetConcepts(JsonElement work)
    {
        if (!work.TryGetProperty("concepts", out var concepts) ||
            concepts.ValueKind != JsonValueKind.Array)
        {
            yield break;
        }

        foreach (var concept in concepts.EnumerateArray())
        {
            var name = GetString(concept, "display_name");
            if (!string.IsNullOrWhiteSpace(name))
            {
                yield return name;
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

    private static string NormalizeDoi(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return value
            .Replace("https://doi.org/", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Trim();
    }

    private string ResolveApiKey()
    {
        var configured =
            _configuration["OpenAlex:ApiKey"] ??
            _configuration["OPENALEX_API_KEY"] ??
            Environment.GetEnvironmentVariable("OPENALEX_API_KEY");

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
                var value = ReadEnvValue(envPath, "OPENALEX_API_KEY");
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
}
