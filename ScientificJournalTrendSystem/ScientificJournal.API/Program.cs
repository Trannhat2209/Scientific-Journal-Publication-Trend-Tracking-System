using System.Text;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ScientificJournal.API.Extensions;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Jobs;
using ScientificJournal.Common.Configurations;
using ScientificJournal.Common.Policies;
using ScientificJournal.DataAccess.Context;
using System.Text.Json.Serialization;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using ScientificJournal.DataAccess.External;

LoadDotEnvFromWorkspace();

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(builder.Environment.ContentRootPath, "App_Data", "DataProtectionKeys")));

// Add services to the container.
builder.Services.AddControllers(options => options.Filters.Add(new ValidateModelFilter()))
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Scientific Journal Trend System API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
builder.Services.AddSignalR();

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
var jwtKey = Encoding.UTF8.GetBytes(jwtSettings.Secret);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Register SQL database, MongoDB, repositories, business services, and Hangfire
builder.Services.AddApplicationServices(builder.Configuration);
var hangfireEnabled = builder.Configuration.GetValue("Hangfire:Enabled", true);

var app = builder.Build();
PlanPolicy.LoadFromFile(Path.Combine(app.Environment.ContentRootPath, "App_Data", "plan-policy.json"));
await EnsurePublicationSourceUrlColumnAsync(app);

app.UseMiddleware<ScientificJournal.API.Middleware.ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();
app.UseAuthentication();
app.UseMiddleware<ScientificJournal.API.Middleware.SystemAuditMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ScientificJournal.API.Hubs.NotificationHub>("/notificationHub");


if (hangfireEnabled)
{
    // Enable Hangfire dashboard middleware
    app.UseHangfireDashboard("/hangfire", new Hangfire.DashboardOptions
    {
        Authorization = new[] { new ScientificJournal.API.Middleware.HangfireAuthorizationFilter() }
    });

    // Schedule recurring background jobs
    using (var scope = app.Services.CreateScope())
    {
        var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var externalRateLimiter = scope.ServiceProvider.GetRequiredService<ExternalApiRateLimiter>();
        var savedSyncConfig = await context.AdminStates.AsNoTracking()
            .FirstOrDefaultAsync(state => state.StateKey == "sync-config");
        var syncCron = Cron.Daily();
        var semanticEnabled = true;
        var openAlexEnabled = true;
        if (savedSyncConfig != null)
        {
            using var configDocument = JsonDocument.Parse(savedSyncConfig.JsonValue);
            var configRoot = configDocument.RootElement;
            if (configRoot.TryGetProperty("cron", out var cronValue) && !string.IsNullOrWhiteSpace(cronValue.GetString()))
                syncCron = cronValue.GetString()!;
            if (configRoot.TryGetProperty("rateLimit", out var rateValue) && rateValue.TryGetInt32(out var savedRateLimit))
                externalRateLimiter.Configure(savedRateLimit);
            if (configRoot.TryGetProperty("sources", out var sources))
            {
                if (sources.TryGetProperty("semantic", out var semantic)) semanticEnabled = semantic.GetBoolean();
                if (sources.TryGetProperty("openAlex", out var openAlex)) openAlexEnabled = openAlex.GetBoolean();
            }
        }

        if (semanticEnabled)
            recurringJobManager.AddOrUpdate<SemanticScholarSyncJob>("semantic-scholar-sync", job => job.ExecuteAsync(), syncCron);
        else
            recurringJobManager.RemoveIfExists("semantic-scholar-sync");

        if (openAlexEnabled)
            recurringJobManager.AddOrUpdate<OpenAlexSyncJob>("openalex-sync", job => job.ExecuteAsync(), syncCron);
        else
            recurringJobManager.RemoveIfExists("openalex-sync");

        recurringJobManager.AddOrUpdate<RecommendationJob>(
            "recommendation-processing",
            job => job.ExecuteAsync(),
            Cron.Daily);

        recurringJobManager.AddOrUpdate<TrendRecalculateJob>(
            "weekly-trend-recalculate",
            job => job.ExecuteAsync(),
            Cron.Weekly);
    }
}

app.Run();

static void LoadDotEnvFromWorkspace()
{
    var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (directory != null)
    {
        var envPath = Path.Combine(directory.FullName, ".env");
        if (File.Exists(envPath))
        {
            foreach (var rawLine in File.ReadAllLines(envPath))
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#", StringComparison.Ordinal))
                {
                    continue;
                }

                var separatorIndex = line.IndexOf('=');
                if (separatorIndex <= 0)
                {
                    continue;
                }

                var key = line[..separatorIndex].Trim();
                var value = line[(separatorIndex + 1)..].Trim().Trim('"', '\'');
                if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
                {
                    Environment.SetEnvironmentVariable(key, value);
                }
            }

            return;
        }

        directory = directory.Parent;
    }
}

static async Task EnsurePublicationSourceUrlColumnAsync(WebApplication app)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await context.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH('publications', 'source_url') IS NULL
            BEGIN
                ALTER TABLE publications ADD source_url NVARCHAR(1000) NULL
            END
            """);
        await context.Database.ExecuteSqlRawAsync("""
            UPDATE publications
            SET source_url = CONCAT(N'https://scholar.google.com/scholar?q=', title)
            WHERE source_api = N'Google Scholar'
              AND (source_url IS NULL OR source_url = N'' OR source_url LIKE N'%google-scholar:%' OR doi LIKE N'google-scholar:%')
            """);
        await context.Database.ExecuteSqlRawAsync("""
            UPDATE publications
            SET source_url = CONCAT(N'https://www.researchgate.net/search/publication?q=', title)
            WHERE source_api = N'ResearchGate'
              AND (source_url IS NULL OR source_url = N'' OR source_url LIKE N'%researchgate:%' OR doi LIKE N'researchgate:%')
            """);
        await context.Database.ExecuteSqlRawAsync("""
            UPDATE publications
            SET source_url = CONCAT(N'https://openalex.org/search?q=', title)
            WHERE source_api = N'OpenAlex'
              AND (source_url IS NULL OR source_url = N'' OR source_url LIKE N'%openalex:%')
            """);
    }
    catch (Exception exception)
    {
        app.Logger.LogWarning(exception, "Could not ensure publications.source_url column exists.");
    }
}

