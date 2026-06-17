using System.Threading.Tasks;

namespace ScientificJournal.Business.Jobs;

public class NotificationJob
{
    public Task ExecuteAsync()
    {
        // Background notification processing logic goes here
        return Task.CompletedTask;
    }
}
