using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Configurations;
using ScientificJournal.Common.DTOs.Request.Auth;
using ScientificJournal.Common.DTOs.Response.Auth;
using ScientificJournal.Common.DTOs.Response.User;
using ScientificJournal.Common.Helpers;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly JwtSettings _jwtSettings;
    private readonly IEmailService _emailService;

    public AuthService(AppDbContext dbContext, IOptions<JwtSettings> jwtSettings, IEmailService emailService)
    {
        _dbContext = dbContext;
        _jwtSettings = jwtSettings.Value;
        _emailService = emailService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var exists = await _dbContext.Users.AnyAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (exists)
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var verificationToken = new Random().Next(100000, 999999).ToString();

        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            Role = request.Role,
            IsActive = true,
            IsDeleted = false,
            IsEmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        // Send email with verification code/token
        await _emailService.SendEmailAsync(
            user.Email,
            "Verify your Scientific Journal publication account",
            $"Welcome to the Scientific Journal Publication Trend Tracking System!\n\nYour email verification token is: {verificationToken}\n\nPlease submit this code via the verify-email endpoint or UI to activate your account."
        );

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

        if (!user.IsEmailVerified)
        {
            throw new UnauthorizedAccessException("Please verify your email address before logging in.");
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

        // Send security alert email about token refresh
        await _emailService.SendEmailAsync(
            user.Email,
            "Scientific Journal publication account security alert",
            $"Hello {user.FullName},\n\nA security token refresh action was triggered for your account at {DateTime.UtcNow} UTC. If this was not you, please secure your credentials immediately."
        );

        return BuildAuthResponse(user);
    }

    public Task LogoutAsync()
    {
        return Task.CompletedTask;
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
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role
            }
        };
    }
}
