using Hangfire;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ScientificJournal.Business.Services.Implementations;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.API.Services;
using ScientificJournal.Common.Constants;
using ScientificJournal.Business.Validators;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.External;
using ScientificJournal.DataAccess.Mongo;
using ScientificJournal.DataAccess.Repositories.Implementations;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. SQL Database Context & Unit of Work
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection") 
                                 ?? configuration[AppSettings.SqlConnectionString]));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // 2. MongoDB Context & Repository
        services.AddSingleton<MongoDbContext>();
        services.AddScoped<IMongoMetadataRepository, MongoMetadataRepository>();

        // 3. SQL Repositories
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IPublicationRepository, PublicationRepository>();
        services.AddScoped<IKeywordRepository, KeywordRepository>();
        services.AddScoped<ITrendingMetricRepository, TrendingMetricRepository>();
        services.AddScoped<IBookmarkRepository, BookmarkRepository>();
        services.AddScoped<IFollowRepository, FollowRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<ISyncLogRepository, SyncLogRepository>();

        // 4. Business Services
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IBookmarkService, BookmarkService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IExportService, ExportService>();
        services.AddScoped<IFollowService, FollowService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IPublicationService, PublicationService>();
        services.AddScoped<ISyncService, SyncService>();
        services.AddScoped<ITrendingService, TrendingService>();
        services.AddHttpClient<ISerpApiScholarSimilarityService, SerpApiScholarSimilarityService>();
        services.AddHttpClient<SemanticScholarClient>();
        services.AddHttpClient<OpenAlexClient>();
        services.AddHttpClient<SerpApiScholarSearchClient>();
        services.AddHttpClient<PayosMerchantClient>();

        // 4a. FluentValidation validators
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

        // Core Refactoring Services
        services.AddScoped<ISimilarityService, SimilarityService>();
        services.AddScoped<IPlagiarismCheckService, GoogleScholarAiService>();
        services.AddScoped<IRecommendationService, RecommendationService>();
        services.AddScoped<IRelationshipNetworkService, RelationshipNetworkService>();
        services.AddScoped<INotificationHubService, ScientificJournal.API.Services.NotificationHubService>();


        // 5. Hangfire Integration
        if (configuration.GetValue("Hangfire:Enabled", true))
        {
            services.AddHangfire(config => config
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection")
                                     ?? configuration[AppSettings.SqlConnectionString]));

            services.AddHangfireServer();
        }

        return services;
    }
}
