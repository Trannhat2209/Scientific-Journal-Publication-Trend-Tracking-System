using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Auth;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
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
