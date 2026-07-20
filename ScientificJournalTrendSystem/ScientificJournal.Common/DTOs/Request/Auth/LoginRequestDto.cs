namespace ScientificJournal.Common.DTOs.Request.Auth;

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? RequestedRole { get; set; }
}
