using System;

namespace ScientificJournal.API.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class AuthorizeRolesAttribute : Attribute
{
    public AuthorizeRolesAttribute(params string[] roles)
    {
    }
}
