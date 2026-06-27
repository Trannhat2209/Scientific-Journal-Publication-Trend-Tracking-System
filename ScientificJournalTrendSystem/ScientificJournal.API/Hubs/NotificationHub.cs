using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ScientificJournal.API.Hubs
{
    // SignalR Hub — push thông báo real-time đến client khi có publication mới khớp follow
    // Đăng ký trong Program.cs: app.MapHub<NotificationHub>("/hubs/notifications");
    [Authorize]
    public class NotificationHub : Hub
    {
        // Client kết nối vào Hub — tự động join vào group theo userId
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (userId is not null)
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);

            await base.OnConnectedAsync();
        }

        // Client ngắt kết nối — tự động rời group
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (userId is not null)
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);

            await base.OnDisconnectedAsync(exception);
        }
    }

    // Helper để push notification từ Service mà không cần inject Hub trực tiếp
    public class NotificationPusher
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationPusher(IHubContext<NotificationHub> hubContext)
            => _hubContext = hubContext;

        // Gửi thông báo đến một user cụ thể theo userId
        public async Task PushToUserAsync(string userId, string message, string type)
        {
            await _hubContext.Clients.Group(userId).SendAsync("ReceiveNotification", new
            {
                Message          = message,
                NotificationType = type,
                CreatedAt        = DateTime.UtcNow
            });
        }
    }
}
