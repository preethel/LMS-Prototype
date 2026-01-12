using BuildingBlocks.Messaging.Events;

namespace BuildingBlocks.Messaging.Events;

public record SendEmailEvent(string To, string Subject, string Body) : IntegrationEvent;
