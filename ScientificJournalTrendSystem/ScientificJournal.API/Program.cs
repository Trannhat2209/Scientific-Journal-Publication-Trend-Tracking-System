using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using ScientificJournal.API.Extensions;
using ScientificJournal.API.Middleware;
using ScientificJournal.DataAccess.Context;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ───────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ── Swagger ───────────────────────────────────────────────────
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Scientific Journal Trend System API",
        Version     = "v1",
        Description = "API for managing scientific publications, bookmarks, follows, and notifications"
    });
});

// ── Database ──────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseInMemoryDatabase("ScientificJournalDb"));

// ── DI - đăng ký toàn bộ service và repository của BE3 ───────
builder.Services.AddBE3Services();

// ── Build app ─────────────────────────────────────────────────
var app = builder.Build();

// ── Middleware pipeline - thứ tự quan trọng ───────────────────
// ExceptionHandling phải đứng đầu để bắt lỗi từ tất cả middleware phía sau
app.UseExceptionHandling();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Scientific Journal API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── SignalR Hub ───────────────────────────────────────────────
app.MapHub<ScientificJournal.API.Hubs.NotificationHub>("/hubs/notifications");

Console.WriteLine("\n✓ Application started. Press Ctrl+C to shut down.");
app.Run();
