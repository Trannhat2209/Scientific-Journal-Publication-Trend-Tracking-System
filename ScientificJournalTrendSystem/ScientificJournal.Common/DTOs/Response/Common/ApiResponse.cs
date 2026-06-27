namespace ScientificJournal.Common.DTOs.Response.Common
{
    // Wrapper chuẩn bọc toàn bộ response trả về client
    public record ApiResponse<T>(
        bool    Success,
        string? Message,
        T?      Data,
        List<string>? Errors = null
    );

    public static class ApiResponse
    {
        public static ApiResponse<T> Ok<T>(T data, string? message = null)
            => new(true, message, data);

        public static ApiResponse<object> Fail(string message, List<string>? errors = null)
            => new(false, message, null, errors);
    }
}
