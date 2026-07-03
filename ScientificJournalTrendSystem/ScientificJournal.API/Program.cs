using System.Text;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ScientificJournal.API.Extensions;
using ScientificJournal.API.Filters;
using ScientificJournal.Business.Jobs;
using ScientificJournal.Common.Configurations;
using ScientificJournal.Common.Policies;
using System.Text.Json.Serialization;
using Microsoft.IdentityModel.Tokens;

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

        recurringJobManager.AddOrUpdate<SemanticScholarSyncJob>(
            "semantic-scholar-sync",
            job => job.ExecuteAsync(),
            Cron.Daily);

        recurringJobManager.AddOrUpdate<OpenAlexSyncJob>(
            "openalex-sync",
            job => job.ExecuteAsync(),
            Cron.Daily);

        recurringJobManager.AddOrUpdate<RecommendationJob>(
            "recommendation-processing",
            job => job.ExecuteAsync(),
            Cron.Daily);

        recurringJobManager.AddOrUpdate<NotificationJob>(
            "notification-processing",
            job => job.ExecuteAsync(),
            Cron.Hourly);

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

