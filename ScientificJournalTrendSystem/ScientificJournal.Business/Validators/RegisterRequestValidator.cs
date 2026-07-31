using FluentValidation;
using ScientificJournal.Common.DTOs.Request.Auth;
using ScientificJournal.Common.Enums;

namespace ScientificJournal.Business.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email must be a valid email address.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name cannot exceed 100 characters.");

        RuleFor(x => x.Role)
            .Must(role => role is UserRole.Student or UserRole.Lecturer or UserRole.Researcher)
            .WithMessage("Role must be Student, Lecturer, or Researcher.");
    }
}
