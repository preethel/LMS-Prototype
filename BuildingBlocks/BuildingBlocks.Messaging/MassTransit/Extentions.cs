using System.ComponentModel.DataAnnotations;
using System.Reflection;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Messaging.MassTransit;

public static class Extensions
{
    public static IServiceCollection AddMessageBroker(
        this IServiceCollection services,
        IConfiguration configuration,
        string serviceName,
        Assembly? assembly = null
    )
    {
        services.AddMassTransit(config =>
        {
            config.SetEndpointNameFormatter(new ServiceEndpointNameFormatter(serviceName));

            if (assembly != null)
                config.AddConsumers(assembly);

            config.UsingRabbitMq(
                (context, configurator) =>
                {
                    configurator.Host(
                        new Uri(configuration["MessageBroker:Host"]!),
                        host =>
                        {
                            host.Username(configuration["MessageBroker:UserName"]);
                            host.Password(configuration["MessageBroker:Password"]);
                        }
                    );

                    configurator.UseInMemoryOutbox(context);

                    configurator.UseMessageRetry(r =>
                    {
                        r.Exponential(
                            retryLimit: 5,
                            minInterval: TimeSpan.FromSeconds(1),
                            maxInterval: TimeSpan.FromSeconds(30),
                            intervalDelta: TimeSpan.FromSeconds(2)
                        );

                        // Skip retry for validation errors
                        r.Ignore<ValidationException>();
                        r.Ignore<ArgumentException>();
                        r.Ignore<InvalidOperationException>();
                    });

                    // 𝗕𝗘𝗦𝗧 𝗣𝗥𝗔𝗖𝗧𝗜𝗖𝗘: Circuit breaker pattern
                    configurator.UseCircuitBreaker(cb =>
                    {
                        cb.TrackingPeriod = TimeSpan.FromMinutes(1);
                        cb.TripThreshold = 15;
                        cb.ActiveThreshold = 10;
                        cb.ResetInterval = TimeSpan.FromMinutes(5);
                    });

                    // Enable Dead Letter Queue automatically for all endpoints
                    configurator.ConfigureEndpoints(context);

                    // 𝗕𝗘𝗦𝗧 𝗣𝗥𝗔𝗖𝗧𝗜𝗖𝗘: Performance tuning
                    configurator.PrefetchCount = 50;
                    configurator.ConcurrentMessageLimit = 20;

                    var logger = context.GetRequiredService<ILogger<LoggingReceiveObserver>>();

                    configurator.ConnectReceiveObserver(new LoggingReceiveObserver(logger));
                }
            );
        });

        return services;
    }
}

public class ServiceEndpointNameFormatter(string serviceName)
    : KebabCaseEndpointNameFormatter(includeNamespace: false)
{
    public override string Consumer<T>()
    {
        return $"{serviceName}-{base.Consumer<T>()}";
    }
}

public class LoggingReceiveObserver(ILogger<LoggingReceiveObserver> logger) : IReceiveObserver
{
    public Task ConsumeFault<T>(
        ConsumeContext<T> context,
        TimeSpan duration,
        string consumerType,
        Exception exception
    )
        where T : class
    {
        logger.LogError($"[Consumer] Fault consuming {consumerType}: {exception.Message}");
        return Task.CompletedTask;
    }

    public Task PostConsume<T>(ConsumeContext<T> context, TimeSpan duration, string consumerType)
        where T : class
    {
        logger.LogInformation($"[Consumer] Successfully consumed {consumerType}");
        return Task.CompletedTask;
    }

    public Task PostReceive(ReceiveContext context)
    {
        logger.LogInformation($"[Receive] Message received from {context.InputAddress}");
        return Task.CompletedTask;
    }

    public Task PreReceive(ReceiveContext context)
    {
        logger.LogInformation(
            $"[Receive] Preparing to receive message from {context.InputAddress}"
        );
        return Task.CompletedTask;
    }

    public Task ReceiveFault(ReceiveContext context, Exception exception)
    {
        logger.LogError($"[Receive] Fault occurred: {exception.Message}");
        return Task.CompletedTask;
    }
}
