using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Auth;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthController(IAuthService authService, AppDbContext dbContext, IConfiguration configuration)
    {
        _authService = authService;
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpGet("login-options")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLoginOptions([FromQuery] string? email)
    {
        var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
        var user = string.IsNullOrWhiteSpace(normalizedEmail)
            ? null
            : await _dbContext.Users
                .AsNoTracking()
                .Where(item => item.Email == normalizedEmail && !item.IsDeleted && item.IsActive)
                .Select(item => new { item.Role })
                .FirstOrDefaultAsync();

        if (user?.Role == UserRole.Admin)
        {
            return Ok(new { isAdministrator = true, allowedRoles = Array.Empty<string>() });
        }

        if (user != null)
        {
            return Ok(new
            {
                isAdministrator = false,
                assignedRole = user.Role.ToString(),
                allowedRoles = new[] { "Researcher", "Lecturer", "Student" }
            });
        }

        return Ok(new
        {
            isAdministrator = false,
            allowedRoles = new[] { "Researcher", "Lecturer", "Student" }
        });
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        var result = await _authService.RegisterAsync(request);
        return Ok(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
    {
        await _authService.ForgotPasswordAsync(request);
        if (_configuration.GetValue<bool>("Auth:ExposeResetToken"))
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var resetToken = await _dbContext.Users
                .AsNoTracking()
                .Where(user => user.Email == normalizedEmail && !user.IsDeleted)
                .Select(user => user.PasswordResetToken)
                .FirstOrDefaultAsync();
            return Ok(new
            {
                message = "Development mode: use the reset code shown below.",
                resetToken
            });
        }

        return Ok(new { message = "Password reset request received. If the account exists, an email has been sent." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        await _authService.ResetPasswordAsync(request);
        return Ok(new { message = "Password has been reset successfully." });
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(result);
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto request)
    {
        await _authService.VerifyEmailAsync(request.Email, request.Token);
        return Ok(new { message = "Email verified successfully. You can now log in." });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _authService.LogoutAsync();
        return Ok(new { message = "Logged out successfully." });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
            email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value,
            name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value,
            role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
        });
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _authService.GetProfileAsync(userId);
        return Ok(result);
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _authService.UpdateProfileAsync(userId, request);
        return Ok(result);
    }

    [HttpPost("verify-institutional-email")]
    [Authorize]
    public async Task<IActionResult> VerifyInstitutionalEmail([FromBody] VerifyInstitutionalEmailRequest request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var result = await _authService.VerifyInstitutionalEmailAsync(userId, request.Token);
        return Ok(result);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        await _authService.ChangePasswordAsync(userId, request);
        return Ok(new { message = "Password changed successfully." });
    }

    private bool TryGetUserId(out int userId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(userIdValue, out userId);
    }
}

public sealed class VerifyInstitutionalEmailRequest
{
    public string Token { get; set; } = string.Empty;
}
