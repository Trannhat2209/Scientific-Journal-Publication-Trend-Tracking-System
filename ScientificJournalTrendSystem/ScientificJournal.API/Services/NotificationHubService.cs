using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using ScientificJournal.API.Hubs;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.API.Services;

public class NotificationHubService : INotificationHubService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationHubService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(string userId, object payload)
    {
        await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification", payload);
    }
}
