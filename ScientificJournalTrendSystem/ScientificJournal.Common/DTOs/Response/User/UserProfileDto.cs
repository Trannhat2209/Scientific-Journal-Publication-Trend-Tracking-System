using System;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.Common.DTOs.Response.User;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
}
