using ScientificJournal.Common.DTOs.Request;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;

namespace ScientificJournal.Business.Services.Interfaces
{
    // Interface định nghĩa nghiệp vụ đồng bộ dữ liệu
    public interface ISyncService
    {
        // Lấy lịch sử đồng bộ
        Task<IEnumerable<SyncLogResponseDto>> GetSyncLogsAsync(string? status, int page, int pageSize);

        // Kích hoạt đồng bộ dữ liệu từ SemanticScholar hoặc OpenAlex
        Task<ApiResponse<SyncLogResponseDto>> TriggerSyncAsync(Guid adminUserId, TriggerSyncRequestDto request);
    }
}
