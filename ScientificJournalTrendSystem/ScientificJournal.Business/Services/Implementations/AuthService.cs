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

    public AuthService(AppDbContext dbContext, IOptions<JwtSettings> jwtSettings)
    {
        _dbContext = dbContext;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var exists = await _dbContext.Users.AnyAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (exists)
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            Role = request.Role,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

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

    public Task ForgotPasswordAsync(ForgotPasswordRequestDto request)
    {
        return Task.CompletedTask;
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
