using System.ComponentModel.DataAnnotations;

namespace ScientificJournal.Common.DTOs.Request.Auth;

public class VerifyEmailRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Token { get; set; } = string.Empty;
}
