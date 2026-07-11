namespace ScientificJournal.Common.Configurations;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public int ExpiryInDays { get; set; } = 7;
}