using System.ComponentModel.DataAnnotations;

namespace ScientificJournal.Common.DTOs.Request.Auth;

public class UpdateProfileRequestDto
{
    [Required]
    [MinLength(2)]
    public string FullName { get; set; } = string.Empty;
}
