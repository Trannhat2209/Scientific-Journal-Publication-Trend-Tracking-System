using FluentValidation;
using ScientificJournal.Common.DTOs.Request.Export;

namespace ScientificJournal.Business.Validators;

public class ExportRequestValidator : AbstractValidator<ExportRequestDto>
{
	public ExportRequestValidator()
	{
		RuleFor(x => x.Keyword)
			.NotEmpty().WithMessage("Keyword is required.")
			.MaximumLength(200).WithMessage("Keyword cannot exceed 200 characters.");

		RuleFor(x => x.FromYear)
			.GreaterThanOrEqualTo(1900).WithMessage("From year must be 1900 or later.");

		RuleFor(x => x.ToYear)
			.GreaterThanOrEqualTo(1900).WithMessage("To year must be 1900 or later.");

		RuleFor(x => x)
			.Must(x => x.ToYear >= x.FromYear)
			.WithMessage("To year must be greater than or equal to from year.");
	}
}
