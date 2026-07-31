using System.Net;
using System.Text;
using Microsoft.Extensions.Configuration;
using ScientificJournal.DataAccess.External;
using ScientificJournal.Business.Services.Implementations;

namespace ScientificJournal.AdminTests;

public sealed class ExternalSearchClientTests
{
    [Fact]
    public async Task OpenAlex_client_maps_mocked_publication()
    {
        using var http = new HttpClient(new JsonHandler("""{"results":[{"id":"https://openalex.org/W1","title":"Mock OpenAlex Paper","doi":"https://doi.org/10.1/mock","publication_year":2026,"cited_by_count":7}]}"""));
        var client = new OpenAlexClient(http, new ConfigurationBuilder().Build(), new ExternalApiRateLimiter());
        var results = await client.SearchWorksAsync("mock", 5);
        Assert.Single(results);
        Assert.Equal("Mock OpenAlex Paper", results[0].Title);
        Assert.Equal("OpenAlex", results[0].SourceApi);
    }

    [Fact]
    public async Task OpenAlex_client_retries_429_and_returns_recovered_results()
    {
        using var http = new HttpClient(new OpenAlexRateLimitHandler());
        var client = new OpenAlexClient(http, new ConfigurationBuilder().Build(), new ExternalApiRateLimiter());
        var results = await client.SearchWorksAsync("retry", 5);
        Assert.Single(results);
        Assert.Equal("Recovered OpenAlex Paper", results[0].Title);
    }

    [Fact]
    public async Task SerpApi_client_maps_mocked_scholar_result()
    {
        using var http = new HttpClient(new JsonHandler("""{"organic_results":[{"title":"Mock Scholar Paper","link":"https://example.edu/paper","result_id":"abc","publication_info":{"summary":"A Author - Journal, 2026","authors":[{"name":"A Author"}]}}]}"""));
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["SerpApi:ApiKey"] = "test-key" }).Build();
        var client = new SerpApiScholarSearchClient(http, configuration, new ExternalApiRateLimiter());
        var results = await client.SearchAsync("mock", 5);
        Assert.Single(results);
        Assert.Equal("Mock Scholar Paper", results[0].Title);
        Assert.Equal("Google Scholar", results[0].SourceApi);
    }

    [Fact]
    public async Task Orcid_client_validates_record_against_mocked_registry()
    {
        using var http = new HttpClient(new JsonHandler("{}"));
        var client = new OrcidValidationClient(http);
        Assert.True(await client.IsValidAsync("0000-0002-1825-0097"));
    }

    private sealed class JsonHandler(string json) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
    }

    private sealed class OpenAlexRateLimitHandler : HttpMessageHandler
    {
        private int _attempt;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            _attempt++;
            if (_attempt == 1)
            {
                var limited = new HttpResponseMessage(HttpStatusCode.TooManyRequests);
                limited.Headers.RetryAfter = new System.Net.Http.Headers.RetryConditionHeaderValue(TimeSpan.FromMilliseconds(1));
                return Task.FromResult(limited);
            }
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"results":[{"id":"https://openalex.org/W2","title":"Recovered OpenAlex Paper","publication_year":2026}]}""", Encoding.UTF8, "application/json")
            });
        }
    }
}
