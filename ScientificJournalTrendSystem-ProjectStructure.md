# Scientific Journal Publication Trend Tracking System
## Cấu trúc dự án hoàn chỉnh — Backend + Frontend

---

## BACKEND — ASP.NET Core 8 (3-Layer Architecture)

```
ScientificJournalTrendSystem/
├── ScientificJournal.sln
│
├── ScientificJournal.API/                          ← Tầng API (nhận request, trả response)
│   ├── ScientificJournal.API.csproj
│   ├── Program.cs                                  ← Cấu hình app, DI, middleware pipeline
│   ├── appsettings.json                            ← Connection string, JWT config, Hangfire config
│   ├── appsettings.Development.json                ← Override settings cho môi trường dev
│   │
│   ├── Controllers/
│   │   ├── AuthController.cs                       ← POST /auth/register, /auth/login, /auth/refresh, /auth/forgot-password
│   │   ├── PublicationsController.cs               ← GET /publications (search), GET /publications/{id} (detail + similarity + related)
│   │   ├── TrendsController.cs                     ← GET /trends?keyword=, GET /trends/top-keywords, GET /trends/score
│   │   ├── BookmarksController.cs                  ← GET/POST/DELETE /bookmarks
│   │   ├── FollowsController.cs                    ← GET/POST/DELETE /follows (keyword hoặc journal)
│   │   ├── NotificationsController.cs              ← GET /notifications, PUT /notifications/{id}/read
│   │   ├── DashboardController.cs                  ← GET /dashboard/stats, GET /dashboard/growth, POST /dashboard/export
│   │   └── AdminController.cs                      ← CRUD users, GET /admin/sync-logs, POST /admin/sync/trigger
│   │
│   ├── Middleware/
│   │   ├── ExceptionHandlingMiddleware.cs           ← Bắt toàn bộ exception, trả lỗi dạng ApiResponse chuẩn
│   │   └── JwtAuthenticationMiddleware.cs           ← Validate JWT token từ header Authorization
│   │
│   ├── Filters/
│   │   ├── AuthorizeRolesAttribute.cs               ← [AuthorizeRoles("Admin", "Researcher")] — kiểm tra role
│   │   └── ValidateModelAttribute.cs                ← Tự động trả 400 nếu model không hợp lệ
│   │
│   ├── Hubs/
│   │   └── NotificationHub.cs                       ← SignalR Hub — push real-time notification đến client
│   │
│   └── Extensions/
│       └── ServiceCollectionExtensions.cs           ← Đăng ký tất cả service, repo, Hangfire, MongoDB vào DI container
│
│
├── ScientificJournal.Business/                      ← Tầng nghiệp vụ (logic xử lý)
│   ├── ScientificJournal.Business.csproj
│   │
│   ├── Services/
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs                      ← Interface: Register, Login, RefreshToken, ForgotPassword
│   │   │   ├── IPublicationService.cs               ← Interface: Search, GetDetail, GetSimilarity, GetRelated
│   │   │   ├── ITrendingService.cs                  ← Interface: GetTrendingScore, GetTopKeywords, GetGrowthChart
│   │   │   ├── IBookmarkService.cs                  ← Interface: GetAll, Add, Remove
│   │   │   ├── IFollowService.cs                    ← Interface: GetAll, Follow, Unfollow
│   │   │   ├── INotificationService.cs              ← Interface: GetAll, MarkRead, CreateNotification
│   │   │   ├── IDashboardService.cs                 ← Interface: GetStats, GetGrowthData, ExportExcel
│   │   │   ├── ISyncService.cs                      ← Interface: SyncFromSemanticScholar, SyncFromOpenAlex(RQ2)
│   │   │   └── IExportService.cs                    ← Interface: ExportToExcel, ExportToCsv
│   │   │
│   │   └── Implementations/
│   │       ├── AuthService.cs                       ← Xử lý đăng ký/đăng nhập, hash password, cấp JWT
│   │       ├── PublicationService.cs                ← Search full-text, tính Similarity Score realtime, lấy Related Publications
│   │       ├── TrendingService.cs                   ← Tính Strategy A (Raw Count) và Strategy B (Growth Rate %)
│   │       ├── BookmarkService.cs                   ← CRUD bookmark cho user
│   │       ├── FollowService.cs                     ← Follow/unfollow keyword hoặc journal
│   │       ├── NotificationService.cs               ← Tạo notification khi có pub mới khớp follow, push SignalR
│   │       ├── DashboardService.cs                  ← Tổng hợp stats, group by year, top keywords
│   │       ├── SyncService.cs                       ← Gọi SemanticScholarClient, chuẩn hóa metadata, lưu DB
│   │       └── ExportService.cs                     ← Tạo file Excel/CSV từ dữ liệu trend
│   │
│   ├── Jobs/
│   │   └── SyncJob.cs                               ← Hangfire recurring job — gọi SyncService theo lịch định kỳ
│   │
│   ├── Validators/
│   │   ├── RegisterRequestValidator.cs              ← FluentValidation: validate email, password, fullname
│   │   ├── PublicationSearchValidator.cs            ← Validate keyword không rỗng, pageSize hợp lệ
│   │   └── ExportRequestValidator.cs                ← Validate year range, format (Excel/CSV)
│   │
│   └── BusinessRules/
│       ├── SimilarityCalculationRule.cs             ← Rule tính Similarity Score từ Title + Abstract + Keywords
│       ├── DuplicateRiskRule.cs                     ← Rule: Similarity > 50% → đánh dấu Duplicate Risk
│       └── TrendingScoreRule.cs                     ← Rule: Strategy B formula = (Y2−Y1)/(Y1+1)×100
│
│
├── ScientificJournal.Common/                        ← Dùng chung giữa tất cả các tầng
│   ├── ScientificJournal.Common.csproj
│   │
│   ├── DTOs/
│   │   ├── Request/
│   │   │   ├── Auth/
│   │   │   │   ├── RegisterRequestDto.cs            ← { Email, Password, FullName, Role }
│   │   │   │   ├── LoginRequestDto.cs               ← { Email, Password }
│   │   │   │   └── ForgotPasswordRequestDto.cs      ← { Email }
│   │   │   ├── Publication/
│   │   │   │   └── PublicationSearchRequestDto.cs   ← { Keyword, Year, JournalId, Page, PageSize, SortBy }
│   │   │   ├── Trend/
│   │   │   │   └── TrendQueryRequestDto.cs          ← { Keyword, FromYear, ToYear, Strategy }
│   │   │   └── Export/
│   │   │       └── ExportRequestDto.cs              ← { Keyword, FromYear, ToYear, Format }
│   │   │
│   │   └── Response/
│   │       ├── Common/
│   │       │   ├── ApiResponse.cs                   ← Wrapper chuẩn { Success, Message, Data, Errors }
│   │       │   └── PaginatedResponse.cs             ← { Items, TotalCount, Page, PageSize, TotalPages }
│   │       ├── Auth/
│   │       │   └── AuthResponseDto.cs               ← { AccessToken, RefreshToken, ExpiresAt, User }
│   │       ├── Publication/
│   │       │   ├── PublicationDto.cs                ← { Id, Title, Abstract, Year, DOI, Journal, Authors, Keywords, CitationCount }
│   │       │   ├── PublicationDetailDto.cs          ← PublicationDto + SimilarityScore + RelatedPublications + IsDuplicateRisk
│   │       │   └── RelatedPublicationDto.cs         ← { PublicationId, Title, SimilarityScore, IsDuplicateRisk }
│   │       ├── Trend/
│   │       │   ├── TrendingMetricDto.cs             ← { Keyword, Year, PublicationCount, TrendingScore }
│   │       │   └── TopKeywordDto.cs                 ← { Keyword, TotalCount, TrendingScore }
│   │       ├── Dashboard/
│   │       │   └── DashboardStatsDto.cs             ← { TotalPublications, TotalKeywords, TotalUsers, RecentSyncAt }
│   │       └── User/
│   │           └── UserProfileDto.cs                ← { Id, FullName, Email, Role }
│   │
│   ├── Enums/
│   │   ├── UserRole.cs                              ← Admin, Researcher, Lecturer, Student
│   │   ├── TrendingStrategy.cs                      ← StrategyA_RawCount, StrategyB_GrowthRate
│   │   ├── FollowType.cs                            ← Keyword, Journal
│   │   ├── ExportFormat.cs                          ← Excel, Csv
│   │   └── SyncStatus.cs                            ← Running, Completed, Failed
│   │
│   ├── Exceptions/
│   │   ├── NotFoundException.cs                     ← Ném khi không tìm thấy resource (404)
│   │   ├── UnauthorizedException.cs                 ← Ném khi không có quyền (401/403)
│   │   └── BusinessRuleException.cs                 ← Ném khi vi phạm business rule (400)
│   │
│   ├── Helpers/
│   │   ├── JwtHelper.cs                             ← GenerateToken, ValidateToken, ExtractClaims
│   │   ├── PasswordHasher.cs                        ← BCrypt hash + verify
│   │   └── SimilarityHelper.cs                      ← Tính Jaccard/Cosine similarity từ keyword set
│   │
│   └── Constants/
│       ├── AppSettings.cs                           ← Tên key trong appsettings (JWT_SECRET, CONNECTION_STRING...)
│       └── ErrorMessages.cs                         ← Chuỗi lỗi dùng chung toàn hệ thống
│
│
└── ScientificJournal.DataAccess/                    ← Tầng dữ liệu (EF Core + MongoDB)
    ├── ScientificJournal.DataAccess.csproj
    │
    ├── Entities/                                    ← Mapping 1:1 với bảng trong SQL Server
    │   ├── User.cs                                  ← UserId, Email, PasswordHash, FullName, Role, IsActive, IsDeleted
    │   ├── Journal.cs                               ← JournalId, Name, Publisher, ISSNOnline, IsDeleted
    │   ├── Publication.cs                           ← PublicationId, Title, Abstract, Year, DOI, CitationCount, SourceApi, MongoMetadataId, JournalId, IsDeleted
    │   ├── Author.cs                                ← AuthorId, Name, ExternalId, Affiliation
    │   ├── PublicationAuthor.cs                     ← PublicationId, AuthorId, AuthorOrder (junction table)
    │   ├── Keyword.cs                               ← KeywordId, Term, NormalizedTerm
    │   ├── PublicationKeyword.cs                    ← PublicationId, KeywordId (junction table)
    │   ├── TrendingMetric.cs                        ← MetricId, KeywordId, Year, PublicationCount, TrendingScore, CalculatedAt
    │   ├── Bookmark.cs                              ← BookmarkId, UserId, PublicationId, CreatedAt
    │   ├── Follow.cs                                ← FollowId, UserId, FollowType, FollowTargetId, FollowTargetName
    │   ├── Notification.cs                          ← NotificationId, UserId, Message, IsRead, CreatedAt, PublicationId
    │   └── SyncLog.cs                               ← SyncLogId, SourceApi, Status, RecordsSynced, ErrorMessage, StartedAt, FinishedAt
    │
    ├── Configurations/                              ← Fluent API config cho EF Core
    │   ├── PublicationConfiguration.cs              ← DOI unique index, soft delete query filter
    │   ├── TrendingMetricConfiguration.cs           ← UNIQUE(KeywordId, Year) constraint
    │   └── UserConfiguration.cs                     ← Email unique index
    │
    ├── Context/
    │   └── AppDbContext.cs                          ← DbContext: đăng ký tất cả DbSet, apply configurations
    │
    ├── Migrations/                                  ← EF Core auto-generated (Add-Migration)
    │   └── (auto-generated files)
    │
    ├── Repositories/
    │   ├── Interfaces/
    │   │   ├── IGenericRepository.cs                ← GetById, GetAll, Add, Update, Delete, FindAsync
    │   │   ├── IUnitOfWork.cs                       ← SaveChangesAsync, commit transaction
    │   │   ├── IPublicationRepository.cs            ← SearchByKeyword, GetByDOI, GetWithKeywords
    │   │   ├── IKeywordRepository.cs                ← GetByNormalizedTerm, GetTopKeywords
    │   │   ├── ITrendingMetricRepository.cs         ← GetByKeywordAndYear, GetTrendsByKeyword
    │   │   ├── IBookmarkRepository.cs               ← GetByUser, ExistsAsync
    │   │   ├── IFollowRepository.cs                 ← GetFollowsByUser, GetFollowersByTarget
    │   │   ├── INotificationRepository.cs           ← GetUnreadByUser, MarkAllReadAsync
    │   │   └── ISyncLogRepository.cs                ← GetLatest, GetByStatus
    │   │
    │   └── Implementations/
    │       ├── GenericRepository.cs                 ← Base repository dùng chung
    │       ├── UnitOfWork.cs                        ← Bọc SaveChangesAsync, expose tất cả repo
    │       ├── PublicationRepository.cs             ← Full-text search, filter by year/journal/keyword
    │       ├── KeywordRepository.cs                 ← Tìm keyword theo NormalizedTerm, top keywords
    │       ├── TrendingMetricRepository.cs          ← Query trend theo keyword + year range
    │       ├── BookmarkRepository.cs                ← Kiểm tra trùng bookmark, lấy theo user
    │       ├── FollowRepository.cs                  ← Lấy follow theo user, check đã follow chưa
    │       ├── NotificationRepository.cs            ← Lấy notification chưa đọc, đánh dấu đã đọc
    │       └── SyncLogRepository.cs                 ← Lưu và query sync log
    │
    ├── External/                                    ← HTTP Client gọi external API
    │   ├── SemanticScholarClient.cs                 ← Gọi Semantic Scholar API (production), map sang Publication entity
    │   └── OpenAlexClient.cs                        ← Gọi OpenAlex API (RQ2 comparison only)
    │
    ├── Mongo/
    │   └── MongoMetadataRepository.cs               ← Lưu/lấy raw JSON metadata từ MongoDB, link qua MongoMetadataId
    │
    └── Seed/
        └── DataSeeder.cs                            ← Seed dữ liệu mẫu: admin user, sample journals, keywords
```

---

## FRONTEND — ReactJS + TypeScript (SPA)

```
scientific-journal-frontend/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
│
└── src/
    ├── main.tsx                                     ← Entry point — render App, bọc Provider
    ├── App.tsx                                      ← Bọc Router, AuthProvider, QueryClientProvider
    │
    ├── router/
    │   └── AppRouter.tsx                            ← Khai báo tất cả routes, bọc ProtectedRoute cho các route cần đăng nhập
    │
    ├── pages/                                       ← Mỗi file = 1 màn hình, ánh xạ với Screen Flow
    │   ├── LoginPage.tsx                            ← Form đăng nhập, gọi authService.login, lưu JWT vào store
    │   ├── RegisterPage.tsx                         ← Form đăng ký, chọn role, gọi authService.register
    │   ├── ForgotPasswordPage.tsx                   ← Nhập email reset password
    │   ├── HomePage.tsx                             ← Overview dashboard: tổng publication, trending keywords nhanh
    │   ├── SearchPage.tsx                           ← Ô tìm kiếm + bộ lọc year/journal/keyword + danh sách kết quả
    │   ├── PublicationDetailPage.tsx                ← Xem chi tiết bài báo + Similarity Score + Related Publications + Duplicate Risk
    │   ├── TrendsPage.tsx                           ← Chọn keyword → hiện biểu đồ Strategy A và B
    │   ├── BookmarksPage.tsx                        ← Danh sách bookmark của user, xóa bookmark
    │   ├── FollowsPage.tsx                          ← Danh sách keyword/journal đang follow, unfollow
    │   ├── NotificationsPage.tsx                    ← Danh sách in-app notification, đánh dấu đã đọc
    │   ├── DashboardPage.tsx                        ← Biểu đồ publication growth, top keywords, export Excel/CSV
    │   ├── ProfilePage.tsx                          ← Xem/sửa thông tin cá nhân, đổi mật khẩu
    │   └── AdminPage.tsx                            ← Quản lý user, xem sync log, trigger sync thủ công
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx                           ← Thanh điều hướng trên cùng: logo, menu, notification bell, avatar
    │   │   ├── Sidebar.tsx                          ← Menu bên trái (trên desktop): links đến các module
    │   │   ├── AppLayout.tsx                        ← Wrapper chứa Navbar + Sidebar + children content
    │   │   └── ProtectedRoute.tsx                   ← Check JWT còn hạn + check role, nếu không hợp lệ redirect /login
    │   │
    │   ├── publication/
    │   │   ├── PublicationCard.tsx                  ← Card hiển thị 1 bài báo trong danh sách (title, year, journal, keywords)
    │   │   ├── PublicationList.tsx                  ← Render danh sách PublicationCard + phân trang
    │   │   ├── PublicationFilter.tsx                ← Bộ lọc: year range, journal dropdown, sort by
    │   │   ├── SimilarityBadge.tsx                  ← Badge hiển thị % similarity, màu đỏ nếu > 50% (Duplicate Risk)
    │   │   ├── RelatedPublications.tsx              ← Danh sách bài báo liên quan kèm SimilarityBadge
    │   │   └── NetworkGraph.tsx                     ← Vẽ Publication Relationship Network dạng graph/network
    │   │
    │   ├── charts/
    │   │   ├── TrendLineChart.tsx                   ← Chart.js Line chart — publication count theo năm
    │   │   ├── TrendBarChart.tsx                    ← Chart.js Bar chart — so sánh publication giữa các năm
    │   │   ├── TrendingScoreChart.tsx               ← Chart.js — hiển thị Strategy A và Strategy B song song
    │   │   └── TopKeywordsChart.tsx                 ← Chart.js Horizontal bar — top keywords theo count
    │   │
    │   ├── dashboard/
    │   │   ├── StatCard.tsx                         ← Card số liệu tổng quan (total pub, total keywords...)
    │   │   ├── PublicationGrowthChart.tsx           ← Biểu đồ tăng trưởng publication theo năm
    │   │   ├── TopKeywordsTable.tsx                 ← Bảng top keywords với Strategy A và B
    │   │   └── ExportButton.tsx                     ← Nút export, chọn format Excel hoặc CSV, gọi exportService
    │   │
    │   ├── notifications/
    │   │   ├── NotificationBell.tsx                 ← Icon chuông trên Navbar, hiển thị số unread, dropdown preview
    │   │   └── NotificationItem.tsx                 ← 1 dòng notification trong danh sách
    │   │
    │   └── common/
    │       ├── SearchInput.tsx                      ← Input tìm kiếm có debounce 300ms
    │       ├── Pagination.tsx                       ← Phân trang: prev/next + jump to page
    │       ├── LoadingSpinner.tsx                   ← Spinner khi đang fetch data
    │       ├── EmptyState.tsx                       ← Thông báo "Không có dữ liệu" có icon
    │       └── ConfirmDialog.tsx                    ← Dialog xác nhận xóa bookmark/unfollow
    │
    ├── services/                                    ← Gọi API qua Axios, tách rời khỏi UI
    │   ├── api.ts                                   ← Axios instance: baseURL, interceptor tự gắn JWT header, xử lý 401
    │   ├── authService.ts                           ← login(), register(), forgotPassword(), refreshToken()
    │   ├── publicationService.ts                    ← search(), getDetail(), getRelated(), getSimilarity()
    │   ├── trendService.ts                          ← getTrendingScore(), getTopKeywords(), getGrowthData()
    │   ├── bookmarkService.ts                       ← getAll(), add(), remove()
    │   ├── followService.ts                         ← getAll(), follow(), unfollow()
    │   ├── notificationService.ts                   ← getAll(), markRead(), markAllRead()
    │   ├── dashboardService.ts                      ← getStats(), getGrowthChart()
    │   └── exportService.ts                         ← exportExcel(), exportCsv() — trigger download file
    │
    ├── hooks/                                       ← Custom hooks tái sử dụng
    │   ├── useAuth.ts                               ← Lấy user hiện tại, isLoggedIn, logout từ store
    │   ├── usePublications.ts                       ← Fetch + cache danh sách publication (React Query)
    │   ├── useTrends.ts                             ← Fetch trending data theo keyword
    │   ├── useNotifications.ts                      ← Fetch + real-time update notification qua SignalR
    │   └── useDebounce.ts                           ← Debounce input search 300ms
    │
    ├── store/                                       ← Global state
    │   ├── authSlice.ts                             ← Redux slice: user, token, isAuthenticated
    │   └── store.ts                                 ← Khởi tạo Redux store, export hooks
    │
    └── types/                                       ← TypeScript types/interfaces
        ├── auth.ts                                  ← User, LoginRequest, AuthResponse, UserRole
        ├── publication.ts                           ← Publication, PublicationDetail, RelatedPublication
        ├── trend.ts                                 ← TrendingMetric, TopKeyword, TrendingStrategy
        ├── bookmark.ts                              ← Bookmark
        ├── follow.ts                                ← Follow, FollowType
        ├── notification.ts                          ← Notification
        └── common.ts                               ← ApiResponse<T>, PaginatedResponse<T>
```

---

## Quy tắc nhớ khi code

| Tầng | Được phép import | KHÔNG được import |
|------|-----------------|-------------------|
| API (Controller) | Business, Common | DataAccess trực tiếp |
| Business (Service) | DataAccess, Common | API |
| DataAccess (Repo) | Common | Business, API |
| Common | (không ai) | Tất cả |

**Similarity Score, Related Publications, Duplicate Risk, Relationship Network**
→ Tính **realtime** trong `PublicationService.cs` + `SimilarityHelper.cs`
→ **KHÔNG tạo bảng DB riêng** cho các thứ này

**OpenAlex** → chỉ dùng trong `OpenAlexClient.cs` cho RQ2 comparison
→ **KHÔNG lưu vào SQL Server**

**UNIQUE(KeywordId, Year)** → khai báo trong `TrendingMetricConfiguration.cs`
