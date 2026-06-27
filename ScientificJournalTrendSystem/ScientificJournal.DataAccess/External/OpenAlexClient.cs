using System.Net.Http;

namespace ScientificJournal.DataAccess.External;

public class OpenAlexClient
{
    private readonly HttpClient _httpClient;

    public OpenAlexClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }
}
