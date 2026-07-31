using System.Threading.Tasks;

namespace ScientificJournal.Business.Jobs;

public class RecommendationJob
{
    public Task ExecuteAsync()
    {
        // Background recommendation caching or updates can be executed here
        return Task.CompletedTask;
    }
}
