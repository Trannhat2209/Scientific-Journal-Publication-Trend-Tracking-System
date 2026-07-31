using System;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.Common.DTOs.Response.User;

public class UserProfileDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string Institution { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string InstitutionalEmail { get; set; } = string.Empty;
    public bool IsInstitutionalEmailVerified { get; set; }
    public string AcademicIdentifier { get; set; } = string.Empty;
    public string ProgramOrField { get; set; } = string.Empty;
    public string EvidenceUrl { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = "not_submitted";
    public string RequestedRole { get; set; } = string.Empty;
    public DateTime? VerificationSubmittedAt { get; set; }
    public DateTime? VerificationReviewedAt { get; set; }
}
