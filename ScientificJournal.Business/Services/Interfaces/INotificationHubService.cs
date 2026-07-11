using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public interface INotificationHubService
{
    Task SendNotificationAsync(string userId, object payload);
}
