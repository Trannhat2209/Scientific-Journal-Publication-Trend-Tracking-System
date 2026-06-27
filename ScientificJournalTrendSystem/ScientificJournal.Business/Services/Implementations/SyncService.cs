using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Constants;
using ScientificJournal.Common.DTOs.Request;
using ScientificJournal.Common.DTOs.Response;
using ScientificJournal.Common.DTOs.Response.Common;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.Business.Services.Implementations
{
    public class SyncService : ISyncService
    {
        private readonly ISyncLogRepository _repo;
        public SyncService(ISyncLogRepository repo) => _repo = repo;

        // Lấy lịch sử đồng bộ, lọc theo trạng thái và phân trang
        public async Task<IEnumerable<SyncLogResponseDto>> GetSyncLogsAsync(string? status, int page, int pageSize)
        {
            var list = await _repo.GetAllAsync(status, page, pageSize);
            return list.Select(s => new SyncLogResponseDto(
                s.Id, s.TriggeredByUserId, s.TriggeredByUser?.FullName,
                s.SourceApi, s.Status, s.RecordsSynced, s.ErrorMessage,
                s.StartedAt, s.FinishedAt
            ));
        }

        // Kích hoạt đồng bộ dữ liệu, tạo sync log với trạng thái Running
        public async Task<ApiResponse<SyncLogResponseDto>> TriggerSyncAsync(Guid adminUserId, TriggerSyncRequestDto request)
        {
            var nguonHopLe = new[] { "SemanticScholar", "OpenAlex" };
            if (!nguonHopLe.Contains(request.SourceApi))
                return new ApiResponse<SyncLogResponseDto>(false, ErrorMessages.SyncSourceApiInvalid, null);

            var syncLog = new SyncLog
            {
                TriggeredByUserId = adminUserId,
                SourceApi         = request.SourceApi,
                Status            = "Running",
                StartedAt         = DateTime.UtcNow
            };

            var created = await _repo.AddAsync(syncLog);

            // TODO: Enqueue Hangfire job SyncJob để thực hiện đồng bộ thực tế
            // BackgroundJob.Enqueue<SyncJob>(j => j.ExecuteAsync(created.Id, request.SourceApi));

            var result = new SyncLogResponseDto(
                created.Id, created.TriggeredByUserId, null,
                created.SourceApi, created.Status,
                created.RecordsSynced, created.ErrorMessage,
                created.StartedAt, created.FinishedAt
            );
            return ApiResponse.Ok(result, $"Đã khởi động đồng bộ từ {request.SourceApi}.");
        }
    }
}
