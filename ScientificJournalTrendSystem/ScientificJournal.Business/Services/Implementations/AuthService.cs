using System;
using System.Net.Mail;
using Microsoft.IdentityModel.Tokens;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Configurations;
using ScientificJournal.Common.DTOs.Request.Auth;
using ScientificJournal.Common.DTOs.Response.Auth;
using ScientificJournal.Common.DTOs.Response.User;
using ScientificJournal.Common.Enums;
using ScientificJournal.Common.Helpers;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly JwtSettings _jwtSettings;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;
    private readonly OrcidValidationClient? _orcidValidationClient;
    private readonly IConfiguration _configuration;
    private readonly bool _requireEmailVerification;

    public AuthService(
        AppDbContext dbContext,
        IOptions<JwtSettings> jwtSettings,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        OrcidValidationClient? orcidValidationClient = null)
    {
        _dbContext = dbContext;
        _jwtSettings = jwtSettings.Value;
        _emailService = emailService;
        _logger = logger;
        _orcidValidationClient = orcidValidationClient;
        _configuration = configuration;
        _requireEmailVerification = !string.Equals(
            configuration["Auth:RequireEmailVerification"],
            "false",
            StringComparison.OrdinalIgnoreCase);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var fullName = request.FullName.Trim();
        var exists = await _dbContext.Users.AnyAsync(u => u.Email == email && !u.IsDeleted);
        if (exists)
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var verificationToken = _requireEmailVerification
            ? new Random().Next(100000, 999999).ToString()
            : null;
        var registrationRole = request.Role is UserRole.Student or UserRole.Lecturer or UserRole.Researcher
            ? request.Role
            : UserRole.Student;

        var user = new User
        {
            Email = email,
            FullName = fullName,
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            Role = registrationRole,
            IsActive = true,
            IsDeleted = false,
            IsEmailVerified = !_requireEmailVerification,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            _logger.LogWarning(exception, "Registration failed because email {Email} already exists or violates a database constraint.", email);
            throw new InvalidOperationException("Email already exists.");
        }

        if (_requireEmailVerification && !string.IsNullOrWhiteSpace(verificationToken))
        {
            try
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    "Verify your Scientific Journal publication account",
                    $"Welcome to the Scientific Journal Publication Trend Tracking System!\n\nYour email verification token is: {verificationToken}\n\nPlease submit this code via the verify-email endpoint or UI to activate your account."
                );
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Verification email could not be sent to {Email}. Registration will continue.", user.Email);
            }
        }

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("This account has been banned. Please contact an administrator for assistance.");
        }

        if (!PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (_requireEmailVerification && !user.IsEmailVerified)
        {
            throw new UnauthorizedAccessException("Please verify your email address before logging in.");
        }

        // Administrator access is determined by the stored account role. The
        // academic role picker on the login page must not block admin sign-in.
        if (user.Role != UserRole.Admin && !string.IsNullOrWhiteSpace(request.RequestedRole))
        {
            var normalizedRequestedRole = string.Equals(
                request.RequestedRole,
                "Administrator",
                StringComparison.OrdinalIgnoreCase)
                ? "Admin"
                : request.RequestedRole;

            if (!Enum.TryParse<UserRole>(normalizedRequestedRole, true, out var requestedRole) ||
                requestedRole != user.Role)
            {
                throw new UnauthorizedAccessException(
                    user.Role == UserRole.Student
                        ? "This account is currently a Student account. Submit a role-change request and academic identity evidence for Admin approval."
                        : $"This account is registered as {(user.Role == UserRole.Admin ? "Administrator" : user.Role)}. Please select the matching role.");
            }
        }

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        System.Security.Claims.ClaimsPrincipal principal;
        try
        {
            principal = JwtHelper.ValidateToken(refreshToken, _jwtSettings.Secret);
        }
        catch (SecurityTokenException)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }
        catch (ArgumentException)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        var tokenType = principal.FindFirst("token_type")?.Value;
        if (!string.Equals(tokenType, "refresh", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Invalid token type.");
        }

        var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("User is not allowed to refresh token.");
        }

        return BuildAuthResponse(user);
    }

    public Task LogoutAsync()
    {
        return Task.CompletedTask;
    }

    public async Task<UserProfileDto> GetProfileAsync(int userId)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        return MapProfile(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        user.FullName = request.FullName.Trim();
        if (request.Institution != null)
        {
            var requestedRole = request.RequestedRole?.Trim();
            if (string.Equals(requestedRole, "Lecture", StringComparison.OrdinalIgnoreCase))
            {
                requestedRole = "Lecturer";
            }
            if (!Enum.TryParse<UserRole>(requestedRole, true, out var parsedRequestedRole) ||
                parsedRequestedRole == UserRole.Admin)
            {
                parsedRequestedRole = user.Role;
            }
            var normalizedRequestedRole = parsedRequestedRole == user.Role
                ? null
                : parsedRequestedRole.ToString();
            var institution = request.Institution.Trim();
            var department = request.Department?.Trim();
            var institutionalEmail = request.InstitutionalEmail?.Trim().ToLowerInvariant();
            var academicIdentifier = request.AcademicIdentifier?.Trim();
            var programOrField = request.ProgramOrField?.Trim();
            var evidenceUrl = request.EvidenceUrl?.Trim();
            ValidateAcademicIdentity(
                parsedRequestedRole,
                institution,
                department,
                institutionalEmail,
                academicIdentifier,
                programOrField,
                evidenceUrl);
            if (parsedRequestedRole == UserRole.Researcher &&
                _orcidValidationClient != null &&
                !await _orcidValidationClient.IsValidAsync(academicIdentifier!))
            {
                throw new InvalidOperationException("ORCID could not be verified against the public ORCID registry.");
            }
            var identityChanged =
                !string.Equals(user.Institution, institution, StringComparison.Ordinal) ||
                !string.Equals(user.Department, department, StringComparison.Ordinal) ||
                !string.Equals(user.InstitutionalEmail, institutionalEmail, StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(user.AcademicIdentifier, academicIdentifier, StringComparison.Ordinal) ||
                !string.Equals(user.ProgramOrField, programOrField, StringComparison.Ordinal) ||
                !string.Equals(user.EvidenceUrl, evidenceUrl, StringComparison.Ordinal) ||
                !string.Equals(user.RequestedRole, normalizedRequestedRole, StringComparison.OrdinalIgnoreCase);

            user.Institution = institution;
            user.Department = department;
            user.InstitutionalEmail = institutionalEmail;
            user.AcademicIdentifier = academicIdentifier;
            user.ProgramOrField = programOrField;
            user.EvidenceUrl = evidenceUrl;
            user.RequestedRole = normalizedRequestedRole;
            if (identityChanged)
            {
                var verificationToken = Random.Shared.Next(100000, 999999).ToString();
                user.IsInstitutionalEmailVerified = false;
                user.InstitutionalEmailVerificationToken = verificationToken;
                user.InstitutionalEmailVerificationTokenExpiresAt = DateTime.UtcNow.AddMinutes(15);
                user.VerificationStatus = "email_verification_required";
                user.VerificationSubmittedAt = null;
                user.VerificationReviewedAt = null;
                await _emailService.SendEmailAsync(
                    institutionalEmail!,
                    "Verify your ScholarTrend institutional email",
                    $"Your ScholarTrend Academic Identity verification code is {verificationToken}. It expires in 15 minutes.");
            }
        }
        await _dbContext.SaveChangesAsync();

        return MapProfile(user);
    }

    public async Task<UserProfileDto> VerifyInstitutionalEmailAsync(int userId, string token)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(item => item.Id == userId && !item.IsDeleted)
            ?? throw new KeyNotFoundException("User profile not found.");
        var normalizedToken = token?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedToken) ||
            !string.Equals(user.InstitutionalEmailVerificationToken, normalizedToken, StringComparison.Ordinal) ||
            user.InstitutionalEmailVerificationTokenExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("The institutional email verification code is invalid or expired.");
        }

        user.IsInstitutionalEmailVerified = true;
        user.InstitutionalEmailVerificationToken = null;
        user.InstitutionalEmailVerificationTokenExpiresAt = null;
        user.VerificationStatus = "pending";
        user.VerificationSubmittedAt = DateTime.UtcNow;
        user.VerificationReviewedAt = null;
        await _dbContext.SaveChangesAsync();
        return MapProfile(user);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        if (!PasswordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Current password is incorrect.");
        }

        user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
        await _dbContext.SaveChangesAsync();
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequestDto request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        var resetToken = new Random().Next(100000, 999999).ToString();
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);

        await _dbContext.SaveChangesAsync();

        await _emailService.SendEmailAsync(
            user.Email,
            "Reset your Scientific Journal Publication account password",
            $"Hello {user.FullName},\n\nWe received a request to reset your password.\nYour password reset code is: {resetToken}\n\nPlease submit this code via the reset-password endpoint to update your password."
        );
    }

    public async Task ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        if (user.PasswordResetToken != request.Token)
        {
            throw new InvalidOperationException("Invalid password reset token.");
        }

        if (user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Password reset token has expired.");
        }

        user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;

        await _dbContext.SaveChangesAsync();
    }

    public async Task VerifyEmailAsync(string email, string token)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);
        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        if (user.IsEmailVerified)
        {
            throw new InvalidOperationException("Email is already verified.");
        }

        if (user.EmailVerificationToken != token)
        {
            throw new InvalidOperationException("Invalid verification token.");
        }

        if (user.EmailVerificationTokenExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Verification token has expired.");
        }

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiresAt = null;

        await _dbContext.SaveChangesAsync();
    }

    private AuthResponseDto BuildAuthResponse(User user)
    {
        return new AuthResponseDto
        {
            AccessToken = JwtHelper.GenerateAccessToken(user.Id, user.Email, user.FullName, user.Role.ToString(), _jwtSettings.Secret, TimeSpan.FromHours(1)),
            RefreshToken = JwtHelper.GenerateRefreshToken(user.Id, user.Email, user.FullName, user.Role.ToString(), _jwtSettings.Secret, TimeSpan.FromDays(_jwtSettings.ExpiryInDays)),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            User = MapProfile(user)
        };
    }

    private static UserProfileDto MapProfile(User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            Institution = user.Institution ?? string.Empty,
            Department = user.Department ?? string.Empty,
            InstitutionalEmail = user.InstitutionalEmail ?? string.Empty,
            IsInstitutionalEmailVerified = user.IsInstitutionalEmailVerified,
            AcademicIdentifier = user.AcademicIdentifier ?? string.Empty,
            ProgramOrField = user.ProgramOrField ?? string.Empty,
            EvidenceUrl = user.EvidenceUrl ?? string.Empty,
            VerificationStatus = user.VerificationStatus,
            RequestedRole = user.RequestedRole ?? string.Empty,
            VerificationSubmittedAt = user.VerificationSubmittedAt,
            VerificationReviewedAt = user.VerificationReviewedAt
        };
    }

    public async Task<AuthResponseDto> IssueExternalSessionAsync(int userId)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(item => item.Id == userId && item.IsActive && !item.IsDeleted)
            ?? throw new UnauthorizedAccessException("External user is not active.");
        return BuildAuthResponse(user);
    }

    private void ValidateAcademicIdentity(
        UserRole role,
        string institution,
        string? department,
        string? institutionalEmail,
        string? academicIdentifier,
        string? programOrField,
        string? evidenceUrl)
    {
        if (string.IsNullOrWhiteSpace(institution) ||
            string.IsNullOrWhiteSpace(department) ||
            string.IsNullOrWhiteSpace(institutionalEmail) ||
            string.IsNullOrWhiteSpace(academicIdentifier) ||
            string.IsNullOrWhiteSpace(programOrField) ||
            string.IsNullOrWhiteSpace(evidenceUrl))
        {
            throw new InvalidOperationException(
                $"Complete all {role} academic identity fields before submitting for Admin review.");
        }

        if (!MailAddress.TryCreate(institutionalEmail, out var address) ||
            IsConsumerEmailDomain(address.Host))
        {
            throw new InvalidOperationException(
                "Use an official institutional email address, not a personal email provider.");
        }

        ValidateInstitutionPolicy(role, institution, address.Host, academicIdentifier);

        if (!Uri.TryCreate(evidenceUrl, UriKind.Absolute, out var evidenceUri) ||
            evidenceUri.Scheme is not ("http" or "https"))
        {
            throw new InvalidOperationException(
                "Verification URL must be a valid HTTP or HTTPS institutional profile, directory, or ORCID link.");
        }

        var identifierPattern = new Regex("^[A-Za-z0-9][A-Za-z0-9._-]{3,31}$", RegexOptions.CultureInvariant);
        if (role is UserRole.Student or UserRole.Lecturer && !identifierPattern.IsMatch(academicIdentifier))
        {
            throw new InvalidOperationException("Academic identifier must contain 4-32 letters, numbers, dots, underscores, or hyphens.");
        }

        if (role == UserRole.Researcher)
        {
            var orcidCandidate = academicIdentifier.Trim().Replace("https://orcid.org/", string.Empty, StringComparison.OrdinalIgnoreCase);
            if (!Regex.IsMatch(orcidCandidate, "^\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dX]$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            {
                throw new InvalidOperationException("Researcher Academic Identity requires a valid ORCID identifier.");
            }
        }
    }

    private void ValidateInstitutionPolicy(UserRole role, string institution, string emailDomain, string academicIdentifier)
    {
        var normalizedInstitution = institution.Trim().ToLowerInvariant();
        var normalizedDomain = emailDomain.Trim().ToLowerInvariant();
        var policy = _configuration.GetSection("AcademicIdentity:Institutions").GetChildren()
            .FirstOrDefault(item => item.GetSection("Aliases").GetChildren()
                .Select(alias => alias.Value)
                .Where(alias => !string.IsNullOrWhiteSpace(alias))
                .Any(alias => normalizedInstitution.Contains(alias!.Trim().ToLowerInvariant(), StringComparison.Ordinal)));
        if (policy == null) return;

        var domains = policy.GetSection("EmailDomains").GetChildren()
            .Select(item => item.Value?.Trim().ToLowerInvariant())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Cast<string>()
            .ToArray();
        if (domains.Length == 0 || !domains.Any(domain => normalizedDomain == domain || normalizedDomain.EndsWith('.' + domain, StringComparison.Ordinal)))
            throw new InvalidOperationException("Institutional email domain does not match the selected institution.");

        var rolePattern = policy[$"{role}IdentifierPattern"];
        if (rolePattern != null && !Regex.IsMatch(academicIdentifier, rolePattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            throw new InvalidOperationException($"Academic identifier does not match the {institution} {role} format.");
    }

    private static bool IsConsumerEmailDomain(string domain)
    {
        var normalized = domain.Trim().ToLowerInvariant();
        return normalized is
            "gmail.com" or
            "googlemail.com" or
            "yahoo.com" or
            "outlook.com" or
            "hotmail.com" or
            "icloud.com" or
            "proton.me" or
            "protonmail.com";
    }
}
