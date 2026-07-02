using ScientificJournal.Common.Enums;
using System.Text.Json;

namespace ScientificJournal.Common.Policies;

public static class PlanPolicy
{
    private static readonly object SyncRoot = new();

    private static readonly Dictionary<UserRole, int> DefaultFreeAccuracy =
        new()
        {
            [UserRole.Student] = 15,
            [UserRole.Lecturer] = 20,
            [UserRole.Researcher] = 25,
            [UserRole.Admin] = 100
        };

    private static readonly Dictionary<UserRole, int> DefaultProAccuracy =
        new()
        {
            [UserRole.Student] = 35,
            [UserRole.Lecturer] = 40,
            [UserRole.Researcher] = 45,
            [UserRole.Admin] = 100
        };

    private static Dictionary<UserRole, int> _freeAccuracy = new(DefaultFreeAccuracy);
    private static Dictionary<UserRole, int> _proAccuracy = new(DefaultProAccuracy);

    public static IReadOnlyDictionary<UserRole, int> FreeAccuracy
    {
        get
        {
            lock (SyncRoot)
            {
                return new Dictionary<UserRole, int>(_freeAccuracy);
            }
        }
    }

    public static IReadOnlyDictionary<UserRole, int> ProAccuracy
    {
        get
        {
            lock (SyncRoot)
            {
                return new Dictionary<UserRole, int>(_proAccuracy);
            }
        }
    }

    public static int MonthlyAmountVnd { get; private set; } = 125000;
    public static int YearlyAmountVnd { get; private set; } = 1225000;
    public static int MonthlyPriceUsd { get; private set; } = 5;
    public static int YearlyPriceUsd { get; private set; } = 49;
    public static int YearlySavingsPercent { get; private set; } = 2;
    public static int CheckoutHoldMinutes { get; private set; } = 15;

    public static int GetSearchAccuracy(UserRole role, bool isPro)
    {
        lock (SyncRoot)
        {
            var source = isPro ? _proAccuracy : _freeAccuracy;
            return source.TryGetValue(role, out var value)
                ? value
                : _freeAccuracy[UserRole.Researcher];
        }
    }

    public static PlanPolicySnapshot GetSnapshot()
    {
        lock (SyncRoot)
        {
            return new PlanPolicySnapshot
            {
                MonthlyPrice = MonthlyPriceUsd,
                YearlyPrice = YearlyPriceUsd,
                MonthlyAmountVnd = MonthlyAmountVnd,
                YearlyAmountVnd = YearlyAmountVnd,
                YearlySavingsPercent = YearlySavingsPercent,
                CheckoutHoldMinutes = CheckoutHoldMinutes,
                FreeAccuracy = ToStringDictionary(_freeAccuracy),
                ProAccuracy = ToStringDictionary(_proAccuracy)
            };
        }
    }

    public static PlanPolicySnapshot Update(PlanPolicySnapshot policy)
    {
        lock (SyncRoot)
        {
            MonthlyPriceUsd = Clamp(policy.MonthlyPrice, 1, 1000, MonthlyPriceUsd);
            YearlyPriceUsd = Clamp(policy.YearlyPrice, 1, 10000, YearlyPriceUsd);
            MonthlyAmountVnd = Clamp(policy.MonthlyAmountVnd, 1000, 100000000, MonthlyPriceUsd * 25000);
            YearlyAmountVnd = Clamp(policy.YearlyAmountVnd, 1000, 100000000, YearlyPriceUsd * 25000);
            YearlySavingsPercent = Clamp(policy.YearlySavingsPercent, 0, 90, YearlySavingsPercent);
            CheckoutHoldMinutes = Clamp(policy.CheckoutHoldMinutes, 1, 120, CheckoutHoldMinutes);
            _freeAccuracy = NormalizeAccuracy(policy.FreeAccuracy, DefaultFreeAccuracy);
            _proAccuracy = NormalizeAccuracy(policy.ProAccuracy, DefaultProAccuracy);
            _freeAccuracy[UserRole.Admin] = 100;
            _proAccuracy[UserRole.Admin] = 100;

            return GetSnapshot();
        }
    }

    public static PlanPolicySnapshot ResetDefaults()
    {
        lock (SyncRoot)
        {
            MonthlyAmountVnd = 125000;
            YearlyAmountVnd = 1225000;
            MonthlyPriceUsd = 5;
            YearlyPriceUsd = 49;
            YearlySavingsPercent = 2;
            CheckoutHoldMinutes = 15;
            _freeAccuracy = new Dictionary<UserRole, int>(DefaultFreeAccuracy);
            _proAccuracy = new Dictionary<UserRole, int>(DefaultProAccuracy);

            return GetSnapshot();
        }
    }

    public static void LoadFromFile(string filePath)
    {
        if (!File.Exists(filePath))
        {
            return;
        }

        var json = File.ReadAllText(filePath);
        var snapshot = JsonSerializer.Deserialize<PlanPolicySnapshot>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (snapshot != null)
        {
            Update(snapshot);
        }
    }

    public static void SaveToFile(string filePath)
    {
        var directory = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var json = JsonSerializer.Serialize(
            GetSnapshot(),
            new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(filePath, json);
    }

    private static Dictionary<UserRole, int> NormalizeAccuracy(
        Dictionary<string, int>? source,
        IReadOnlyDictionary<UserRole, int> fallback)
    {
        var next = new Dictionary<UserRole, int>(fallback);
        if (source == null)
        {
            return next;
        }

        foreach (var (key, value) in source)
        {
            if (Enum.TryParse<UserRole>(key, true, out var role))
            {
                next[role] = Math.Clamp(value, 0, 100);
            }
        }

        return next;
    }

    private static Dictionary<string, int> ToStringDictionary(IReadOnlyDictionary<UserRole, int> source) =>
        source.ToDictionary(item => item.Key.ToString(), item => item.Value);

    private static int Clamp(int value, int min, int max, int fallback) =>
        value >= min && value <= max ? value : fallback;
}

public sealed class PlanPolicySnapshot
{
    public int MonthlyPrice { get; set; } = 5;
    public int YearlyPrice { get; set; } = 49;
    public int MonthlyAmountVnd { get; set; } = 125000;
    public int YearlyAmountVnd { get; set; } = 1225000;
    public int YearlySavingsPercent { get; set; } = 2;
    public int CheckoutHoldMinutes { get; set; } = 15;
    public Dictionary<string, int>? FreeAccuracy { get; set; }
    public Dictionary<string, int>? ProAccuracy { get; set; }
}
