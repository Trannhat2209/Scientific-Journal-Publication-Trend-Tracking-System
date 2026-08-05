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

    [Fact]
    public async Task Crossref_client_maps_complete_publication_metadata()
    {
        const string json = """{"message":{"items":[{"DOI":"10.1000/test","title":["Crossref Paper"],"abstract":"<jats:p>Useful abstract</jats:p>","published":{"date-parts":[[2025]]},"container-title":["Test Journal"],"publisher":"Test Publisher","is-referenced-by-count":12,"author":[{"given":"Ada","family":"Lovelace"}],"subject":["Computing"]}]}}""";
        using var http = new HttpClient(new JsonHandler(json));
        var client = new CrossrefClient(http, new ConfigurationBuilder().Build(), new ExternalApiRateLimiter());

        var results = await client.SearchAsync("computing", 5);

        var paper = Assert.Single(results);
        Assert.Equal("Crossref Paper", paper.Title);
        Assert.Equal("10.1000/test", paper.DOI);
        Assert.Equal("Useful abstract", paper.Abstract);
        Assert.Equal("Ada Lovelace", Assert.Single(paper.Authors));
        Assert.Equal("Crossref", paper.SourceApi);
    }

    [Fact]
    public async Task Connected_papers_resolves_doi_and_maps_graph()
    {
        using var http = new HttpClient(new ConnectedPapersHandler());
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectedPapers:ApiKey"] = "test-key",
            ["ConnectedPapers:BaseUrl"] = "https://connected.test"
        }).Build();
        var client = new ConnectedPapersClient(http, configuration, new ExternalApiRateLimiter());

        var graph = await client.GetGraphAsync("10.1000/test", "Test paper");

        Assert.NotNull(graph);
        Assert.Equal("S1", graph.StartId);
        Assert.Equal(2, graph.Nodes.Count);
        Assert.Single(graph.Edges);
        Assert.Equal("A", graph.Edges[0].Source);
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

    private sealed class ConnectedPapersHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var json = request.RequestUri!.Host == "api.semanticscholar.org"
                ? """{"paperId":"S1"}"""
                : """{"status":"FRESH_GRAPH","graph_json":{"start_id":"S1","nodes":{"A":{"id":"A","title":"Paper A","year":2024},"B":{"id":"B","title":"Paper B","year":2023}},"edges":[["A","B",0.8]]}}""";
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
        }
    }
}
