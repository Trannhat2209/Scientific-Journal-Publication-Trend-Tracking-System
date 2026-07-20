using System;
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
using ScientificJournal.Common.Policies;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly JwtSettings _jwtSettings;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;
    private readonly bool _requireEmailVerification;

    public AuthService(
        AppDbContext dbContext,
        IOptions<JwtSettings> jwtSettings,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _jwtSettings = jwtSettings.Value;
        _emailService = emailService;
        _logger = logger;
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

        var user = new User
        {
            Email = email,
            FullName = fullName,
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            Role = UserRole.Student,
            IsActive = true,
            IsDeleted = false,
            Plan = "Free",
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

        if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is disabled.");
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
                        ? "This account is currently a Student account. Upgrade your plan before signing in as Researcher or Lecturer."
                        : $"This account is registered as {(user.Role == UserRole.Admin ? "Administrator" : user.Role)}. Please select the matching role.");
            }
        }

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var principal = JwtHelper.ValidateToken(refreshToken, _jwtSettings.Secret);
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
            IsPro = user.IsPro,
            Plan = string.IsNullOrWhiteSpace(user.Plan) ? (user.IsPro ? "Pro" : "Free") : user.Plan,
            SearchAccuracy = PlanPolicy.GetSearchAccuracy(user.Role, user.IsPro)
        };
    }

    public async Task<AuthResponseDto> IssueExternalSessionAsync(int userId)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(item => item.Id == userId && item.IsActive && !item.IsDeleted)
            ?? throw new UnauthorizedAccessException("External user is not active.");
        return BuildAuthResponse(user);
    }
}
