namespace BuildingBlocks.Results;

public record Result<T>
{
    public bool IsSuccess { get; init; }
    public string Message { get; init; } = string.Empty;
    public T? Data { get; init; }

    public static Result<T> Success(T data, string message = "Success") =>
        new()
        { IsSuccess = true, Data = data, Message = message };

    public static Result<T> Failure(string message) =>
        new()
        { IsSuccess = false, Message = message };
}
