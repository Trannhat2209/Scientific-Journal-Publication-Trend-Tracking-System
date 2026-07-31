using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Helpers;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.AdminTests;

public sealed class ApiAuthorizationIntegrationTests : IClassFixture<ScholarTrendApiFactory>
{
    private readonly ScholarTrendApiFactory _factory;
    public ApiAuthorizationIntegrationTests(ScholarTrendApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("/api/publications/search?keyword=ai")]
    [InlineData("/api/publications/statistics")]
    [InlineData("/api/publication-reviews?publicationKey=paper-1")]
    public async Task Anonymous_academic_requests_return_401(string path)
    {
        using var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path)).StatusCode);
    }

    [Theory]
    [InlineData("pending")]
    [InlineData("rejected")]
    public async Task Unverified_user_cannot_search_or_post_review(string verificationStatus)
    {
        using var client = await _factory.CreateAuthenticatedClientAsync(verificationStatus);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/publications/search?keyword=ai")).StatusCode);
        var response = await client.PostAsJsonAsync("/api/publication-reviews", new
        {
            publicationKey = "paper-1", publicationTitle = "Paper", credibilityRating = 4, comment = "Useful review"
        });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Verified_student_cannot_call_researcher_or_lecturer_report_api()
    {
        using var client = await _factory.CreateAuthenticatedClientAsync("verified");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/dashboard/report-preview?keyword=ai")).StatusCode);
    }

    [Fact]
    public async Task Admin_reject_keeps_role_and_only_matching_pending_role_can_be_approved()
    {
        var rejected = await _factory.CreateAuthenticatedSessionAsync(UserRole.Student, "pending", UserRole.Lecturer.ToString());
        using var admin = (await _factory.CreateAuthenticatedSessionAsync(UserRole.Admin, "verified")).Client;
        var rejectResponse = await admin.PutAsJsonAsync($"/api/admin/users/{rejected.UserId}", new
        {
            fullName = "Integration User", email = rejected.Email, role = "Student", isActive = true, verificationStatus = "rejected"
        });
        Assert.Equal(HttpStatusCode.OK, rejectResponse.StatusCode);
        await using (var scope = _factory.Services.CreateAsyncScope())
            Assert.Equal(UserRole.Student, (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users.FindAsync(rejected.UserId))!.Role);

        var pending = await _factory.CreateAuthenticatedSessionAsync(UserRole.Student, "pending", UserRole.Lecturer.ToString());
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PutAsJsonAsync($"/api/admin/users/{pending.UserId}/role", new { role = "Researcher" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.PutAsJsonAsync($"/api/admin/users/{pending.UserId}/role", new { role = "Lecturer" })).StatusCode);
        await using var verifyScope = _factory.Services.CreateAsyncScope();
        var approved = await verifyScope.ServiceProvider.GetRequiredService<AppDbContext>().Users.FindAsync(pending.UserId);
        Assert.Equal(UserRole.Lecturer, approved!.Role);
        Assert.Equal("verified", approved.VerificationStatus);
        Assert.Null(approved.RequestedRole);
    }

    [Fact]
    public async Task Role_change_runs_profile_otp_pending_and_admin_approval_end_to_end()
    {
        var student = await _factory.CreateAuthenticatedSessionAsync(UserRole.Student, "verified");
        var profile = await student.Client.PutAsJsonAsync("/api/auth/profile", new
        {
            fullName = "Integration User", institution = "FPT University", department = "Computer Science",
            institutionalEmail = "lecturer@fpt.edu.vn", academicIdentifier = "GV-12345",
            programOrField = "Software Engineering", evidenceUrl = "https://fpt.edu.vn/staff/12345", requestedRole = "Lecturer"
        });
        Assert.Equal(HttpStatusCode.OK, profile.StatusCode);
        string token;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var user = (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users.FindAsync(student.UserId))!;
            Assert.Equal("email_verification_required", user.VerificationStatus);
            token = user.InstitutionalEmailVerificationToken!;
        }
        Assert.Equal(HttpStatusCode.OK, (await student.Client.PostAsJsonAsync("/api/auth/verify-institutional-email", new { token })).StatusCode);
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var user = (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users.FindAsync(student.UserId))!;
            Assert.Equal("pending", user.VerificationStatus);
            Assert.Equal("Lecturer", user.RequestedRole);
            Assert.Equal(UserRole.Student, user.Role);
        }
        using var admin = (await _factory.CreateAuthenticatedSessionAsync(UserRole.Admin, "verified")).Client;
        Assert.Equal(HttpStatusCode.OK, (await admin.PutAsJsonAsync($"/api/admin/users/{student.UserId}/role", new { role = "Lecturer" })).StatusCode);
        await using var finalScope = _factory.Services.CreateAsyncScope();
        Assert.Equal(UserRole.Lecturer, (await finalScope.ServiceProvider.GetRequiredService<AppDbContext>().Users.FindAsync(student.UserId))!.Role);
    }

    [Fact]
    public async Task Review_reporting_resolution_restriction_and_history_work_over_http()
    {
        var owner = await _factory.CreateAuthenticatedSessionAsync(UserRole.Student, "verified");
        var reporter = await _factory.CreateAuthenticatedSessionAsync(UserRole.Student, "verified");
        var admin = await _factory.CreateAuthenticatedSessionAsync(UserRole.Admin, "verified");
        int reviewId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var review = new PublicationReview { UserId = owner.UserId, PublicationKey = Guid.NewGuid().ToString("N"), PublicationTitle = "Moderated paper", CredibilityRating = 3, Comment = "Needs verification", ReviewerRole = "Student" };
            context.PublicationReviews.Add(review); await context.SaveChangesAsync(); reviewId = review.Id;
        }
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.Client.PostAsJsonAsync($"/api/publication-reviews/{reviewId}/reports", new { category = "spam", reason = "This is my own review" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await reporter.Client.PostAsJsonAsync($"/api/publication-reviews/{reviewId}/reports", new { category = "misinformation", reason = "Claims lack supporting evidence" })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await reporter.Client.PostAsJsonAsync($"/api/publication-reviews/{reviewId}/reports", new { category = "spam", reason = "Duplicate report attempt" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.Client.PostAsJsonAsync($"/api/publication-reviews/admin/{reviewId}/resolve-reports", new { resolution = "Reviewed and resolved" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.Client.PostAsJsonAsync($"/api/publication-reviews/admin/{reviewId}/hide", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.Client.PostAsJsonAsync($"/api/publication-reviews/admin/{reviewId}/restore", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.Client.PostAsJsonAsync("/api/publication-reviews", new { publicationKey = (await GetReviewKeyAsync(reviewId)), publicationTitle = "Moderated paper", credibilityRating = 4, comment = "Edited after moderation" })).StatusCode);
        var history = await admin.Client.GetFromJsonAsync<List<PublicationReviewModerationEvent>>($"/api/publication-reviews/admin/{reviewId}/history");
        Assert.Contains(history!, item => item.Action == "hide");
        Assert.Contains(history!, item => item.Action == "restore");
        Assert.Contains(history!, item => item.Action == "resolve");
        Assert.Contains(history!, item => item.Action == "edit");
        Assert.Equal(HttpStatusCode.OK, (await admin.Client.PostAsJsonAsync($"/api/publication-reviews/admin/users/{reporter.UserId}/restrict", new { days = 7 })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await reporter.Client.PostAsJsonAsync("/api/publication-reviews", ReviewPayload("restricted"))).StatusCode);

        async Task<string> GetReviewKeyAsync(int id)
        {
            await using var scope = _factory.Services.CreateAsyncScope();
            return (await scope.ServiceProvider.GetRequiredService<AppDbContext>().PublicationReviews.FindAsync(id))!.PublicationKey;
        }
    }

    [Fact]
    public async Task Review_rate_limit_returns_429_on_sixth_update_per_minute()
    {
        var reviewer = await _factory.CreateAuthenticatedSessionAsync(UserRole.Student, "verified");
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.OK, (await reviewer.Client.PostAsJsonAsync("/api/publication-reviews", ReviewPayload($"rate-{i}-{Guid.NewGuid():N}"))).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await reviewer.Client.PostAsJsonAsync("/api/publication-reviews", ReviewPayload("rate-sixth"))).StatusCode);
    }

    private static object ReviewPayload(string key) => new { publicationKey = key, publicationTitle = "Paper", credibilityRating = 4, comment = "Useful review" };
}

public sealed class ScholarTrendApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Hangfire:Enabled", "false");
        builder.UseSetting("Auth:RequireEmailVerification", "false");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.RemoveAll<IEmailService>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_databaseName));
            services.AddSingleton<IEmailService, TestEmailService>();
        });
    }

    public async Task<HttpClient> CreateAuthenticatedClientAsync(string verificationStatus)
        => (await CreateAuthenticatedSessionAsync(UserRole.Student, verificationStatus)).Client;

    public async Task<AuthenticatedSession> CreateAuthenticatedSessionAsync(UserRole role, string verificationStatus, string? requestedRole = null)
    {
        var email = $"{verificationStatus}-{Guid.NewGuid():N}@university.edu";
        using (var scope = Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            context.Users.Add(new User
            {
                Email = email,
                FullName = "Integration User",
                PasswordHash = PasswordHasher.HashPassword("StrongPassword123!"),
                Role = role,
                IsActive = true,
                IsEmailVerified = true,
                VerificationStatus = verificationStatus,
                RequestedRole = requestedRole
            });
            await context.SaveChangesAsync();
        }

        var client = CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email, password = "StrongPassword123!", requestedRole = role.ToString()
        });
        if (!login.IsSuccessStatusCode)
            throw new InvalidOperationException($"Login failed: {(int)login.StatusCode} {await login.Content.ReadAsStringAsync()}");
        var payload = await login.Content.ReadFromJsonAsync<LoginPayload>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload!.AccessToken);
        await using var lookupScope = Services.CreateAsyncScope();
        var user = await lookupScope.ServiceProvider.GetRequiredService<AppDbContext>().Users.SingleAsync(item => item.Email == email);
        return new AuthenticatedSession(client, user.Id, email);
    }

    public sealed record AuthenticatedSession(HttpClient Client, int UserId, string Email);
    private sealed record LoginPayload(string AccessToken);
    private sealed class TestEmailService : IEmailService
    {
        public Task SendEmailAsync(string to, string subject, string body) => Task.CompletedTask;
    }
}
