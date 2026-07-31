using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Configurations;

namespace ScientificJournal.Business.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly SmtpSettings _smtpSettings;

    public EmailService(ILogger<EmailService> logger, IOptions<SmtpSettings> smtpSettings)
    {
        _logger = logger;
        _smtpSettings = smtpSettings.Value;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        if (string.IsNullOrWhiteSpace(_smtpSettings.Username) || string.IsNullOrWhiteSpace(_smtpSettings.Password))
        {
            var baseDir = Directory.GetCurrentDirectory();
            var wwwroot = Path.Combine(baseDir, "ScientificJournal.API", "wwwroot");
            if (!Directory.Exists(wwwroot))
            {
                wwwroot = Path.Combine(baseDir, "wwwroot");
            }

            var emailDir = Path.Combine(wwwroot, "emails");
            if (!Directory.Exists(emailDir))
            {
                Directory.CreateDirectory(emailDir);
            }

            var fileName = $"email_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{new Random().Next(1000, 9999)}.html";
            var filePath = Path.Combine(emailDir, fileName);

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6; }}
        .email-container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }}
        .header {{ background: linear-gradient(135deg, #4f46e5, #4338ca); color: #ffffff; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px; }}
        .meta {{ background-color: #f9fafb; padding: 15px 25px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #4b5563; }}
        .meta p {{ margin: 6px 0; }}
        .body {{ padding: 35px 25px; line-height: 1.7; color: #1f2937; font-size: 16px; white-space: pre-wrap; }}
        .footer {{ background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <h1>Scientific Journal Trend System</h1>
        </div>
        <div class='meta'>
            <p><strong>To:</strong> {to}</p>
            <p><strong>Subject:</strong> {subject}</p>
            <p><strong>Sent Date:</strong> {DateTime.Now:dd/MM/yyyy HH:mm:ss}</p>
        </div>
        <div class='body'>{body}</div>
        <div class='footer'>
            &copy; 2026 Scientific Journal Publication Trend Tracking System. Local Mailbox Mode.
        </div>
    </div>
</body>
</html>";

            await System.IO.File.WriteAllTextAsync(filePath, htmlContent);

            _logger.LogWarning("\n==================================================" +
                               "\n[LOCAL MAILBOX SAVED]" +
                               $"\nTo: {to}" +
                               $"\nSubject: {subject}" +
                               $"\nOpen in browser: http://localhost:5227/emails/{fileName}" +
                               "\n==================================================");
            return;
        }

        try
        {
            using var mailMessage = new MailMessage
            {
                From = new MailAddress(string.IsNullOrWhiteSpace(_smtpSettings.From) ? _smtpSettings.Username : _smtpSettings.From),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            mailMessage.To.Add(to);

            using var smtpClient = new SmtpClient(_smtpSettings.Host, _smtpSettings.Port)
            {
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password),
                EnableSsl = _smtpSettings.EnableSsl
            };

            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation($"Email sent successfully to {to}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send email to {to}");
            throw;
        }
    }
}
