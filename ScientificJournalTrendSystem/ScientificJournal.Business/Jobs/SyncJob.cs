using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.Business.Jobs
{
    // Hangfire recurring job — tự động đồng bộ dữ liệu theo lịch định kỳ
    // Đăng ký trong Program.cs: RecurringJob.AddOrUpdate<SyncJob>("sync-job", j => j.ExecuteAsync("SemanticScholar"), Cron.Daily);
    public class SyncJob
    {
        private readonly ISyncLogRepository _syncLogRepo;

        public SyncJob(ISyncLogRepository syncLogRepo)
        {
            _syncLogRepo = syncLogRepo;
        }

        // Thực thi đồng bộ dữ liệu từ nguồn API chỉ định
        // Cập nhật trạng thái sync log: Running → Completed hoặc Failed
        public async Task ExecuteAsync(string sourceApi)
        {
            var syncLog = new DataAccess.Entities.SyncLog
            {
                SourceApi = sourceApi,
                Status    = "Running",
                StartedAt = DateTime.UtcNow
            };

            var created = await _syncLogRepo.AddAsync(syncLog);

            try
            {
                // TODO: Gọi SemanticScholarClient hoặc OpenAlexClient để lấy dữ liệu
                // TODO: Chuẩn hoá metadata và lưu vào database
                // TODO: Cập nhật TrendingMetric sau khi sync xong

                created.Status        = "Completed";
                created.RecordsSynced = 0;
                created.FinishedAt    = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                // Ghi nhận lỗi vào sync log nếu đồng bộ thất bại
                created.Status       = "Failed";
                created.ErrorMessage = ex.Message;
                created.FinishedAt   = DateTime.UtcNow;
            }
            finally
            {
                await _syncLogRepo.UpdateAsync(created);
            }
        }
    }
}
