using System;
using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Auth;
using ScientificJournal.Common.DTOs.Response.Auth;

namespace ScientificJournal.Business.Services.Implementations;

public class AuthService : IAuthService
{
    public Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        return Task.FromResult(new AuthResponseDto());
    }

    public Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        return Task.FromResult(new AuthResponseDto());
    }

    public Task ForgotPasswordAsync(ForgotPasswordRequestDto request)
    {
        return Task.CompletedTask;
    }
}
