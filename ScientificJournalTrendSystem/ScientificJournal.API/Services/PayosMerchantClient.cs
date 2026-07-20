using System.Globalization;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ScientificJournal.API.Services;

public class PayosMerchantClient
{
    private const string PayosBaseUrl = "https://api-merchant.payos.vn";
    private const int DefaultTimeoutSeconds = 12;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public PayosMerchantClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _httpClient.BaseAddress ??= new Uri(PayosBaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(GetTimeoutSeconds());
    }

    public async Task<PayosPaymentLinkData> CreatePaymentLinkAsync(CreatePayosPaymentLinkRequest request)
    {
        EnsureConfigured();

        var signature = CreatePaymentRequestSignature(
            request.Amount,
            request.CancelUrl,
            request.Description,
            request.OrderCode,
            request.ReturnUrl);

        var payload = new
        {
            request.OrderCode,
            request.Amount,
            request.Description,
            request.BuyerName,
            request.BuyerEmail,
            request.Items,
            request.CancelUrl,
            request.ReturnUrl,
            request.ExpiredAt,
            Signature = signature
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/v2/payment-requests")
        {
            Content = JsonContent.Create(payload, options: _jsonOptions)
        };
        AddAuthHeaders(httpRequest);

        var response = await SendPayosRequestAsync(httpRequest);
        var result = await ReadPayosResponseAsync<PayosPaymentLinkData>(response);
        return result.Data ?? throw new InvalidOperationException(result.Desc ?? "PayOS did not return payment link data.");
    }

    public async Task<PayosPaymentInformationData> GetPaymentInformationAsync(long orderCode)
    {
        EnsureConfigured();

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/v2/payment-requests/{orderCode}");
        AddAuthHeaders(request);

        var response = await SendPayosRequestAsync(request);
        var result = await ReadPayosResponseAsync<PayosPaymentInformationData>(response);
        return result.Data ?? throw new InvalidOperationException(result.Desc ?? "PayOS did not return payment data.");
    }

    public async Task<PayosPaymentInformationData> CancelPaymentLinkAsync(long orderCode, string reason)
    {
        EnsureConfigured();

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/v2/payment-requests/{orderCode}/cancel")
        {
            Content = JsonContent.Create(new { cancellationReason = reason }, options: _jsonOptions)
        };
        AddAuthHeaders(request);

        var response = await SendPayosRequestAsync(request);
        var result = await ReadPayosResponseAsync<PayosPaymentInformationData>(response);
        return result.Data ?? throw new InvalidOperationException(result.Desc ?? "PayOS did not return cancellation data.");
    }

    public bool VerifyWebhookSignature(JsonElement payload)
    {
        if (!payload.TryGetProperty("data", out var data) ||
            !payload.TryGetProperty("signature", out var signatureElement))
        {
            return false;
        }

        var providedSignature = signatureElement.GetString() ?? string.Empty;
        var expectedSignature = CreateSignature(BuildSortedDataString(data));
        return FixedTimeEquals(providedSignature, expectedSignature);
    }

    private void AddAuthHeaders(HttpRequestMessage request)
    {
        request.Headers.TryAddWithoutValidation("x-client-id", GetRequiredConfig("PAYOS_CLIENT_ID", "Payments:PayOS:ClientId"));
        request.Headers.TryAddWithoutValidation("x-api-key", GetRequiredConfig("PAYOS_API_KEY", "Payments:PayOS:ApiKey"));
    }

    private void EnsureConfigured()
    {
        _ = GetRequiredConfig("PAYOS_CLIENT_ID", "Payments:PayOS:ClientId");
        _ = GetRequiredConfig("PAYOS_API_KEY", "Payments:PayOS:ApiKey");
        _ = GetRequiredConfig("PAYOS_CHECKSUM_KEY", "Payments:PayOS:ChecksumKey");
    }

    private int GetTimeoutSeconds()
    {
        var configured =
            _configuration.GetValue<int?>("Payments:PayOS:TimeoutSeconds") ??
            _configuration.GetValue<int?>("PAYOS_TIMEOUT_SECONDS");
        return configured is > 0 ? configured.Value : DefaultTimeoutSeconds;
    }

    private async Task<HttpResponseMessage> SendPayosRequestAsync(HttpRequestMessage request)
    {
        try
        {
            return await _httpClient.SendAsync(request);
        }
        catch (TaskCanceledException exception)
        {
            throw new TimeoutException("PayOS did not respond before the request timed out.", exception);
        }
        catch (HttpRequestException exception)
        {
            throw new InvalidOperationException("Could not connect to PayOS. Please check network access and PayOS credentials.", exception);
        }
    }

    private string GetRequiredConfig(string envKey, string configKey)
    {
        var value = _configuration[configKey];
        if (string.IsNullOrWhiteSpace(value))
        {
            value = _configuration[envKey];
        }

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"PayOS configuration is missing: {configKey} / {envKey}.");
        }

        return value;
    }

    private string CreatePaymentRequestSignature(int amount, string cancelUrl, string description, long orderCode, string returnUrl)
    {
        var data = string.Join("&", new[]
        {
            $"amount={amount}",
            $"cancelUrl={cancelUrl}",
            $"description={description}",
            $"orderCode={orderCode}",
            $"returnUrl={returnUrl}"
        });

        return CreateSignature(data);
    }

    private string CreateSignature(string data)
    {
        var checksumKey = GetRequiredConfig("PAYOS_CHECKSUM_KEY", "Payments:PayOS:ChecksumKey");
        var keyBytes = Encoding.UTF8.GetBytes(checksumKey);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        using var hmac = new HMACSHA256(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }

    private static string BuildSortedDataString(JsonElement data)
    {
        return string.Join("&", data.EnumerateObject()
            .OrderBy(property => property.Name, StringComparer.Ordinal)
            .Select(property => $"{property.Name}={JsonElementToSignatureValue(property.Value)}"));
    }

    private static string JsonElementToSignatureValue(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.Null or JsonValueKind.Undefined => string.Empty,
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => value.GetRawText()
        };
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left);
        var rightBytes = Encoding.UTF8.GetBytes(right);
        return leftBytes.Length == rightBytes.Length &&
               CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private async Task<PayosApiResponse<T>> ReadPayosResponseAsync<T>(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<PayosApiResponse<T>>(body, _jsonOptions);

        if (!response.IsSuccessStatusCode || result == null || result.Code != "00")
        {
            var message = result?.Desc ?? body;
            throw new InvalidOperationException($"PayOS request failed: {message}");
        }

        return result;
    }
    public async Task<(bool Operational, string Detail)> ProbeAsync()
    {
        EnsureConfigured();
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api-merchant.payos.vn/v2/payment-requests/0");
        request.Headers.TryAddWithoutValidation("x-client-id", GetRequiredConfig("PAYOS_CLIENT_ID", "Payments:PayOS:ClientId"));
        request.Headers.TryAddWithoutValidation("x-api-key", GetRequiredConfig("PAYOS_API_KEY", "Payments:PayOS:ApiKey"));
        using var response = await SendPayosRequestAsync(request);
        if (response.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden)
            return (false, $"HTTP {(int)response.StatusCode}: credentials rejected");
        return (true, $"API reachable (HTTP {(int)response.StatusCode})");
    }
}

public class CreatePayosPaymentLinkRequest
{
    public long OrderCode { get; set; }
    public int Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
    public string ReturnUrl { get; set; } = string.Empty;
    public string? BuyerName { get; set; }
    public string? BuyerEmail { get; set; }
    public int? ExpiredAt { get; set; }
    public List<PayosPaymentItem> Items { get; set; } = new();
}

public class PayosPaymentItem
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int Price { get; set; }
}

public class PayosApiResponse<T>
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string? Desc { get; set; }

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("signature")]
    public string? Signature { get; set; }
}

public class PayosPaymentLinkData
{
    public string? Bin { get; set; }
    public string? AccountNumber { get; set; }
    public int Amount { get; set; }
    public string? Description { get; set; }
    public long OrderCode { get; set; }
    public string? PaymentLinkId { get; set; }
    public string? Status { get; set; }
    public int? ExpiredAt { get; set; }
    public string? CheckoutUrl { get; set; }
    public string? QrCode { get; set; }
}

public class PayosPaymentInformationData
{
    public string? Id { get; set; }
    public long OrderCode { get; set; }
    public int Amount { get; set; }
    public int AmountPaid { get; set; }
    public int AmountRemaining { get; set; }
    public string Status { get; set; } = "PENDING";
    public string? CreatedAt { get; set; }
    public string? CanceledAt { get; set; }
    public string? CancellationReason { get; set; }
    public JsonElement Transactions { get; set; }

    public string? GetFirstTransactionReference()
    {
        if (Transactions.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var transaction in Transactions.EnumerateArray())
        {
            if (transaction.TryGetProperty("reference", out var reference))
            {
                return reference.GetString();
            }
        }

        return null;
    }
}
