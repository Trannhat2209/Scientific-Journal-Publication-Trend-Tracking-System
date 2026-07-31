using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ScientificJournal.API.Filters;

public sealed class ValidateModelFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var validationErrors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var argument in context.ActionArguments)
        {
            if (argument.Value is null)
            {
                continue;
            }

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.Value.GetType());
            if (context.HttpContext.RequestServices.GetService(validatorType) is not IValidator validator)
            {
                continue;
            }

            var validationContextType = typeof(ValidationContext<>).MakeGenericType(argument.Value.GetType());
            var validationContext = (IValidationContext)Activator.CreateInstance(validationContextType, argument.Value)!;
            ValidationResult result = await validator.ValidateAsync(validationContext, context.HttpContext.RequestAborted);

            foreach (var failure in result.Errors)
            {
                var key = string.IsNullOrWhiteSpace(failure.PropertyName) ? argument.Key : failure.PropertyName;
                if (!validationErrors.TryGetValue(key, out var messages))
                {
                    messages = new List<string>();
                    validationErrors[key] = messages;
                }

                messages.Add(failure.ErrorMessage);
            }
        }

        if (validationErrors.Count > 0)
        {
            context.Result = new BadRequestObjectResult(new ValidationProblemDetails(
                validationErrors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray(), StringComparer.OrdinalIgnoreCase))
            {
                Title = "One or more validation errors occurred.",
                Status = StatusCodes.Status400BadRequest
            });

            return;
        }

        await next();
    }
}