using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ScientificJournal.API.Extensions;
using ScientificJournal.Business.Jobs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register SQL database, MongoDB, repositories, business services, and Hangfire
builder.Services.AddApplicationServices(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Enable Hangfire dashboard middleware
app.UseHangfireDashboard();

// Schedule recurring background jobs
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    
    recurringJobManager.AddOrUpdate<SemanticScholarSyncJob>(
        "semantic-scholar-sync",
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
}

app.Run();
