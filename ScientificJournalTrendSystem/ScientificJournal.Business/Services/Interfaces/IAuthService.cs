using System.Threading.Tasks;
using ScientificJournal.Common.DTOs.Request.Auth;
using ScientificJournal.Common.DTOs.Response.Auth;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync();
    Task ForgotPasswordAsync(ForgotPasswordRequestDto request);
}
