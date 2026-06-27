using ScientificJournal.API.Hubs;
using ScientificJournal.Business.Jobs;
using ScientificJournal.Business.Services.Implementations;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Repositories.Implementations;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.API.Extensions
{
    // Đăng ký toàn bộ dependency injection cho BE3 vào DI container
    // Gọi trong Program.cs: builder.Services.AddBE3Services();
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddBE3Services(this IServiceCollection services)
        {
            // ── Repositories ──────────────────────────────────────────────
            services.AddScoped<IBookmarkRepository,     BookmarkRepository>();
            services.AddScoped<IFollowRepository,       FollowRepository>();
            services.AddScoped<INotificationRepository, NotificationRepository>();
            services.AddScoped<ISyncLogRepository,      SyncLogRepository>();
            services.AddScoped<IUserRepository,         UserRepository>();
            services.AddScoped<IStatisticsRepository,   StatisticsRepository>();

            // ── Services ──────────────────────────────────────────────────
            services.AddScoped<IBookmarkService,        BookmarkService>();
            services.AddScoped<IFollowService,          FollowService>();
            services.AddScoped<INotificationService,    NotificationService>();
            services.AddScoped<ISyncService,            SyncService>();
            services.AddScoped<IAdminService,           AdminService>();

            // ── SignalR ───────────────────────────────────────────────────
            services.AddSignalR();
            services.AddScoped<NotificationPusher>();

            // ── Hangfire Job ──────────────────────────────────────────────
            services.AddScoped<SyncJob>();

            return services;
        }
    }
}
