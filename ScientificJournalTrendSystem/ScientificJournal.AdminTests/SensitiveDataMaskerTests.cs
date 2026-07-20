using ScientificJournal.API.Services;

namespace ScientificJournal.AdminTests;

public class SensitiveDataMaskerTests
{
    [Theory]
    [InlineData("Authorization: Bearer secret-token", "Authorization: Bearer [REDACTED]")]
    [InlineData("password=hunter2", "password=[REDACTED]")]
    [InlineData("{\"apiKey\":\"abc123\"}", "{\"apiKey\":\"[REDACTED]\"}")]
    public void Masks_common_secret_formats(string input, string expected) =>
        Assert.Equal(expected, SensitiveDataMasker.Mask(input));
}
