using System.Net;

namespace ScientificJournal.Business.Services.Implementations;

public sealed class OrcidValidationClient
{
    private readonly HttpClient _httpClient;
    public OrcidValidationClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress ??= new Uri("https://pub.orcid.org/v3.0/");
        _httpClient.Timeout = TimeSpan.FromSeconds(8);
        _httpClient.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    }

    public async Task<bool> IsValidAsync(string orcid, CancellationToken cancellationToken = default)
    {
        var normalized = orcid.Trim().Replace("https://orcid.org/", string.Empty, StringComparison.OrdinalIgnoreCase);
        try
        {
            using var response = await _httpClient.GetAsync($"{Uri.EscapeDataString(normalized)}/person", cancellationToken);
            return response.StatusCode == HttpStatusCode.OK;
        }
        catch (HttpRequestException) { return false; }
        catch (TaskCanceledException) { return false; }
    }
}
