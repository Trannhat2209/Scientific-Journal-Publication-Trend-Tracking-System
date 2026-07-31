using System;
using System.Collections.Generic;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.DataAccess.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public bool IsEmailVerified { get; set; } = false;
    public string? Institution { get; set; }
    public string? Department { get; set; }
    public string? InstitutionalEmail { get; set; }
    public bool IsInstitutionalEmailVerified { get; set; }
    public string? InstitutionalEmailVerificationToken { get; set; }
    public DateTime? InstitutionalEmailVerificationTokenExpiresAt { get; set; }
    public string? AcademicIdentifier { get; set; }
    public string? ProgramOrField { get; set; }
    public string? EvidenceUrl { get; set; }
    public string VerificationStatus { get; set; } = "not_submitted";
    public string? RequestedRole { get; set; }
    public DateTime? VerificationSubmittedAt { get; set; }
    public DateTime? VerificationReviewedAt { get; set; }
    public DateTime? ReviewRestrictedUntil { get; set; }
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiresAt { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation collections
    public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();
    public ICollection<Follow> Follows { get; set; } = new List<Follow>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
