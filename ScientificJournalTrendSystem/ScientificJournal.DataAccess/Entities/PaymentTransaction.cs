using System;

namespace ScientificJournal.DataAccess.Entities;

public class PaymentTransaction
{
    public int Id { get; set; }
    public long OrderCode { get; set; }
    public string? PaymentLinkId { get; set; }
    public string? CheckoutUrl { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string BillingCycle { get; set; } = "yearly";
    public string Plan { get; set; } = "Pro";
    public int Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public string? PayosReference { get; set; }
    public string? RawWebhookJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
