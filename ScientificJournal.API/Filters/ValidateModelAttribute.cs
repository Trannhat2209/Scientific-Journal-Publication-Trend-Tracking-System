using System;

namespace ScientificJournal.API.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class ValidateModelAttribute : Attribute
{
}
