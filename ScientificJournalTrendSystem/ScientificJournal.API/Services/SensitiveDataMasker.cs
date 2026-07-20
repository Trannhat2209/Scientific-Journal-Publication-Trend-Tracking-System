using System.Text.RegularExpressions;

namespace ScientificJournal.API.Services;

public static partial class SensitiveDataMasker
{
    public static string? Mask(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return value;
        var masked = BearerRegex().Replace(value, "$1[REDACTED]");
        return SecretFieldRegex().Replace(masked, "$1[REDACTED]");
    }

    [GeneratedRegex("(?i)(bearer\\s+)[a-z0-9._~+\\-/=]+")]
    private static partial Regex BearerRegex();

    [GeneratedRegex("(?i)(\\\"?(?:password|passcode|token|access_token|refresh_token|api[_-]?key|client_secret|checksum_key)\\\"?\\s*[:=]\\s*\\\"?)[^\\\"&,}\\s]+")]
    private static partial Regex SecretFieldRegex();
}
