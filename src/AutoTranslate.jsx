import { useTranslation } from "react-i18next";

// Comprehensive translation dictionary
const translations = {
  // Pages & Headers
  "Knowledge Graph": "Đồ thị Tri thức",
  "Submit Publication": "Nộp Bài viết",
  "Bookmarks & Followed Items": "Đánh dấu & Mục theo dõi",
  Notifications: "Thông báo",
  "Trend Tracking": "Theo dõi Xu hướng",
  Reports: "Báo cáo",
  "Year Comparison Analysis": "Phân tích So sánh Năm",
  "Academic Data Sync Management": "Quản lý Đồng bộ Dữ liệu Học thuật",
  "User Profile": "Hồ sơ Người dùng",
  "Generate Custom Report": "Tạo Báo cáo Tùy chỉnh",

  // Common Actions
  "List View": "Xem Danh sách",
  Filters: "Bộ lọc",
  "Compare New Paper": "So sánh Bài viết Mới",
  "Export Excel": "Xuất Excel",
  "Download Papers TXT": "Tải Bài viết TXT",
  Remove: "Xóa",
  "Save Full Text": "Lưu Toàn văn",
  "Save Link Only": "Chỉ Lưu Liên kết",
  Compare: "So sánh",
  "Mark all as read": "Đánh dấu tất cả đã đọc",
  "All Notifications": "Tất cả Thông báo",
  Unread: "Chưa đọc",
  "Any Time": "Mọi lúc",
  Today: "Hôm nay",
  "This Week": "Tuần này",
  Comparison: "So sánh",
  "Export Data": "Xuất Dữ liệu",
  "Run Dry Check": "Chạy Kiểm tra Thử",
  "Start Sync": "Bắt đầu Đồng bộ",
  Configure: "Cấu hình",
  "Upload New": "Tải lên Mới",
  "Save Changes": "Lưu Thay đổi",
  Reset: "Đặt lại",
  "Profile settings": "Cài đặt Hồ sơ",
  "Save Settings": "Lưu Cài đặt",
  "Upgrade Now": "Nâng cấp Ngay",
  "Choose File": "Chọn Tệp",
  "No file chosen": "Chưa chọn tệp",
  "Check Similarity and Submit": "Kiểm tra Độ tương đồng và Nộp",

  // Tabs & Navigation
  Publications: "Bài viết",
  Keywords: "Từ khóa",
  Journals: "Tạp chí",
  Topics: "Chủ đề",
  "Personal Info": "Thông tin Cá nhân",
  "Academic Identity": "Danh tính Học thuật",
  "Change Password": "Đổi Mật khẩu",
  "Research Interests": "Sở thích Nghiên cứu",
  "Notification Settings": "Cài đặt Thông báo",
  "Privacy & Security": "Riêng tư & Bảo mật",
  Preferences: "Tùy chọn",

  // Form Labels
  "Publication Title": "Tiêu đề Bài viết",
  Authors: "Tác giả",
  "Abstract / Paper Content": "Tóm tắt / Nội dung Bài viết",
  "Upload File": "Tải lên Tệp",
  "Enter paper title": "Nhập tiêu đề bài viết",
  "Full Name": "Họ và Tên",
  "Email Address (Read-only)": "Địa chỉ Email (Chỉ đọc)",
  Institution: "Cơ quan",
  Department: "Khoa/Bộ môn",

  // Messages
  "Stay updated on publications, trends, and system alerts.":
    "Cập nhật về bài viết, xu hướng và cảnh báo hệ thống.",
  "Analyze keyword velocity and raw publication volume across disciplines.":
    "Phân tích tốc độ từ khóa và khối lượng bài viết thô theo ngành.",
  "Monitor publication metadata ingestion, API comparison sampling, normalization, scheduled jobs, and failure logs.":
    "Giám sát việc thu thập metadata bài viết, lấy mẫu so sánh API, chuẩn hóa, công việc đã lên lịch và nhật ký lỗi.",
  "Manage your personal information, security, and academic preferences.":
    "Quản lý thông tin cá nhân, bảo mật và sở thích học thuật của bạn.",
  "Control how ScholarTrend tracks publications, trends, and alerts.":
    "Kiểm soát cách ScholarTrend theo dõi bài viết, xu hướng và cảnh báo.",
  "AI similarity check runs before the paper can enter Admin review.":
    "Kiểm tra độ tương đồng AI chạy trước khi bài viết có thể vào đánh giá của Quản trị viên.",
  "PDF, DOCX, or TXT accepted": "Chấp nhận PDF, DOCX hoặc TXT",
  "JPG, GIF or PNG. Max size of 800K":
    "JPG, GIF hoặc PNG. Kích thước tối đa 800K",

  // Stats & Metrics
  "TOTAL PUBS": "TỔNG BÀI VIẾT",
  "YOY GROWTH": "TĂNG TRƯỞNG YOY",
  "TRENDING SCORE A (RAW)": "ĐIỂM XU HƯỚNG A (THÔ)",
  "TRENDING SCORE B (RATE)": "ĐIỂM XU HƯỚNG B (TỶ LỆ)",
  "vs last year": "so với năm trước",
  "Total Publications": "Tổng Bài viết",
  "Total Citations": "Tổng Trích dẫn",
  "SYNCED RECORDS": "BẢN GHI ĐÃ ĐỒNG BỘ",
  LATENCY: "ĐỘ TRỄ",
  COVERAGE: "PHẠM VI",
  Sample: "Mẫu",
  Connected: "Đã kết nối",
  "Compare-only": "Chỉ so sánh",

  // Submission Rule
  "RESEARCHER WORKSPACE": "KHÔNG GIAN LÀM VIỆC NHÀ NGHIÊN CỨU",
  "SUBMISSION RULE": "QUY TẮC NỘP BÀI",
  "Papers must not exceed 50% similarity with an original source. If the similarity score is over 50%, the AI system will automatically cancel the submission and Admin will not approve it.":
    "Bài viết không được vượt quá 50% độ tương đồng với nguồn gốc. Nếu điểm tương đồng trên 50%, hệ thống AI sẽ tự động hủy bài nộp và Quản trị viên sẽ không phê duyệt.",
  "Max similarity: 50%": "Độ tương đồng tối đa: 50%",

  // More translations...
  Baseline: "Cơ sở",
  Researcher: "Nhà nghiên cứu",
  Lecturer: "Giảng viên",
  Student: "Sinh viên",
  Administrator: "Quản trị viên",
  Weekly: "Hàng tuần",
  Monthly: "Hàng tháng",
  Yearly: "Hàng năm",
  Complete: "Hoàn thành",
  Active: "Đang hoạt động",
  Running: "Đang chạy",
  Succeeded: "Thành công",
  Cancel: "Hủy",
  "Upgrade to Pro": "Nâng cấp lên Pro",
  "SCHOLARTREND PRO": "SCHOLARTREND PRO",
};

// Hook to auto-translate text
export function useAutoTranslate() {
  const { i18n } = useTranslation();

  return (text) => {
    if (!text || i18n.language === "en") return text;
    return translations[text] || text;
  };
}

// Component wrapper to auto-translate children text
export function T({ children }) {
  const translate = useAutoTranslate();

  if (typeof children === "string") {
    return translate(children);
  }

  return children;
}

export default translations;
