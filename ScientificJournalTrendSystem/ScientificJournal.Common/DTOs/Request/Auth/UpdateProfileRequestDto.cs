using System.ComponentModel.DataAnnotations;

namespace ScientificJournal.Common.DTOs.Request.Auth;

public class UpdateProfileRequestDto
{
    [Required]
    [MinLength(2)]
    public string FullName { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string? Department { get; set; }
    public string? InstitutionalEmail { get; set; }
    public string? AcademicIdentifier { get; set; }
    public string? ProgramOrField { get; set; }
    public string? EvidenceUrl { get; set; }
    public string? RequestedRole { get; set; }
}
