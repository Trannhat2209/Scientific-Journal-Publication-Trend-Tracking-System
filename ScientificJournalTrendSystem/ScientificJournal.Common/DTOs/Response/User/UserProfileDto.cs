using System;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.Common.DTOs.Response.User;

public class UserProfileDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsPro { get; set; }
    public string Plan { get; set; } = "Free";
    public int SearchAccuracy { get; set; }
}
