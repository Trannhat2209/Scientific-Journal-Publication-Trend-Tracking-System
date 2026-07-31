using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.API.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class VerifiedAcademicUserAttribute : TypeFilterAttribute
{
    public VerifiedAcademicUserAttribute(params UserRole[] allowedRoles)
        : base(typeof(VerifiedAcademicUserFilter))
    {
        Arguments = new object[] { allowedRoles };
    }
}

public sealed class VerifiedAcademicUserFilter : IAsyncAuthorizationFilter
{
    private readonly AppDbContext _context;
    private readonly HashSet<UserRole> _allowedRoles;

    public VerifiedAcademicUserFilter(AppDbContext context, UserRole[] allowedRoles)
    {
        _context = context;
        _allowedRoles = allowedRoles.ToHashSet();
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = "Please sign in to access this feature."
            });
            return;
        }

        var userIdValue =
            context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            context.HttpContext.User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId && !item.IsDeleted);
        if (user == null || !user.IsActive)
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = "This account is unavailable."
            });
            return;
        }

        if (user.Role == UserRole.Admin)
        {
            return;
        }

        if (!string.Equals(user.VerificationStatus, "verified", StringComparison.OrdinalIgnoreCase))
        {
            context.Result = new ObjectResult(new
            {
                message = "Admin verification is required before using this feature.",
                verificationStatus = user.VerificationStatus
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        if (_allowedRoles.Count > 0 && !_allowedRoles.Contains(user.Role))
        {
            context.Result = new ObjectResult(new
            {
                message = $"This feature is not available for the {user.Role} role."
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}
