using System.Diagnostics;
using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Behaviors;

public class LoggingBehavior<TRequest, TResponse>(
    ILogger<LoggingBehavior<TRequest, TResponse>> logger
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull, IRequest<TResponse>
    where TResponse : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var requestName = typeof(TRequest).Name;
        var responseName = typeof(TResponse).Name;

        logger.LogInformation(
            "[START] Handle request={Request} - Response={Response} - RequestData={RequestData}",
            requestName,
            responseName,
            JsonSerializer.Serialize(request)
        );

        var timer = new Stopwatch();
        timer.Start();

        try
        {
            var response = await next();

            timer.Stop();
            var timeTaken = timer.Elapsed;

            if (timeTaken.Seconds > 3)
                logger.LogWarning(
                    "[PERFORMANCE] The request {Request} took {TimeTaken} seconds.",
                    requestName,
                    timeTaken.Seconds
                );

            logger.LogInformation(
                "[END] Handled {Request} with {Response} - ResponseData={ResponseData}",
                requestName,
                responseName,
                JsonSerializer.Serialize(response)
            );

            return response;
        }
        catch (Exception ex)
        {
            timer.Stop();
            logger.LogError(
                ex,
                "[ERROR] Request {Request} failed after {TimeTaken}ms. Error: {Error}",
                requestName,
                timer.ElapsedMilliseconds,
                ex.Message
            );
            throw;
        }
    }
}
