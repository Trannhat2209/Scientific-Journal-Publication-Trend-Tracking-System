using System;

namespace ScientificJournal.DataAccess.Entities;

/// <summary>
/// Computes the "1 month free trial" plan rule purely from the existing CreatedAt column,
/// so no new database column is required. A brand-new account behaves as if it were Pro
/// for its first 30 days; after that, only users who have actually purchased Pro
/// (IsPro == true) keep Pro-level access.
/// </summary>
public static class UserPlanExtensions
{
    private const int FreeTrialDays = 30;

    public static bool IsInFreeTrial(this User user) =>
        !user.IsPro && (DateTime.UtcNow - user.CreatedAt).TotalDays <= FreeTrialDays;

    /// <summary>True if the user should currently get Pro-level search accuracy,
    /// whether because they paid for Pro or because they're still inside the free trial window.</summary>
    public static bool HasProAccess(this User user) => user.IsPro || user.IsInFreeTrial();

    /// <summary>When the free trial ends for this user, or null if they already paid for Pro
    /// (and therefore have no trial expiry to track).</summary>
    public static DateTime? TrialEndsAt(this User user) =>
        user.IsPro ? null : user.CreatedAt.AddDays(FreeTrialDays);
}
