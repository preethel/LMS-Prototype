namespace BuildingBlocks.Messaging.Events;

public record IntegrationEvent
{
    public Guid Id => Guid.NewGuid();
    public string EventType => GetType().AssemblyQualifiedName ?? string.Empty;
}
