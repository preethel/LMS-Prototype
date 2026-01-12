using System.Reflection;
using BuildingBlocks.Messaging.MassTransit;
using Hit.Portal.Services.Notifications.Consumers;
using Hit.Portal.Services.Notifications.Settings;
using MassTransit;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));

builder.Services.AddMessageBroker(
    builder.Configuration,
    "notifications-service",
    Assembly.GetExecutingAssembly()
);

var host = builder.Build();
host.Run();
