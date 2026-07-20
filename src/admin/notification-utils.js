export const getNotificationRouteForRole = (role) => {
  if (role === "Lecturer") return "/lecturer-notifications";
  if (role === "Researcher") return "/researcher-notifications";
  if (role === "Administrator" || role === "Admin") return "/admin-notifications";
  return "/student-notifications";
};

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const vietnamScheduleToUtcIso = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value || ""))) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const utcIsoToVietnamSchedule = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: VIETNAM_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const formatVietnamDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(date);
};

export const normalizeAdminNotification = (notification, normalizeRecipientRole = (role) => role || "All") => ({
  id: notification.id || `admin-notification-${Date.now()}`,
  type: notification.type || "SYSTEM ALERT",
  title: notification.title || "NOTICE:",
  text: notification.text || notification.message || "",
  recipientRole: normalizeRecipientRole(notification.recipientRole),
  recipientEmail: String(notification.recipientEmail || "").toLowerCase(),
  route: notification.route || "",
  createdAt: notification.createdAt || new Date().toISOString(),
  scheduledAt: notification.scheduledAt || null,
  deliveredAt: notification.deliveredAt || null,
  readAt: notification.readAt || null,
  failedAt: notification.failedAt || null,
  deliveryStatus: notification.deliveryStatus || "delivered",
  failureReason: notification.failureReason || "",
  batchId: notification.batchId || null,
  unread: notification.unread !== false,
});
