using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using ScientificJournal.Business.Services.Implementations;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Configurations;
using ScientificJournal.Common.DTOs.Request.Auth;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Helpers;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.AdminTests;

public class AdminAuthenticationTests
{
    [Fact]
    public async Task Sql_admin_login_issues_admin_jwt_profile()
    {
        await using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        context.Users.Add(new User
        {
            Email = "admin@scholartrend.test",
            FullName = "System Admin",
            PasswordHash = PasswordHasher.HashPassword("StrongPassword123!"),
            Role = UserRole.Admin,
            IsActive = true,
            IsEmailVerified = true
        });
        await context.SaveChangesAsync();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Auth:RequireEmailVerification"] = "false" })
            .Build();
        var service = new AuthService(
            context,
            Options.Create(new JwtSettings { Secret = "test-secret-that-is-long-enough-for-hmac-signing-123456", ExpiryInDays = 7 }),
            new FakeEmailService(),
            configuration,
            NullLogger<AuthService>.Instance);

        var response = await service.LoginAsync(new LoginRequestDto
        {
            Email = "admin@scholartrend.test",
            Password = "StrongPassword123!"
        });

        Assert.Equal(UserRole.Admin, response.User.Role);
        Assert.False(string.IsNullOrWhiteSpace(response.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(response.RefreshToken));
    }

    [Theory]
    [InlineData(UserRole.Student, false)]
    [InlineData(UserRole.Student, true)]
    [InlineData(UserRole.Lecturer, false)]
    [InlineData(UserRole.Lecturer, true)]
    [InlineData(UserRole.Researcher, false)]
    [InlineData(UserRole.Researcher, true)]
    public async Task Login_preserves_admin_assigned_role_and_plan(UserRole role, bool isPro)
    {
        await using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        context.Users.Add(new User
        {
            Email = "managed@scholartrend.test",
            FullName = "Managed User",
            PasswordHash = PasswordHasher.HashPassword("StrongPassword123!"),
            Role = role,
            IsPro = isPro,
            Plan = isPro ? "Pro" : "Free",
            IsActive = true,
            IsEmailVerified = true
        });
        await context.SaveChangesAsync();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Auth:RequireEmailVerification"] = "false" })
            .Build();
        var service = new AuthService(
            context,
            Options.Create(new JwtSettings { Secret = "test-secret-that-is-long-enough-for-hmac-signing-123456", ExpiryInDays = 7 }),
            new FakeEmailService(),
            configuration,
            NullLogger<AuthService>.Instance);

        var response = await service.LoginAsync(new LoginRequestDto
        {
            Email = "managed@scholartrend.test",
            Password = "StrongPassword123!",
            RequestedRole = role.ToString()
        });

        Assert.Equal(role, response.User.Role);
        Assert.Equal(isPro, response.User.IsPro);
        Assert.Equal(isPro ? "Pro" : "Free", response.User.Plan);
        var storedUser = await context.Users.SingleAsync();
        Assert.Equal(role, storedUser.Role);
        Assert.Equal(isPro, storedUser.IsPro);
    }

    private sealed class FakeEmailService : IEmailService
    {
        public Task SendEmailAsync(string to, string subject, string body) => Task.CompletedTask;
    }
}
