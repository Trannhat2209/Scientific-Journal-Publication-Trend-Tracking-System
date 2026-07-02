using ScientificJournal.Common.Enums;

namespace ScientificJournal.Common.Policies;

public static class PlanPolicy
{
    public static readonly IReadOnlyDictionary<UserRole, int> FreeAccuracy =
        new Dictionary<UserRole, int>
        {
            [UserRole.Student] = 15,
            [UserRole.Lecturer] = 20,
            [UserRole.Researcher] = 25,
            [UserRole.Admin] = 100
        };

    public static readonly IReadOnlyDictionary<UserRole, int> ProAccuracy =
        new Dictionary<UserRole, int>
        {
            [UserRole.Student] = 35,
            [UserRole.Lecturer] = 40,
            [UserRole.Researcher] = 45,
            [UserRole.Admin] = 100
        };

    public const int MonthlyAmountVnd = 125000;
    public const int YearlyAmountVnd = 1225000;
    public const int MonthlyPriceUsd = 5;
    public const int YearlyPriceUsd = 49;

    public static int GetSearchAccuracy(UserRole role, bool isPro)
    {
        var source = isPro ? ProAccuracy : FreeAccuracy;
        return source.TryGetValue(role, out var value)
            ? value
            : FreeAccuracy[UserRole.Researcher];
    }
}
