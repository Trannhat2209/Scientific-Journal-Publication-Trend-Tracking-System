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
    [InlineData(UserRole.Student)]
    [InlineData(UserRole.Lecturer)]
    [InlineData(UserRole.Researcher)]
    public async Task Login_preserves_admin_assigned_role(UserRole role)
    {
        await using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        context.Users.Add(new User
        {
            Email = "managed@scholartrend.test",
            FullName = "Managed User",
            PasswordHash = PasswordHasher.HashPassword("StrongPassword123!"),
            Role = role,
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
        var storedUser = await context.Users.SingleAsync();
        Assert.Equal(role, storedUser.Role);
    }

    [Fact]
    public async Task Disabled_account_login_returns_banned_message_before_password_validation()
    {
        await using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        context.Users.Add(new User
        {
            Email = "banned@scholartrend.test",
            FullName = "Banned User",
            PasswordHash = PasswordHasher.HashPassword("StrongPassword123!"),
            Role = UserRole.Student,
            IsActive = false,
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

        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(new LoginRequestDto
        {
            Email = "banned@scholartrend.test",
            Password = "WrongPassword123!",
            RequestedRole = "Student"
        }));

        Assert.Equal("This account has been banned. Please contact an administrator for assistance.", exception.Message);
    }

    [Fact]
    public async Task Academic_identity_requires_institutional_email_code_before_pending_review()
    {
        await using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = new User
        {
            Email = "student@example.com", FullName = "Student User",
            PasswordHash = PasswordHasher.HashPassword("StrongPassword123!"),
            Role = UserRole.Student, IsActive = true, IsEmailVerified = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var email = new FakeEmailService();
        var service = new AuthService(
            context,
            Options.Create(new JwtSettings { Secret = "test-secret-that-is-long-enough-for-hmac-signing-123456", ExpiryInDays = 7 }),
            email,
            new ConfigurationBuilder().Build(),
            NullLogger<AuthService>.Instance);

        var profile = await service.UpdateProfileAsync(user.Id, new UpdateProfileRequestDto
        {
            FullName = user.FullName,
            Institution = "Example University",
            Department = "Computer Science",
            InstitutionalEmail = "student@example.edu",
            AcademicIdentifier = "STU-2026",
            ProgramOrField = "Software Engineering",
            EvidenceUrl = "https://example.edu/directory/student",
            RequestedRole = "Student"
        });

        Assert.Equal("email_verification_required", profile.VerificationStatus);
        Assert.False(profile.IsInstitutionalEmailVerified);
        Assert.Equal("student@example.edu", email.LastRecipient);
        var code = (await context.Users.SingleAsync()).InstitutionalEmailVerificationToken;
        var verified = await service.VerifyInstitutionalEmailAsync(user.Id, code!);
        Assert.True(verified.IsInstitutionalEmailVerified);
        Assert.Equal("pending", verified.VerificationStatus);
    }

    [Theory]
    [InlineData("FPT University", "student@fpt.edu.vn", "SE123456", "Student", true)]
    [InlineData("FPT University", "lecturer@fe.edu.vn", "GV-1234", "Lecturer", true)]
    [InlineData("FPT University", "student@vnu.edu.vn", "SE123456", "Student", false)]
    [InlineData("FPT University", "student@fpt.edu.vn", "INVALID", "Student", false)]
    [InlineData("VNU", "student@hus.vnu.edu.vn", "QH20261234", "Student", true)]
    [InlineData("Vietnam National University", "lecturer@vnu.edu.vn", "CB-12345", "Lecturer", true)]
    public async Task Academic_identity_enforces_institution_domain_and_role_identifier(
        string institution, string institutionalEmail, string identifier, string requestedRole, bool valid)
    {
        await using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = new User { Email = "identity@example.com", FullName = "Identity User", PasswordHash = "hash", Role = UserRole.Student, IsActive = true };
        context.Users.Add(user); await context.SaveChangesAsync();
        var institutionConfiguration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["AcademicIdentity:Institutions:FPT:Aliases:0"] = "fpt",
            ["AcademicIdentity:Institutions:FPT:EmailDomains:0"] = "fpt.edu.vn",
            ["AcademicIdentity:Institutions:FPT:EmailDomains:1"] = "fe.edu.vn",
            ["AcademicIdentity:Institutions:FPT:StudentIdentifierPattern"] = "^(SE|SS|AI|IA|HE|GD|MC)\\d{6}$",
            ["AcademicIdentity:Institutions:FPT:LecturerIdentifierPattern"] = "^(EMP|GV|LECT)[-_]?\\d{4,8}$",
            ["AcademicIdentity:Institutions:VNU:Aliases:0"] = "vnu",
            ["AcademicIdentity:Institutions:VNU:Aliases:1"] = "vietnam national university",
            ["AcademicIdentity:Institutions:VNU:EmailDomains:0"] = "vnu.edu.vn",
            ["AcademicIdentity:Institutions:VNU:StudentIdentifierPattern"] = "^(\\d{8,10}|[A-Z]{1,4}\\d{6,10})$",
            ["AcademicIdentity:Institutions:VNU:LecturerIdentifierPattern"] = "^(CB|GV|LECT)[-_]?\\d{4,8}$"
        }).Build();
        var service = new AuthService(context,
            Options.Create(new JwtSettings { Secret = "test-secret-that-is-long-enough-for-hmac-signing-123456", ExpiryInDays = 7 }),
            new FakeEmailService(), institutionConfiguration, NullLogger<AuthService>.Instance);
        var request = new UpdateProfileRequestDto
        {
            FullName = user.FullName, Institution = institution, Department = "Computer Science",
            InstitutionalEmail = institutionalEmail, AcademicIdentifier = identifier,
            ProgramOrField = "Software Engineering", EvidenceUrl = "https://example.edu/profile", RequestedRole = requestedRole
        };
        if (valid)
            Assert.Equal("email_verification_required", (await service.UpdateProfileAsync(user.Id, request)).VerificationStatus);
        else
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateProfileAsync(user.Id, request));
    }

    private sealed class FakeEmailService : IEmailService
    {
        public string? LastRecipient { get; private set; }
        public Task SendEmailAsync(string to, string subject, string body)
        {
            LastRecipient = to;
            return Task.CompletedTask;
        }
    }
}
