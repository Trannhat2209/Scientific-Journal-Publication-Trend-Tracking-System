using System.Text.Json;
using Microsoft.Extensions.Configuration;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Publication;
using ScientificJournal.Common.DTOs.Response.Publication;
using ScientificJournal.DataAccess.External;

namespace ScientificJournal.Business.Services.Implementations;

public class SerpApiScholarSimilarityService : ISerpApiScholarSimilarityService
{
    private const int SimilarityLimitPercent = 50;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ExternalApiRateLimiter _rateLimiter;

    public SerpApiScholarSimilarityService(HttpClient httpClient, IConfiguration configuration, ExternalApiRateLimiter rateLimiter)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _rateLimiter = rateLimiter;
    }

    public async Task<PublicationSimilarityCheckResponseDto> CheckSimilarityAsync(
        PublicationSimilarityCheckRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title) && string.IsNullOrWhiteSpace(request.Abstract))
        {
            throw new ArgumentException("Title or abstract is required for similarity checking.");
        }

        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("SERPAPI_API_KEY is not configured.");
        }

        var query = BuildScholarQuery(request);
        var maxResults = Math.Clamp(request.MaxResults <= 0 ? 10 : request.MaxResults, 1, 20);
        var url =
            "https://serpapi.com/search.json" +
            $"?engine=google_scholar&q={Uri.EscapeDataString(query)}" +
            $"&num={maxResults}&api_key={Uri.EscapeDataString(apiKey)}";

        await _rateLimiter.WaitAsync("SerpApi", cancellationToken);
        using var response = await _httpClient.GetAsync(url, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"SerpApi request failed: {(int)response.StatusCode}");
        }

        using var document = JsonDocument.Parse(json);
        if (document.RootElement.TryGetProperty("error", out var errorElement))
        {
            throw new InvalidOperationException(errorElement.GetString() ?? "SerpApi returned an error.");
        }

        var candidates = ParseCandidates(document.RootElement)
            .Select(candidate => new PublicationSimilarityCandidateDto
            {
                Title = candidate.Title,
                Source = candidate.Source,
                Link = candidate.Link,
                Snippet = candidate.Snippet,
                SimilarityPercent = CalculateSimilarityPercent(request, candidate),
                SegmentMatches = FindSegmentMatches(request, candidate)
            })
            .OrderByDescending(candidate => candidate.SimilarityPercent)
            .Take(maxResults)
            .ToList();

        var best = candidates.FirstOrDefault();
        var percent = best?.SimilarityPercent ?? 0;
        var overLimit = percent > SimilarityLimitPercent;

        return new PublicationSimilarityCheckResponseDto
        {
            SimilarityPercent = percent,
            LimitPercent = SimilarityLimitPercent,
            OverLimit = overLimit,
            MatchedTitle = best?.Title ?? "No Google Scholar match found",
            MatchedSource = best?.Source ?? "SerpApi Google Scholar",
            MatchedLink = best?.Link,
            Decision = overLimit
                ? "Auto cancelled: over 50% similarity rule."
                : "Within rule: waiting for admin approval.",
            Candidates = candidates
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
            if (!string.Equals(name, key, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return trimmed[(separator + 1)..].Trim().Trim('"');
        }

        return null;
    }

    private static string BuildScholarQuery(PublicationSimilarityCheckRequestDto request)
    {
        var keywordPart = string.IsNullOrWhiteSpace(request.Keywords)
            ? string.Empty
            : $" {request.Keywords}";
        return $"{request.Title}{keywordPart}".Trim();
    }

    private static IEnumerable<ScholarCandidate> ParseCandidates(JsonElement root)
    {
        if (!root.TryGetProperty("organic_results", out var results) ||
            results.ValueKind != JsonValueKind.Array)
        {
            yield break;
        }

        foreach (var item in results.EnumerateArray())
        {
            var title = GetString(item, "title");
            if (string.IsNullOrWhiteSpace(title))
            {
                continue;
            }

            var snippet = GetString(item, "snippet") ?? string.Empty;
            var link = GetString(item, "link");
            var source = "SerpApi Google Scholar";
            if (item.TryGetProperty("publication_info", out var publicationInfo))
            {
                var summary = GetString(publicationInfo, "summary");
                if (!string.IsNullOrWhiteSpace(summary))
                {
                    source = summary;
                }
            }

            yield return new ScholarCandidate(title, snippet, source, link);
        }
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var value) &&
               value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static int CalculateSimilarityPercent(
        PublicationSimilarityCheckRequestDto request,
        ScholarCandidate candidate)
    {
        var titleScore = Jaccard(request.Title, candidate.Title);
        var abstractScore = Jaccard(request.Abstract ?? string.Empty, $"{candidate.Snippet} {candidate.Source}");
        var keywordScore = Jaccard(request.Keywords ?? string.Empty, $"{candidate.Title} {candidate.Snippet}");
        var weighted = titleScore * 0.45 + abstractScore * 0.4 + keywordScore * 0.15;
        return (int)Math.Round(weighted * 100, MidpointRounding.AwayFromZero);
    }

    private static double Jaccard(string left, string right)
    {
        var leftSet = Tokenize(left);
        var rightSet = Tokenize(right);
        if (leftSet.Count == 0 || rightSet.Count == 0)
        {
            return 0;
        }

        var intersection = leftSet.Count(rightSet.Contains);
        var union = leftSet.Count + rightSet.Count - intersection;
        return union == 0 ? 0 : (double)intersection / union;
    }

    private static List<PublicationSimilaritySegmentDto> FindSegmentMatches(
        PublicationSimilarityCheckRequestDto request,
        ScholarCandidate candidate)
    {
        var submittedSegments = SplitSegments($"{request.Title}. {request.Abstract}");
        var sourceSegments = SplitSegments($"{candidate.Title}. {candidate.Snippet}");
        return submittedSegments
            .SelectMany(submitted => sourceSegments.Select(source => new PublicationSimilaritySegmentDto
            {
                SubmittedText = submitted,
                SourceText = source,
                SimilarityPercent = (int)Math.Round(Jaccard(submitted, source) * 100, MidpointRounding.AwayFromZero)
            }))
            .Where(match => match.SimilarityPercent >= 15)
            .OrderByDescending(match => match.SimilarityPercent)
            .DistinctBy(match => match.SubmittedText)
            .Take(5)
            .ToList();
    }

    private static List<string> SplitSegments(string value) => value
        .Split(['.', '!', '?', '\n', '\r'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Where(segment => Tokenize(segment).Count >= 3)
        .Take(30)
        .ToList();

    private static HashSet<string> Tokenize(string value)
    {
        var normalized = new string(value.ToLowerInvariant()
            .Select(character => char.IsLetterOrDigit(character) ? character : ' ')
            .ToArray());

        return normalized
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(word => word.Length > 2)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private sealed record ScholarCandidate(
        string Title,
        string Snippet,
        string Source,
        string? Link);
}
