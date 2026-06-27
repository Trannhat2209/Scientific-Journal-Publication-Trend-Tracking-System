using System.Net;
using System.Text.Json;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.Common.Exceptions;

namespace ScientificJournal.API.Middleware
{
    // Bắt toàn bộ exception chưa được xử lý, trả về ApiResponse chuẩn thay vì lỗi HTML mặc định
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await XuLyLoi(context, ex);
            }
        }

        // Phân loại exception và trả về HTTP status code tương ứng
        private static async Task XuLyLoi(HttpContext context, Exception ex)
        {
            var (statusCode, message) = ex switch
            {
                NotFoundException      => (HttpStatusCode.NotFound,            ex.Message),
                UnauthorizedException  => (HttpStatusCode.Unauthorized,        ex.Message),
                BusinessRuleException  => (HttpStatusCode.BadRequest,          ex.Message),
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized,   ex.Message),
                _                      => (HttpStatusCode.InternalServerError, "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.")
            };

            context.Response.StatusCode  = (int)statusCode;
            context.Response.ContentType = "application/json";

            var response = ApiResponse.Fail(message);
            var json     = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }

    // Extension method để đăng ký middleware gọn hơn trong Program.cs
    public static class ExceptionHandlingMiddlewareExtensions
    {
        public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder app)
            => app.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
