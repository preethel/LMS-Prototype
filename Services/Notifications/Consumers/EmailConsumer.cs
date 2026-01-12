using BuildingBlocks.Messaging.Events;
using Hit.Portal.Services.Notifications.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Hit.Portal.Services.Notifications.Consumers;

public class EmailConsumer : IConsumer<SendEmailEvent>
{
    private readonly SmtpSettings _smtpSettings;
    private readonly ILogger<EmailConsumer> _logger;

    public EmailConsumer(IOptions<SmtpSettings> smtpSettings, ILogger<EmailConsumer> logger)
    {
        _smtpSettings = smtpSettings.Value;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SendEmailEvent> context)
    {
        _logger.LogInformation(
            "Sending email to {To} with subject {Subject}",
            context.Message.To,
            context.Message.Subject
        );

        // Basic validation
        if (string.IsNullOrWhiteSpace(_smtpSettings.Host))
        {
            _logger.LogError("SMTP Host is not configured. Cannot send email.");
            throw new InvalidOperationException("SMTP Host is not configured.");
        }

        try
        {
            using var client = new SmtpClient();

            // Connect
            await client.ConnectAsync(
                _smtpSettings.Host,
                _smtpSettings.Port,
                SecureSocketOptions.Auto
            );

            // Authenticate
            if (!string.IsNullOrEmpty(_smtpSettings.UserName))
            {
                await client.AuthenticateAsync(_smtpSettings.UserName, _smtpSettings.Password);
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_smtpSettings.FromName, _smtpSettings.FromEmail));
            message.To.Add(new MailboxAddress("", context.Message.To));
            message.Subject = context.Message.Subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = context.Message.Body };
            message.Body = bodyBuilder.ToMessageBody();

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {To}", context.Message.To);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", context.Message.To);
            throw;
        }
    }
}
