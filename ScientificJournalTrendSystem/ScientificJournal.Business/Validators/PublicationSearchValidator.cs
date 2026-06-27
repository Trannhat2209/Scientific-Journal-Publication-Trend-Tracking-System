using FluentValidation;
using ScientificJournal.Common.DTOs.Request.Publication;

namespace ScientificJournal.Business.Validators;

public class PublicationSearchValidator : AbstractValidator<PublicationSearchRequestDto>
{
	public PublicationSearchValidator()
	{
		RuleFor(x => x.Page)
			.GreaterThan(0).WithMessage("Page must be greater than 0.");

		RuleFor(x => x.PageSize)
			.InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100.");

		RuleFor(x => x.Year)
			.GreaterThanOrEqualTo(1900)
			.When(x => x.Year.HasValue)
			.WithMessage("Year must be 1900 or later.");

		RuleFor(x => x.SortBy)
			.Must(sortBy => string.IsNullOrWhiteSpace(sortBy) ||
							sortBy.Equals("relevance", StringComparison.OrdinalIgnoreCase) ||
							sortBy.Equals("year", StringComparison.OrdinalIgnoreCase) ||
							sortBy.Equals("title", StringComparison.OrdinalIgnoreCase))
			.WithMessage("SortBy must be one of: relevance, year, title.");
	}
}
