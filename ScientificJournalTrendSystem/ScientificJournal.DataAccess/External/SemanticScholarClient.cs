using System.Net.Http;

namespace ScientificJournal.DataAccess.External;

public class SemanticScholarClient
{
    private readonly HttpClient _httpClient;

    public SemanticScholarClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }
}
