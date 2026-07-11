using System;
using ScientificJournal.Common.DTOs.Response.User;

namespace ScientificJournal.Common.DTOs.Response.Auth;

public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = new();
}
