using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;

namespace ScientificJournal.DataAccess.External;

public sealed class CrossrefClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ExternalApiRateLimiter _rateLimiter;

    public CrossrefClient(HttpClient httpClient, IConfiguration configuration, ExternalApiRateLimiter rateLimiter)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
        _configuration = configuration;
        _rateLimiter = rateLimiter;
    }

    public async Task<IReadOnlyList<ExternalPublication>> SearchAsync(string query, int maxResults = 20, CancellationToken cancellationToken = default)
    {
        var term = string.IsNullOrWhiteSpace(query) ? "artificial intelligence" : query.Trim();
        var url = $"https://api.crossref.org/works?query.bibliographic={Uri.EscapeDataString(term)}&rows={Math.Clamp(maxResults, 1, 100)}";
        var mailto = _configuration["Crossref:Mailto"] ?? _configuration["CROSSREF_MAILTO"] ?? Environment.GetEnvironmentVariable("CROSSREF_MAILTO");
        if (!string.IsNullOrWhiteSpace(mailto)) url += $"&mailto={Uri.EscapeDataString(mailto)}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("ScholarTrend/1.0 (scientific-journal-trend-system)");
        await _rateLimiter.WaitAsync("Crossref", cancellationToken);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return Array.Empty<ExternalPublication>();

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        if (!document.RootElement.TryGetProperty("message", out var message) ||
            !message.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
            return Array.Empty<ExternalPublication>();

        return items.EnumerateArray().Select(MapWork).Where(item => !string.IsNullOrWhiteSpace(item.Title)).ToList();
    }

    private static ExternalPublication MapWork(JsonElement work)
    {
        var doi = GetString(work, "DOI") ?? string.Empty;
        return new ExternalPublication
        {
            Title = FirstString(work, "title") ?? string.Empty,
            Abstract = CleanMarkup(GetString(work, "abstract")),
            Year = GetYear(work), DOI = doi,
            SourceUrl = GetString(work, "URL") ?? (!string.IsNullOrWhiteSpace(doi) ? $"https://doi.org/{Uri.EscapeDataString(doi)}" : null),
            SourceApi = "Crossref",
            JournalName = FirstString(work, "container-title") ?? "Crossref",
            Publisher = GetString(work, "publisher") ?? "Crossref",
            CitationCount = GetInt(work, "is-referenced-by-count"),
            Authors = GetAuthors(work).Take(8).ToList(),
            Keywords = GetStringArray(work, "subject").Take(8).ToList(),
            RawJson = work.GetRawText()
        };
    }

    private static int GetYear(JsonElement work)
    {
        foreach (var name in new[] { "published-print", "published-online", "published", "issued" })
            if (work.TryGetProperty(name, out var date) && date.TryGetProperty("date-parts", out var parts) &&
                parts.ValueKind == JsonValueKind.Array && parts.GetArrayLength() > 0 && parts[0].GetArrayLength() > 0 &&
                parts[0][0].TryGetInt32(out var year)) return year;
        return 0;
    }

    private static IEnumerable<string> GetAuthors(JsonElement work)
    {
        if (!work.TryGetProperty("author", out var authors) || authors.ValueKind != JsonValueKind.Array) yield break;
        foreach (var author in authors.EnumerateArray())
        {
            var name = string.Join(" ", new[] { GetString(author, "given"), GetString(author, "family") }.Where(x => !string.IsNullOrWhiteSpace(x)));
            if (!string.IsNullOrWhiteSpace(name)) yield return name;
        }
    }

    private static IEnumerable<string> GetStringArray(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var values) || values.ValueKind != JsonValueKind.Array) yield break;
        foreach (var value in values.EnumerateArray())
            if (value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(value.GetString())) yield return value.GetString()!;
    }

    private static string? FirstString(JsonElement element, string name) => GetStringArray(element, name).FirstOrDefault();
    private static string? GetString(JsonElement element, string name) => element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    private static int GetInt(JsonElement element, string name) => element.TryGetProperty(name, out var value) && value.TryGetInt32(out var number) ? number : 0;
    private static string? CleanMarkup(string? value) => string.IsNullOrWhiteSpace(value) ? value : WebUtility.HtmlDecode(Regex.Replace(value, "<[^>]+>", " ")).Trim();
}
