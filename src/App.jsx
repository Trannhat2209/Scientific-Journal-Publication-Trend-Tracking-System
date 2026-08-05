import React from "react";
import Chart from "chart.js/auto";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import VietnamScheduleField from "./admin/VietnamScheduleField";
import { formatVietnamDateTime, getNotificationRouteForRole, normalizeAdminNotification as normalizeAdminNotificationBase, utcIsoToVietnamSchedule, vietnamScheduleToUtcIso } from "./admin/notification-utils";

const AdminNotificationPreview = React.lazy(() => import("./admin/AdminNotificationPreview"));
const PublicationVersionHistory = React.lazy(() => import("./admin/PublicationVersionHistory"));

const getAcademicRole = () =>
  window.location.pathname.startsWith("/lecturer-") ? "lecturer" : "researcher";

const getAcademicPath = (path, role = getAcademicRole()) => {
  if (role === "lecturer" && path.startsWith("/researcher-")) {
    return path.replace("/researcher-", "/lecturer-");
  }

  return path;
};

const getSafeRecipientRoute = (path, role = "student") => {
  const route = String(path || "");
  const rolePrefix =
    String(role).toLowerCase() === "lecturer"
      ? "lecturer"
      : String(role).toLowerCase() === "researcher"
        ? "researcher"
        : "student";

  if (!route.startsWith("/admin-")) return getAcademicPath(route, rolePrefix);

  if (route === "/admin-publications") return `/${rolePrefix}-search`;
  if (route === "/admin-notifications") return `/${rolePrefix}-notifications`;
  if (route === "/admin-user-management") return `/${rolePrefix}-profile`;
  // Admin-only operational pages (dashboard, sync, logs, and unknown admin
  // routes) have no equivalent destination for academic users. Keep the user
  // in their notification center and omit the related-page action.
  return `/${rolePrefix}-notifications`;
};

const navTo = (path) => (event) => {
  event.preventDefault();
  window.history.pushState({}, "", getAcademicPath(path));
  window.dispatchEvent(new Event("scholartrend:navigate"));
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
);
const GOOGLE_AUTH_BASE_URL = (
  import.meta.env.VITE_GOOGLE_AUTH_BASE_URL || API_BASE_URL
).replace(/\/$/, "");

const getStoredAuth = () => {
  try {
    return JSON.parse(window.localStorage.getItem("scholartrend.auth") || "{}");
  } catch {
    return {};
  }
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return {};

  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(window.atob(normalizedPayload));
  } catch {
    return {};
  }
};

const getStoredAuthRole = () => {
  const tokenPayload = decodeJwtPayload(getStoredAuth().accessToken);
  return (
    tokenPayload.role ||
    tokenPayload[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ] ||
    ""
  );
};

const hasAdminBackendAccess = () => {
  const accessToken = getStoredAuth().accessToken;
  if (!accessToken) return false;
  const payload = decodeJwtPayload(accessToken);
  const expiresAt = Number(payload.exp || 0) * 1000;
  if (!expiresAt || expiresAt <= Date.now()) return false;
  return normalizeRoleForUi(getStoredAuthRole()) === "Administrator";
};

const getStoredSession = () => {
  try {
    return JSON.parse(window.localStorage.getItem("scholartrend.session") || "{}");
  } catch {
    return {};
  }
};

const normalizeRoleForUi = (role) => {
  const value = Array.isArray(role) ? role[0] : role;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "admin" || normalized === "administrator") {
    return "Administrator";
  }
  if (normalized === "student") return "Student";
  if (normalized === "lecturer") return "Lecturer";
  if (normalized === "researcher") return "Researcher";
  return value || "Student";
};

const normalizeRoleForApi = (role) =>
  role === "Administrator" ? "Admin" : role || "Student";

const roleDashboardRoutes = {
  Admin: "/admin-dashboard",
  Researcher: "/researcher-dashboard",
  Lecturer: "/lecturer-dashboard",
  Student: "/student-dashboard",
  Administrator: "/admin-dashboard",
};

const STUDENT_REGISTRATION_ROLE = "Student";
const REGISTERED_LOGIN_HINT_KEY = "scholartrend.registeredLoginHint";

const getRegisteredLoginHint = () => {
  try {
    const hint = JSON.parse(
      window.sessionStorage.getItem(REGISTERED_LOGIN_HINT_KEY) || "{}",
    );
    if (!hint.email || !hint.password) return null;
    return {
      email: String(hint.email).trim().toLowerCase(),
      password: String(hint.password),
      role: normalizeRoleForUi(hint.role || STUDENT_REGISTRATION_ROLE),
      fullName: String(hint.fullName || "").trim(),
    };
  } catch {
    return null;
  }
};

const normalizePercentValue = (value) => {
  const percent = Number(value);
  return Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null;
};

const clampPercentToAccuracy = (value, accuracyLimit = 100) => {
  const percent = normalizePercentValue(value);
  const limit = normalizePercentValue(accuracyLimit) ?? 100;
  if (limit <= 1) return Math.max(0, limit);
  const normalizedScore = percent ?? 0;
  if (limit >= 100) return Math.max(1, normalizedScore);
  return 1 + (normalizedScore / 100) * (limit - 1);
};

const inferRoleFromPath = () => {
  const path = window.location.pathname;
  if (path.startsWith("/student-")) return "Student";
  if (path.startsWith("/lecturer-")) return "Lecturer";
  if (path.startsWith("/admin-")) return "Administrator";
  return "Researcher";
};

const getExplicitRoleFromPath = () => {
  const path = window.location.pathname;
  if (path.startsWith("/student-")) return "Student";
  if (path.startsWith("/lecturer-")) return "Lecturer";
  if (path.startsWith("/researcher-")) return "Researcher";
  if (path.startsWith("/admin-")) return "Administrator";
  return null;
};

const getCurrentAccountPlan = () => {
  const session = getStoredSession();
  return {
    ...session,
    role: normalizeRoleForUi(
      getExplicitRoleFromPath() || session.role || inferRoleFromPath(),
    ),
    searchAccuracy: 100,
  };
};
const getSessionDisplayName = (
  session = {},
  fallback = "ScholarTrend User",
) => {
  const rawName =
    session.fullName ||
    session.name ||
    session.displayName ||
    session.email ||
    fallback;
  const name = String(rawName || fallback).trim();
  if (!name) return fallback;
  return name.includes("@") ? name.split("@")[0] : name;
};

const CLIENT_SYSTEM_LOGS_KEY = "scholartrend.adminSystemLogs";

const getClientLogModule = (path = "") => {
  const value = String(path).toLowerCase();

  if (value.includes("/auth") || value.includes("/admin/users")) {
    return "User Management";
  }
  if (value.includes("/sync")) return "Sync Management";
  if (value.includes("/notifications")) return "Notification Management";
  if (value.includes("/publications") || value.includes("/search")) {
    return "Publication Management";
  }
  return "System";
};

const getClientLogCode = (module, status = "WEB") => {
  const prefixMap = {
    "User Management": "USER",
    "Sync Management": "SYNC",
    "Notification Management": "NOTIFY",
    "Publication Management": "PUB",
    System: "WEB",
  };
  const prefix = prefixMap[module] || "WEB";
  return `${prefix}-${status}-${Date.now().toString().slice(-4)}`;
};

const appendClientSystemLog = ({
  event = "Web alert",
  detail = "",
  module = "System",
  severity = "Warning",
  actor = "browser@client",
  code,
}) => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(CLIENT_SYSTEM_LOGS_KEY) || "[]",
    );
    const current = Array.isArray(saved) && saved.length ? saved : [];
    const normalizedDetail = String(detail || "").slice(0, 260);
    const duplicateKey = `${module}:${severity}:${event}:${normalizedDetail}`;
    const duplicate = current.find(
      (log) =>
        `${log.module}:${log.severity}:${log.event}:${log.detail}` ===
        duplicateKey,
    );

    if (duplicate) return duplicate;

    const nextLog = {
      time: new Date().toISOString(),
      event,
      detail: normalizedDetail,
      module,
      severity,
      actor,
      code: code || getClientLogCode(module),
    };
    const nextLogs = [nextLog, ...current].slice(0, 120);
    window.localStorage.setItem(
      CLIENT_SYSTEM_LOGS_KEY,
      JSON.stringify(nextLogs),
    );
    window.dispatchEvent(new Event("scholartrend:system-log"));
    return nextLog;
  } catch {
    return null;
  }
};

const apiFetch = async (path, options = {}) => {
  const { body, auth = false, headers = {}, ...rest } = options;
  const token = getStoredAuth().accessToken;
  const module = getClientLogModule(path);
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      __skipClientAlert: true,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && auth && getStoredAuth().refreshToken) {
      try {
        const refreshed = await refreshStoredAuth();
        const refreshedToken = refreshed?.accessToken;
        if (refreshedToken) {
          response = await fetch(`${API_BASE_URL}${path}`, {
            ...rest,
            __skipClientAlert: true,
            headers: {
              ...(body ? { "Content-Type": "application/json" } : {}),
              Authorization: `Bearer ${refreshedToken}`,
              ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
          });
        }
      } catch {
        clearAuth();
      }
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }
    appendClientSystemLog({
      event: "API connection failed",
      detail: `${path}: ${error.message}`,
      module,
      severity: "Error",
      code: getClientLogCode(module, "NET"),
    });
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const validationMessage =
      payload?.errors && typeof payload.errors === "object"
        ? Object.values(payload.errors).flat().join(" ")
        : "";
    const message =
      validationMessage ||
      payload?.message ||
      payload?.error ||
      payload?.title ||
      (typeof payload === "string" && payload) ||
      "Backend request failed.";
    appendClientSystemLog({
      event: `API request failed (${response.status})`,
      detail: `${path}: ${message}`,
      module,
      severity: response.status >= 500 ? "Error" : "Warning",
      code: getClientLogCode(module, response.status),
    });
    throw new Error(message);
  }

  return payload;
};

const authServerFetch = async (path, options = {}) => {
  const { body, headers = {}, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        payload?.title ||
        (typeof payload === "string" && payload) ||
        "Auth helper request failed.",
    );
  }

  return payload;
};

const getFriendlyRegisterError = (error) => {
  let message =
    error?.message || "Registration failed. Please check your details.";

  try {
    const parsed = JSON.parse(message);
    const validationMessages =
      parsed?.errors && typeof parsed.errors === "object"
        ? Object.values(parsed.errors).flat().join(" ")
        : "";
    message =
      validationMessages ||
      parsed?.message ||
      parsed?.error ||
      parsed?.title ||
      message;
  } catch {
    // The backend usually returns plain English; JSON strings are normalized above.
  }

  if (/email already exists/i.test(message)) {
    return {
      type: "notice",
      title: "This email is already registered.",
      text: "Use Login to continue with this account, or register with a different email address.",
      actionText: "Go to Login",
      actionRoute: "/login",
    };
  }

  if (/password/i.test(message) && /8/i.test(message)) {
    return {
      type: "error",
      title: "Password is too short.",
      text: "Use at least 8 characters for your password.",
    };
  }

  if (/email/i.test(message)) {
    return {
      type: "error",
      title: "Check your email address.",
      text: message,
    };
  }

  return {
    type: "error",
    title: "Registration could not be completed.",
    text: message,
  };
};

const goToRoute = (route) => {
  window.history.pushState({}, "", route);
  window.dispatchEvent(new Event("scholartrend:navigate"));
};

const persistSession = (user) => {
  if (!user) return;
  const currentSession = getStoredSession();
  const role = normalizeRoleForUi(
    user.role || currentSession.role || inferRoleFromPath(),
  );
  const email = user.email || currentSession.email || "";
  const displayName = String(
    user.fullName || user.name || currentSession.fullName || currentSession.name || email,
  ).trim();
  const session = {
    ...currentSession,
    ...user,
    email,
    fullName: displayName,
    name: displayName,
    role,
    searchAccuracy: 100,
    signedInAt: user.lastLoginAt || currentSession.signedInAt || new Date().toISOString(),
  };
  window.localStorage.setItem("scholartrend.session", JSON.stringify(session));
  window.dispatchEvent(new Event("scholartrend:session-updated"));
};
const persistAuth = (authPayload) => {
  if (!authPayload || authPayload.requiresLogin) return;

  window.localStorage.setItem(
    "scholartrend.auth",
    JSON.stringify({
      accessToken: authPayload.accessToken,
      refreshToken: authPayload.refreshToken,
      expiresAt: authPayload.expiresAt,
    }),
  );
  persistSession(authPayload.user);
};

const refreshStoredAuth = async () => {
  const current = getStoredAuth();
  if (!current.refreshToken) return null;
  const refreshed = await authServerFetch("/api/auth/refresh-token", {
    method: "POST",
    body: { refreshToken: current.refreshToken },
  });
  persistAuth(refreshed);
  return refreshed;
};

const clearAuth = () => {
  window.localStorage.removeItem("scholartrend.auth");
  window.localStorage.removeItem("scholartrend.session");
};

const clearAuthCookie = async () => {
  try {
    await fetch(`${GOOGLE_AUTH_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Local sign-out should still succeed if the auth helper is unavailable.
  }
};

const handleLogout = async () => {
  await Promise.allSettled([
    clearAuthCookie(),
    apiFetch("/api/auth/logout", { method: "POST", auth: true }),
  ]);
  clearAuth();
  goToRoute("/login");
};

const getSearchParam = (key) =>
  new URLSearchParams(window.location.search).get(key);

const LOCAL_BOOKMARKS_KEY = "scholartrend.localBookmarks";
const REMOVED_BOOKMARKS_KEY = "scholartrend.removedBookmarks";

const formatCount = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value || 0));

const downloadCsvFile = (filename, rows) => {
  const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const xmlEscape = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const getCrc32 = (bytes) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const getDosTimestamp = () => {
  const date = new Date();
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, day };
};

const concatUint8Arrays = (chunks) => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });
  return merged;
};

const createZipBlob = (files, type) => {
  const encoder = new TextEncoder();
  const { time, day } = getDosTimestamp();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes =
      typeof file.content === "string"
        ? encoder.encode(file.content)
        : file.content;
    const crc = getCrc32(contentBytes);

    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(10, time, true);
    localView.setUint16(12, day, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);

    localParts.push(localHeader, nameBytes, contentBytes);

    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, day, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, contentBytes.length, true);
    centralView.setUint32(24, contentBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, localOffset, true);
    centralParts.push(centralHeader, nameBytes);

    localOffset += localHeader.length + nameBytes.length + contentBytes.length;
  });

  const centralDirectory = concatUint8Arrays(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, localOffset, true);

  return new Blob(
    [concatUint8Arrays(localParts), centralDirectory, endRecord],
    {
      type,
    },
  );
};

const createDocxParagraph = (
  text,
  { bold = false, size = 22, spacingAfter = 160 } = {},
) => `
    <w:p>
      <w:pPr><w:spacing w:after="${spacingAfter}"/></w:pPr>
      <w:r>
        <w:rPr>${bold ? "<w:b/>" : ""}<w:sz w:val="${size}"/></w:rPr>
        <w:t xml:space="preserve">${xmlEscape(text)}</w:t>
      </w:r>
    </w:p>`;

const createDocxSection = ({ heading, paragraphs = [] }) => `
    ${heading ? createDocxParagraph(heading, { bold: true, size: 28, spacingAfter: 120 }) : ""}
    ${paragraphs
      .flatMap((paragraph) =>
        String(paragraph || "")
          .split(/\n{2,}/)
          .map((line) => line.trim())
          .filter(Boolean),
      )
      .map((paragraph) => createDocxParagraph(paragraph))
      .join("")}`;

const createDocxTable = (rows = []) => {
  if (!rows.length) return "";

  const tableRows = rows
    .map(
      (row, rowIndex) => `
        <w:tr>${row
          .map(
            (cell) => `
              <w:tc>
                <w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>
                <w:p>
                  <w:r>${rowIndex === 0 ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t>${xmlEscape(cell)}</w:t></w:r>
                </w:p>
              </w:tc>`,
          )
          .join("")}
        </w:tr>`,
    )
    .join("");

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="cccccc"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="cccccc"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="cccccc"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="cccccc"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="cccccc"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="cccccc"/>
        </w:tblBorders>
      </w:tblPr>
      ${tableRows}
    </w:tbl>`;
};

const createDocxBlob = ({ title, rows = [], sections = [] }) => {
  const tableXml = createDocxTable(rows);
  const sectionXml = sections.map(createDocxSection).join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
        <w:t>${xmlEscape(title)}</w:t>
      </w:r>
    </w:p>
    ${sectionXml}
    ${tableXml}
    <w:sectPr>
      <w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return createZipBlob(
    [
      {
        name: "[Content_Types].xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
      },
      {
        name: "_rels/.rels",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
      },
      { name: "word/document.xml", content: documentXml },
    ],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
};

const downloadDocxFile = (filename, documentData) => {
  const url = URL.createObjectURL(createDocxBlob(documentData));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const slugifyFilename = (value, fallback = "scholartrend-paper") => {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
};

const buildExternalSourceLinks = (paper = {}) => {
  const title = paper.title || "";
  const doi = paper.doi || paper.DOI || "";
  const sourceApi = paper.sourceApi || paper.SourceApi || paper.source || "";
  const rawSourceUrl =
    paper.sourceUrl || paper.SourceUrl || paper.originalUrl || "";
  const generatedIdPattern =
    /(?:^|[?&=:/])(google-scholar|semantic-scholar|semantic scholar|openalex|researchgate)%?3?a/i;
  const sourceUrl = generatedIdPattern.test(String(rawSourceUrl))
    ? ""
    : rawSourceUrl;
  const isGeneratedDoi =
    /^(google-scholar|semantic-scholar|semantic scholar|openalex|researchgate):/i.test(
      String(doi).trim(),
    );
  const realDoi = doi && !isGeneratedDoi ? doi : "";
  const query = realDoi || title;
  if (!query && !sourceUrl) return [];

  const encodedQuery = encodeURIComponent(query);
  const encodedTitle = encodeURIComponent(title || query);
  const sourceSpecificUrl =
    sourceUrl ||
    (() => {
      if (String(sourceApi).includes("Google Scholar")) {
        return `https://scholar.google.com/scholar?q=${encodedQuery}`;
      }
      if (String(sourceApi).includes("OpenAlex")) {
        return `https://openalex.org/search?q=${encodedQuery}`;
      }
      if (String(sourceApi).includes("ResearchGate")) {
        return `https://www.researchgate.net/search/publication?q=${encodedTitle}`;
      }
      return "";
    })();
  const links = [
    sourceSpecificUrl
      ? {
          label: "Open Paper",
          href: sourceSpecificUrl,
        }
      : null,
    realDoi && !String(sourceSpecificUrl).includes(realDoi)
      ? {
          label: "DOI.org",
          href: `https://doi.org/${encodeURIComponent(realDoi)}`,
        }
      : null,
    {
      label: "OpenAlex",
      href: `https://openalex.org/search?q=${encodedQuery}`,
    },
    {
      label: "Google Scholar",
      href: `https://scholar.google.com/scholar?q=${encodedQuery}`,
    },
    {
      label: "ResearchGate",
      href: `https://www.researchgate.net/search/publication?q=${encodedTitle}`,
    },
    {
      label: "Explore graph on Connected Papers",
      href: `https://www.connectedpapers.com/search?q=${encodedTitle}`,
    },
  ].filter(Boolean);

  return links.filter(
    (link, index) =>
      links.findIndex((item) => item.href === link.href) === index,
  );
};

const getPaperFullText = (paper = {}) =>
  paper.fullText ||
  paper.FullText ||
  paper.fileText ||
  paper.content ||
  paper.body ||
  paper.text ||
  paper.raw?.fullText ||
  paper.raw?.fileText ||
  "";

const buildPaperDocxSections = (paper = {}, query = "") => {
  const abstract =
    paper.abstract ||
    paper.summary ||
    paper.excerpt ||
    "No abstract is available for this publication yet.";
  const fullText = getPaperFullText(paper);
  const tags = Array.isArray(paper.tags)
    ? paper.tags
    : Array.isArray(paper.keywords)
      ? paper.keywords
      : [];
  const sourceLinks = buildExternalSourceLinks(paper)
    .map((link) => `${link.label}: ${link.href}`)
    .join("\n");
  const doi = paper.doi || paper.DOI || "";
  const venue =
    paper.journalName || paper.source || paper.sourceApi || "Indexed source";

  return [
    {
      heading: "Article metadata",
      paragraphs: [
        `Title: ${paper.title || "Untitled publication"}`,
        `Authors: ${paper.authors || paper.authorText || "Unknown authors"}`,
        `Year: ${paper.year || "N/A"}`,
        `Venue/source: ${venue}`,
        `Citations: ${paper.citations ?? paper.citationCount ?? 0}`,
        `References: ${paper.references ?? "N/A"}`,
        `Search accuracy shown: ${Number(paper.similarity || 0).toFixed(1)}%`,
        doi ? `DOI: ${doi}` : "DOI: Not available",
        query ? `Search query: ${query}` : "",
      ].filter(Boolean),
    },
    {
      heading: fullText ? "Full paper content" : "Abstract / available content",
      paragraphs: [
        fullText ||
          abstract ||
          "The full publisher text is not stored in ScholarTrend for this record.",
      ],
    },
    {
      heading: "Keywords and trends",
      paragraphs: [
        tags.length
          ? tags.join(", ")
          : "No keyword list is available for this publication yet.",
      ],
    },
    {
      heading: "Original source links",
      paragraphs: [
        sourceLinks ||
          "No external source link is available. Search the title in Google Scholar or DOI.org.",
      ],
    },
    {
      heading: "Reading note",
      paragraphs: [
        fullText
          ? "This DOCX includes the full text stored in ScholarTrend for this publication."
          : "ScholarTrend currently has metadata and abstract-level content for this indexed record. Use the source links above to open the publisher or DOI page for the official full text.",
      ],
    },
  ];
};

const buildPaperDocxData = (paper, query = "") => ({
  title: paper.title || "ScholarTrend Publication",
  sections: buildPaperDocxSections(paper, query),
});

const buildSearchResultsDocxData = (papers = [], query = "") => ({
  title: query.trim()
    ? `Search results for "${query.trim()}"`
    : "ScholarTrend Search Results",
  sections: papers.flatMap((paper, index) => [
    {
      heading: `${index + 1}. ${paper.title}`,
      paragraphs: [
        `Authors: ${paper.authors || "Unknown authors"}`,
        `Year: ${paper.year || "N/A"} | Citations: ${paper.citations ?? 0} | References: ${paper.references ?? "N/A"} | Search accuracy: ${Number(paper.similarity || 0).toFixed(1)}%`,
      ],
    },
    ...buildPaperDocxSections(paper, query).filter(
      (section) => section.heading !== "Reading note",
    ),
  ]),
});

const mapPublicationForCard = (paper) => {
  const sourceApi = paper.sourceApi || paper.SourceApi || "";
  const journalName = paper.journalName || paper.JournalName || "";
  const doi = paper.doi || paper.DOI || "";
  const sourceUrl = paper.sourceUrl || paper.SourceUrl || "";
  return {
    id: paper.id,
    tags: paper.keywords?.length ? paper.keywords.slice(0, 2) : ["Publication"],
    title: paper.title,
    excerpt: paper.abstract || "No abstract available from backend.",
    abstract: paper.abstract || "No abstract available from backend.",
    meta: `${paper.year || "N/A"}  -  ${formatCount(
      paper.citationCount,
    )} Citations  -  ${journalName || "Unknown journal"}`,
    authors: Array.isArray(paper.authors) ? paper.authors.join(", ") : "",
    source: sourceApi || journalName || "Scientific Journal",
    sourceApi,
    sourceUrl,
    journalName,
    doi,
    externalLinks: buildExternalSourceLinks({ ...paper, doi, sourceUrl }),
    citations: formatCount(paper.citationCount),
    year: paper.year,
    saved: false,
  };
};

const mapPublicationDetailForUi = (payload) => {
  const publication = payload?.publication || payload || {};
  const relatedPublications = Array.isArray(payload?.relatedPublications)
    ? payload.relatedPublications
    : [];
  return {
    id: publication.id,
    title:
      publication.title ||
      "Deep Learning for Advanced Pattern Recognition in Complex Biological Systems",
    abstract:
      publication.abstract ||
      "No abstract is available for this publication yet.",
    authors: Array.isArray(publication.authors)
      ? publication.authors
      : ["Unknown author"],
    authorText: Array.isArray(publication.authors)
      ? publication.authors.join(", ")
      : "Unknown author",
    year: publication.year || "N/A",
    doi: publication.doi || publication.DOI || "",
    journalName: publication.journalName || "Scientific Journal",
    sourceApi: publication.sourceApi || publication.SourceApi || "",
    sourceUrl: publication.sourceUrl || publication.SourceUrl || "",
    citationCount: publication.citationCount || 0,
    keywords: Array.isArray(publication.keywords) ? publication.keywords : [],
    keywordIds: Array.isArray(publication.keywordIds)
      ? publication.keywordIds
      : [],
    researchTopicIds: Array.isArray(publication.researchTopicIds)
      ? publication.researchTopicIds
      : [],
    relatedPublications,
  };
};

const mapPublicationForBookmark = (paper) => ({
  id: paper.id || paper.title,
  detailId: paper.id || paper.detailId || paper.title,
  title: paper.title,
  excerpt: paper.excerpt || paper.abstract || "No abstract available.",
  abstract: paper.abstract || paper.excerpt || "No abstract available.",
  authors: paper.authors || [],
  date: String(paper.year || paper.date || "N/A"),
  year: paper.year || paper.date || "N/A",
  citations: String(paper.citations || paper.citationCount || "0"),
  citationCount: paper.citationCount || paper.citations || 0,
  impact: paper.impact || paper.tags?.[0] || "Indexed",
  source:
    paper.source ||
    paper.sourceApi ||
    paper.journalName ||
    "Scientific Journal",
  sourceApi: paper.sourceApi || "",
  sourceUrl: paper.sourceUrl || "",
  journalName: paper.journalName || paper.source || "Scientific Journal",
  doi: paper.doi || "",
  keywords: Array.isArray(paper.keywords) ? paper.keywords : [],
  saveMode: paper.saveMode || "full-text",
  fullTextSaved:
    paper.fullTextSaved !== false && paper.saveMode !== "link-only",
  linkOnly: paper.linkOnly === true || paper.saveMode === "link-only",
});

const getBookmarkKey = (paper) =>
  String(paper?.id || paper?.title || "")
    .trim()
    .toLowerCase();

const getBookmarkDetailPath = (basePath, paper) => {
  const detailId = paper?.detailId || paper?.id || paper?.title;
  if (!detailId) return basePath;
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}id=${encodeURIComponent(detailId)}`;
};

const getLocalBookmarks = () => {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LOCAL_BOOKMARKS_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setLocalBookmarks = (bookmarks) => {
  window.localStorage.setItem(
    LOCAL_BOOKMARKS_KEY,
    JSON.stringify(bookmarks.slice(0, 100)),
  );
};

const getRemovedBookmarkKeys = () => {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(REMOVED_BOOKMARKS_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setRemovedBookmarkKeys = (keys) => {
  window.localStorage.setItem(
    REMOVED_BOOKMARKS_KEY,
    JSON.stringify(keys.slice(0, 500)),
  );
};

const hasLocalBookmark = (paper, bookmarks) =>
  bookmarks.some(
    (bookmark) => getBookmarkKey(bookmark) === getBookmarkKey(paper),
  );

const upsertLocalBookmark = (paper) => {
  const nextBookmark = mapPublicationForBookmark(paper);
  const nextBookmarkKey = getBookmarkKey(nextBookmark);
  const current = getLocalBookmarks();
  const next = [
    nextBookmark,
    ...current.filter(
      (bookmark) => getBookmarkKey(bookmark) !== nextBookmarkKey,
    ),
  ];
  setLocalBookmarks(next);
  setRemovedBookmarkKeys(
    getRemovedBookmarkKeys().filter((key) => key !== nextBookmarkKey),
  );
  return next;
};

const removeLocalBookmark = (paper) => {
  const bookmarkKey = getBookmarkKey(paper);
  const next = getLocalBookmarks().filter(
    (bookmark) => getBookmarkKey(bookmark) !== bookmarkKey,
  );
  setLocalBookmarks(next);
  return next;
};

const markBookmarkRemoved = (paper) => {
  const bookmarkKey = getBookmarkKey(paper);
  const next = [...new Set([...getRemovedBookmarkKeys(), bookmarkKey])].filter(
    Boolean,
  );
  setRemovedBookmarkKeys(next);
  return next;
};

const isBackendNumericId = (id) => /^\d+$/.test(String(id || ""));

const mergeBookmarkLists = (...lists) => {
  const seen = new Set();
  return lists.flat().filter((bookmark) => {
    const key = getBookmarkKey(bookmark);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getSearchTerms = (value) =>
  String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2)
    .slice(0, 8);

const matchesSearchTerms = (value, terms) =>
  !terms.length ||
  terms.every((term) =>
    String(value || "")
      .toLowerCase()
      .includes(term),
  );

const SIMILARITY_LIMIT_PERCENT = 50;
const PUBLISHED_PUBLICATIONS_KEY = "scholartrend.publishedPublications";
const PUBLICATION_REVIEW_NOTIFICATIONS_KEY =
  "scholartrend.publicationReviewNotifications";

const scholarlyReferencePapers = [
  {
    title:
      "Deep Learning for Advanced Pattern Recognition in Complex Biological Systems",
    source: "Google Scholar indexed record",
    authors: "Elena Rostova, Marcus Thorne, Jin-Soo Park",
    year: 2023,
    keywords: ["deep learning", "pattern recognition", "biological systems"],
    abstract:
      "The integration of deep neural networks into the analysis of multi-omic biological data presents significant challenges due to high dimensionality and noise. This paper introduces a manifold learning architecture for extracting stable structural features from single-cell RNA sequencing data.",
  },
  {
    title:
      "Neural Network Architectures for Predictive Data Synthesis in High-Noise Environments",
    source: "Google Scholar indexed record",
    authors: "A. Novak, L. Finch",
    year: 2023,
    keywords: ["neural networks", "predictive synthesis", "noise"],
    abstract:
      "This study explores structural adjustments within deep learning models when exposed to datasets characterized by extreme signal noise, comparing predictive data synthesis techniques across multiple benchmarks.",
  },
  {
    title:
      "Longitudinal Analysis of Urban Heat Island Mitigation Strategies in Coastal Metropolises",
    source: "Google Scholar indexed record",
    authors: "M. Santos, R. Nguyen",
    year: 2022,
    keywords: ["urban heat island", "green roofs", "coastal cities"],
    abstract:
      "A ten-year study evaluates green roof implementations and reflective surface treatments across five major coastal cities to measure cooling effects and policy readiness.",
  },
];

const tokenizeSimilarityText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

const jaccardSimilarity = (left, right) => {
  const leftSet = new Set(tokenizeSimilarityText(left));
  const rightSet = new Set(tokenizeSimilarityText(right));
  if (!leftSet.size || !rightSet.size) return 0;
  let intersection = 0;
  leftSet.forEach((word) => {
    if (rightSet.has(word)) intersection += 1;
  });
  return intersection / (leftSet.size + rightSet.size - intersection);
};

const analyzePublicationSimilarity = (submission) => {
  const result = scholarlyReferencePapers
    .map((paper) => {
      const titleScore = jaccardSimilarity(submission.title, paper.title);
      const abstractScore = jaccardSimilarity(
        submission.abstract,
        paper.abstract,
      );
      const keywordScore = jaccardSimilarity(
        submission.keywords,
        paper.keywords.join(" "),
      );
      const score =
        titleScore * 0.35 + abstractScore * 0.45 + keywordScore * 0.2;
      return {
        paper,
        percent: Math.round(score * 100),
      };
    })
    .sort((a, b) => b.percent - a.percent)[0];

  return {
    similarityPercent: result?.percent || 0,
    matchedTitle: result?.paper.title || "No indexed match found",
    matchedSource: result?.paper.source || "Google Scholar indexed record",
  };
};

const checkPublicationSimilarityWithScholar = async (submission) => {
  return apiFetch("/api/publications/similarity-check", {
    method: "POST",
    body: {
      title: submission.title,
      abstract: submission.abstract,
      keywords: submission.keywords,
      maxResults: 80,
    },
  });
};

const getStoredPublishedPublications = () => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(PUBLISHED_PUBLICATIONS_KEY) || "[]",
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const setStoredPublishedPublications = (publicationsToStore) => {
  window.localStorage.setItem(
    PUBLISHED_PUBLICATIONS_KEY,
    JSON.stringify(publicationsToStore),
  );
};

const getPublicationMergeKey = (paper) => {
  const title =
    paper?.title || paper?.paper?.title || paper?.matchedTitle || "";
  const normalizedTitle = String(title || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (normalizedTitle) return `title:${normalizedTitle}`;

  return `id:${String(
    paper?.id || paper?.submissionId || paper?.paper?.id || "unknown",
  ).toLowerCase()}`;
};

const mergePublicationsByIdOrTitle = (...lists) => {
  const seen = new Set();
  return lists.flat().filter((paper) => {
    const key = getPublicationMergeKey(paper);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getPublishedPublications = () => getStoredPublishedPublications();

const mapPublishedPublicationForCard = (paper) => ({
  id: paper.id,
  tags: paper.keywords?.length ? paper.keywords.slice(0, 2) : ["Published"],
  title: paper.title,
  excerpt: paper.abstract || "No abstract provided.",
  abstract: paper.abstract || "No abstract provided.",
  meta: `${paper.year || "N/A"}  -  ${formatCount(
    paper.citationCount,
  )} Citations  -  ${paper.journalName || "ScholarTrend Published"}`,
  authors: Array.isArray(paper.authors)
    ? paper.authors.join(", ")
    : paper.authors,
  source: paper.journalName || "ScholarTrend Published",
  journalName: paper.journalName || "ScholarTrend Published",
  doi: paper.doi || paper.DOI || "",
  sourceUrl: paper.sourceUrl || paper.SourceUrl || "",
  externalLinks: buildExternalSourceLinks(paper),
  citations: formatCount(paper.citationCount),
  year: paper.year,
  saved: false,
});

const MAX_KNOWLEDGE_GRAPH_DYNAMIC_NODES = 10;
const dynamicGraphNodePositions = [
  [0, 0, 40],
  [250, 110, -20],
  [290, -145, 34],
  [64, -250, -28],
  [-230, -130, 26],
  [-270, 124, -18],
  [-58, 260, 36],
  [390, 10, -48],
  [-396, 18, 44],
  [16, -380, 18],
];

const getPublicationDisplaySimilarity = (
  paper,
  accuracyLimit = 100,
  fallback = 0,
) =>
  clampPercentToAccuracy(
    paper.displayScore ??
      paper.DisplayScore ??
      paper.similarityPercent ??
      paper.SimilarityPercent ??
      paper.similarity ??
      paper.Similarity ??
      fallback,
    accuracyLimit,
  );

const calculateSearchMatchPercent = (paper = {}, query = "") => {
  const searchText = String(query || "").trim();
  if (!searchText) return null;

  const keywordText = Array.isArray(paper.keywords)
    ? paper.keywords.join(" ")
    : Array.isArray(paper.tags)
      ? paper.tags.join(" ")
      : "";
  const titleScore = jaccardSimilarity(searchText, paper.title || "");
  const abstractScore = jaccardSimilarity(
    searchText,
    paper.abstract || paper.summary || paper.excerpt || "",
  );
  const keywordScore = jaccardSimilarity(searchText, keywordText);
  const weightedScore =
    titleScore * 0.7 + abstractScore * 0.2 + keywordScore * 0.1;

  return Math.max(1, Math.min(100, weightedScore * 100));
};

const getPolicyScopedSearchAccuracy = (
  paper = {},
  query = "",
  accuracyLimit = 100,
) => {
  const searchScore = calculateSearchMatchPercent(paper, query);
  const explicitScore =
    paper.displayScore ??
    paper.DisplayScore ??
    paper.similarityPercent ??
    paper.SimilarityPercent ??
    paper.similarity ??
    paper.Similarity;
  const calculatedScore =
    normalizePercentValue(searchScore) ??
    normalizePercentValue(explicitScore) ??
    0;
  return clampPercentToAccuracy(calculatedScore, accuracyLimit);
};

const mapPublishedPublicationForGraph = (
  paper,
  index = 0,
  accuracyLimit = 100,
) => {
  const fallbackSimilarity =
    58 +
    Math.min(28, Number(paper.citationCount || paper.citations || 0) / 40) +
    (index % 5) * 2.4;

  return {
    id: paper.id,
    label: `${paper.title.slice(0, 28)}${paper.title.length > 28 ? "..." : ""}, ${
      paper.year || "Published"
    }`,
    position:
      dynamicGraphNodePositions[index % dynamicGraphNodePositions.length] ||
      dynamicGraphNodePositions[0],
    size: index === 0 ? 48 : 32,
    color: "#6d5dfc",
    similarity: getPublicationDisplaySimilarity(
      paper,
      accuracyLimit,
      fallbackSimilarity,
    ),
    published: true,
    paper,
  };
};

const mapPublicationForResearcherList = (
  paper,
  accuracyLimit = 100,
  query = "",
) => ({
  id: String(paper.id),
  title: paper.title,
  authors: Array.isArray(paper.authors)
    ? paper.authors.join(", ")
    : paper.authors || "Unknown authors",
  year: paper.year || "N/A",
  citations: Number(paper.citationCount || paper.citations || 0),
  doi: paper.doi || paper.DOI || "",
  source: paper.source || paper.sourceApi || paper.SourceApi || "",
  sourceApi: paper.sourceApi || paper.SourceApi || "",
  sourceUrl: paper.sourceUrl || paper.SourceUrl || "",
  journalName: paper.journalName || paper.JournalName || "",
  references: paper.keywords?.length || 0,
  similarity: getPolicyScopedSearchAccuracy(paper, query, accuracyLimit),
  abstract: paper.abstract || "",
  excerpt: paper.excerpt || "",
  fullText: getPaperFullText(paper),
  summary: paper.abstract || paper.excerpt || "No abstract provided.",
  tags: paper.keywords?.length ? paper.keywords : ["Published"],
  raw: paper,
});

const getPublicationReviewNotifications = () => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(PUBLICATION_REVIEW_NOTIFICATIONS_KEY) || "[]",
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const setPublicationReviewNotifications = (notifications) => {
  window.localStorage.setItem(
    PUBLICATION_REVIEW_NOTIFICATIONS_KEY,
    JSON.stringify(notifications),
  );
};

const normalizeLocalNotification = (notification) => ({
  id: notification.id || `local-notification-${Date.now()}`,
  type: notification.type || notification.notificationType || "SYSTEM ALERT",
  title: notification.title || "NOTICE:",
  text: notification.text || notification.message || "",
  recipientRole: notification.recipientRole || "All",
  recipientEmail: String(notification.recipientEmail || "").toLowerCase(),
  route: notification.route || "",
  createdAt: notification.createdAt || new Date().toISOString(),
  unread: notification.unread !== false && notification.isRead !== true,
});

const getNotificationRecipientRole = (role) => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "student") return "Student";
  if (normalized === "lecturer" || normalized === "lecture") return "Lecturer";
  if (normalized === "researcher") return "Researcher";
  if (normalized === "administrator" || normalized === "admin")
    return "Administrator";
  return "All";
};

const notificationMatchesRecipient = (notification, role, email = "") => {
  const recipientEmail = String(
    notification.recipientEmail || "",
  ).toLowerCase();
  const currentEmail = String(email || "").toLowerCase();
  const recipientRole = getNotificationRecipientRole(
    notification.recipientRole,
  );
  const currentRole = getNotificationRecipientRole(role);
  const emailMatches = Boolean(
    recipientEmail && currentEmail && recipientEmail === currentEmail,
  );
  const roleMatches = recipientRole === "All" || recipientRole === currentRole;

  if (recipientEmail && recipientRole === "All") return emailMatches;
  return emailMatches || roleMatches;
};

const mergeNotificationsById = (...lists) => {
  const seen = new Set();
  return lists
    .flat()
    .filter(Boolean)
    .map(normalizeLocalNotification)
    .filter((notification) => {
      if (seen.has(notification.id)) return false;
      seen.add(notification.id);
      return true;
    })
    .sort(
      (left, right) =>
        (Date.parse(right.createdAt) || 0) - (Date.parse(left.createdAt) || 0),
    );
};

const persistLocalNotifications = (notifications) => {
  const nextNotifications = mergeNotificationsById(notifications);
  setPublicationReviewNotifications(nextNotifications);
  window.dispatchEvent(new Event("scholartrend:notifications"));
  return nextNotifications;
};

const fetchLocalNotificationsFromAuthHelper = async ({ role, email } = {}) => {
  if (!GOOGLE_AUTH_BASE_URL) return [];
  const params = new URLSearchParams();
  if (role) params.set("role", getNotificationRecipientRole(role));
  if (email) params.set("email", email);
  const response = await fetch(
    `${GOOGLE_AUTH_BASE_URL}/api/notifications/local?${params.toString()}`,
    { credentials: "include" },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Could not load local notifications.",
    );
  }
  return Array.isArray(payload.items)
    ? payload.items.map(normalizeLocalNotification)
    : [];
};

const fetchAllLocalNotificationsFromAuthHelper = async () => {
  if (!GOOGLE_AUTH_BASE_URL) return [];
  const response = await fetch(
    `${GOOGLE_AUTH_BASE_URL}/api/admin/notifications/local`,
    { credentials: "include" },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Could not load Admin notification history.",
    );
  }
  return Array.isArray(payload.items)
    ? payload.items.map(normalizeLocalNotification)
    : [];
};

const mirrorLocalNotificationToAuthHelper = async (notification) => {
  if (!GOOGLE_AUTH_BASE_URL) return null;
  const response = await fetch(
    `${GOOGLE_AUTH_BASE_URL}/api/admin/notifications/local`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notification),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Could not save notification to the local helper.",
    );
  }
  return normalizeLocalNotification(payload.notification || payload);
};

const deleteLocalNotificationFromAuthHelper = async (id) => {
  if (!GOOGLE_AUTH_BASE_URL || !id) return;
  const response = await fetch(
    `${GOOGLE_AUTH_BASE_URL}/api/admin/notifications/local/${encodeURIComponent(
      id,
    )}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Could not delete notification from the local helper.",
    );
  }
};

const markLocalNotificationsReadOnAuthHelper = async () => {
  if (!GOOGLE_AUTH_BASE_URL) return;
  await fetch(
    `${GOOGLE_AUTH_BASE_URL}/api/admin/notifications/local/read-all`,
    {
      method: "PUT",
      credentials: "include",
    },
  );
};

function useApiResource(path, fallbackValue, options = {}) {
  const [data, setData] = React.useState(fallbackValue);
  const [status, setStatus] = React.useState("idle");
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const canUseBackend =
      !path ||
      options.allowUnauthenticated ||
      Boolean(getStoredAuth().accessToken);
    if (!path || !canUseBackend) {
      setStatus("idle");
      setError(null);
      setData(fallbackValue);
      return () => {
        cancelled = true;
      };
    }

    setStatus("loading");
    setError(null);
    if (options.clearOnLoad) {
      setData(fallbackValue);
    }

    apiFetch(path, { auth: options.auth, signal: controller.signal })
      .then((payload) => {
        if (cancelled) return;
        setData(options.select ? options.select(payload) : payload);
        setStatus("success");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError);
        setData(fallbackValue);
        setStatus("error");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path]);

  return { data, status, error };
}

const defaultSearchSuggestions = [
  "Artificial Intelligence",
  "Machine Learning",
  "AI in Education",
  "Climate Change Policy",
  "CRISPR Applications",
  "Quantum Cryptography",
  "Neural Networks",
  "Sociological Impact of AI",
  "Advanced Polymer Synthesis",
];

const getLocalSearchSuggestions = (query = "", limit = 8) => {
  const needle = String(query || "")
    .trim()
    .toLowerCase();
  const published = getPublishedPublications();
  const candidates = [
    ...defaultSearchSuggestions,
    ...published.flatMap((paper) => [
      paper.title,
      paper.journalName,
      ...(Array.isArray(paper.keywords) ? paper.keywords : []),
    ]),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const unique = [...new Set(candidates)];
  const filtered = needle
    ? unique.filter((item) => item.toLowerCase().includes(needle))
    : unique;
  return filtered.slice(0, limit);
};

function useSearchSuggestions(query, limit = 8) {
  const data = React.useMemo(
    () => getLocalSearchSuggestions(query, limit),
    [query, limit],
  );

  return { data, status: "success", error: null };
}

const downloadReferenceExport = async ({
  format = "bibtex",
  ids = [],
  query = "",
  filenamePrefix = "scholartrend-references",
} = {}) => {
  const params = new URLSearchParams({ format });
  const numericIds = ids.filter((id) => isBackendNumericId(id));
  if (numericIds.length) params.set("ids", numericIds.join(","));
  if (!numericIds.length && query?.trim()) params.set("q", query.trim());

  const response = await fetch(
    `${API_BASE_URL}/api/publications/export?${params.toString()}`,
    {
      __skipClientAlert: true,
    },
  );
  if (!response.ok) throw new Error("Could not export references.");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filenamePrefix}.${format === "ris" ? "ris" : "bib"}`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const beginGoogleOAuth = async (role) => {
  const response = await fetch(
    `${GOOGLE_AUTH_BASE_URL}/api/auth/google/url?role=${encodeURIComponent(role)}`,
    { credentials: "include" },
  );
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : {};

  if (!response.ok || !payload.url) {
    throw new Error(
      payload.error ||
        "Google OAuth is not available on the current backend. Start the optional Node auth server or use email/password sign in.",
    );
  }

  window.location.assign(payload.url);
};

const beginAcademicOAuth = async (provider, role) => {
  const providerSlug = provider === "ORCID" ? "orcid" : "institution";
  const response = await fetch(
    `${GOOGLE_AUTH_BASE_URL}/api/auth/${providerSlug}/url?role=${encodeURIComponent(role)}`,
    { credentials: "include" },
  );
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : {};
  if (!response.ok || !payload.url) {
    throw new Error(
      payload.error || `${provider} authentication is not configured.`,
    );
  }
  window.location.assign(payload.url);
};

function DonutChartInteractive() {
  const [selectedSegment, setSelectedSegment] = React.useState(null);
  const [hoveredSegment, setHoveredSegment] = React.useState(null);

  const segments = [
    {
      id: "ai",
      label: "Artificial Intelligence",
      percent: 35,
      publications: "840K",
      color: "#3b82f6",
      dasharray: "44 81.6",
      dashoffset: "0",
    },
    {
      id: "medicine",
      label: "Medicine",
      percent: 22,
      publications: "528K",
      color: "#0ea5e9",
      dasharray: "27.6 98",
      dashoffset: "-44",
    },
    {
      id: "cs",
      label: "Computer Science",
      percent: 18,
      publications: "432K",
      color: "#8b5cf6",
      dasharray: "22.6 103",
      dashoffset: "-71.6",
    },
    {
      id: "eng",
      label: "Engineering",
      percent: 15,
      publications: "360K",
      color: "#f97316",
      dasharray: "18.8 106.8",
      dashoffset: "-94.2",
    },
    {
      id: "other",
      label: "Others",
      percent: 10,
      publications: "240K",
      color: "#10b981",
      dasharray: "12.6 113",
      dashoffset: "-113",
    },
  ];

  const handleSegmentClick = (segment) => {
    setSelectedSegment(selectedSegment?.id === segment.id ? null : segment);
  };

  return (
    <div className="lp-donut-row" style={{ position: "relative" }}>
      <svg
        viewBox="0 0 60 60"
        width="48"
        height="48"
        aria-hidden="true"
        style={{
          transform: "rotate(-90deg)",
          display: "block",
        }}
      >
        {segments.map((segment) => (
          <circle
            key={segment.id}
            cx="30"
            cy="30"
            r="20"
            fill="none"
            stroke={segment.color}
            strokeWidth="6"
            strokeDasharray={segment.dasharray}
            strokeDashoffset={segment.dashoffset}
            style={{
              cursor: "pointer",
              opacity:
                hoveredSegment === segment.id ||
                selectedSegment?.id === segment.id
                  ? 1
                  : hoveredSegment || selectedSegment
                    ? 0.5
                    : 1,
              transition: "all 0.3s ease",
              filter:
                hoveredSegment === segment.id ||
                selectedSegment?.id === segment.id
                  ? "drop-shadow(0 0 4px " + segment.color + ")"
                  : "none",
            }}
            onClick={() => handleSegmentClick(segment)}
            onMouseEnter={() => setHoveredSegment(segment.id)}
            onMouseLeave={() => setHoveredSegment(null)}
          />
        ))}
      </svg>
      {selectedSegment && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "55px",
            transform: "translateY(-50%)",
            background: "white",
            border: "2px solid " + selectedSegment.color,
            borderRadius: "8px",
            padding: "12px 16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 10,
            minWidth: "160px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
              fontWeight: 600,
              marginBottom: "4px",
            }}
          >
            {selectedSegment.label}
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: selectedSegment.color,
              marginBottom: "2px",
            }}
          >
            {selectedSegment.publications}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            {selectedSegment.percent}% of total
          </div>
          <button
            onClick={() => setSelectedSegment(null)}
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "16px",
              padding: "2px 6px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
      <div className="lp-donut-legend">
        {segments.map((segment) => (
          <span
            key={segment.id}
            onClick={() => handleSegmentClick(segment)}
            style={{
              cursor: "pointer",
              opacity:
                hoveredSegment === segment.id ||
                selectedSegment?.id === segment.id
                  ? 1
                  : hoveredSegment || selectedSegment
                    ? 0.5
                    : 1,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={() => setHoveredSegment(segment.id)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <i style={{ background: segment.color }}></i>
            {segment.label} {segment.percent}%
          </span>
        ))}
      </div>
    </div>
  );
}

function Brand({ boxed = false, small = false }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <a
      className={small ? "footer-brand" : "brand"}
      href="/"
      onClick={navTo("/")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: small ? "10px" : "14px",
        textDecoration: "none",
        fontWeight: 700,
        fontSize: small ? "14px" : "22px",
        letterSpacing: "-0.03em",
        transition: "all 0.3s ease",
      }}
    >
      <span
        className={`brand-mark ${boxed ? "boxed" : ""} ${small ? "small" : ""}`}
        aria-hidden="true"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: small ? "32px" : "42px",
          height: small ? "32px" : "42px",
          background:
            "linear-gradient(135deg, #06b6d4 0%, #0284c7 50%, #0369a1 100%)",
          borderRadius: small ? "10px" : "12px",
          padding: small ? "5px" : "6px",
          boxShadow: isHovered
            ? "0 6px 24px rgba(6, 182, 212, 0.5), 0 3px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
            : "0 4px 16px rgba(6, 182, 212, 0.35), 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          animation: isHovered ? "none" : "logoRotate 4s ease-in-out infinite",
          transformStyle: "preserve-3d",
          transform: isHovered ? "scale(1.15) rotateY(180deg)" : undefined,
        }}
      >
        {boxed ? (
          <svg
            viewBox="0 0 32 32"
            role="img"
            style={{
              width: "100%",
              height: "100%",
              fill: "none",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              transition: "all 0.4s ease",
            }}
          >
            <path d="M8 24V12" stroke="white" strokeWidth="3" opacity="0.9" />
            <path d="M16 24V8" stroke="white" strokeWidth="3.5" opacity="1" />
            <path d="M24 24V14" stroke="white" strokeWidth="3" opacity="0.9" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 32 32"
            role="img"
            style={{
              width: "100%",
              height: "100%",
              transition: "all 0.4s ease",
            }}
          >
            {/* Base shape - white geometric icon */}
            <path
              d="M16 4 L10 8 L10 16 L16 20 L16 12 L16 4 Z"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M16 4 L22 8 L22 16 L16 20 L16 12 L16 4 Z"
              fill="white"
              opacity="0.75"
            />
            {/* Top triangle - highlight */}
            <path
              d="M16 4 L10 8 L16 10 L22 8 Z"
              fill="rgba(255, 255, 255, 0.95)"
            />
            {/* Accent line */}
            <path
              d="M16 4 L16 28"
              stroke="rgba(2, 132, 199, 0.4)"
              strokeWidth="1.5"
            />
            {/* Bottom accent */}
            <circle cx="16" cy="28" r="1.5" fill="white" />
          </svg>
        )}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        <span
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Scholar
        </span>
        <span
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Trend
        </span>
        {small ? (
          <span
            style={{
              color: "#64748b",
              fontSize: "11px",
              fontWeight: 500,
              marginLeft: "8px",
              letterSpacing: "0",
            }}
          >
            {" "}
            © 2026
          </span>
        ) : (
          ""
        )}
      </span>
    </a>
  );
}

function LandingPage() {
  const [activeDataPoint, setActiveDataPoint] = React.useState(5); // Default to 2025 (index 5)

  const chartData = [
    { year: "2020", value: 5200, publications: "5,200", growth: "baseline" },
    { year: "2021", value: 12500, publications: "12,500", growth: "+140%" },
    { year: "2022", value: 23800, publications: "23,800", growth: "+90%" },
    { year: "2023", value: 42100, publications: "42,100", growth: "+77%" },
    { year: "2024", value: 60420, publications: "60,420", growth: "+43%" },
    { year: "2025", value: 96847, publications: "96,847", growth: "+160%" },
  ];

  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Primary navigation">
        <Brand />
        <nav className="lp-nav-links" aria-label="Main navigation">
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            Features
          </a>
          <a
            href="#trends"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("trends")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3v18h18" />
              <path d="M18 17l-5-5-4 4-6-6" />
            </svg>
            Trends
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("pricing")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
              <path d="M12 12v4" />
              <path d="M10 14h4" />
            </svg>
            Pricing
          </a>
          <a
            href="#resources"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("resources")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Resources
          </a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("about")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            About
          </a>
        </nav>
        <nav className="nav-actions" aria-label="Account">
          <a className="login-link" href="/login" onClick={navTo("/login")}>
            <svg viewBox="0 0 24 24" className="login-icon" aria-hidden="true">
              <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
              <path d="M19 12H9" />
              <path d="m15 8 4 4-4 4" />
            </svg>
            <span>Log in</span>
          </a>
          <a
            className="primary-button compact"
            href="/register"
            onClick={navTo("/register")}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ width: "18px", height: "18px", strokeWidth: 2 }}
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            Get Started
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="lp-hero-section">
        <div className="lp-hero-copy">
          <div className="lp-eyebrow">
            <span className="lp-eyebrow-star">★</span>
            AI-Powered Research Intelligence
          </div>
          <h1 className="lp-hero-h1">
            Track the Pulse of <br />
            <span className="lp-brand-blue">Research</span>
          </h1>
          <p className="lp-hero-desc">
            ScholarTrend aggregates, analyzes, and visualizes academic
            publications from trusted scholarly databases to reveal emerging
            research trends with clarity.
          </p>
          <div className="lp-search-bar">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="lp-search-icon"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
            <input
              type="text"
              placeholder="Search publications, authors, topics, or journals..."
              className="lp-search-input"
            />
            <button className="lp-search-btn">
              Search
              <svg
                viewBox="0 0 24 24"
                className="lp-search-btn-icon"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16.5 16.5 4 4" />
              </svg>
            </button>
          </div>
          <div className="lp-hero-actions">
            <a
              className="lp-primary-btn"
              href="/register"
              onClick={navTo("/register")}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  width: "20px",
                  height: "20px",
                  strokeWidth: 2.5,
                  fill: "none",
                }}
              >
                <path d="M12 2v20M5 12l7-7 7 7" />
              </svg>
              Get Started - It's Free
            </a>
            <a className="lp-demo-btn" href="/login" onClick={navTo("/login")}>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="lp-demo-play-icon"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
              View Demo
            </a>
          </div>
          <div className="lp-trust-row">
            <div className="lp-avatar-group" aria-hidden="true">
              <img
                className="lp-avatar"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Researcher 1"
              />
              <img
                className="lp-avatar"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Researcher 2"
              />
              <img
                className="lp-avatar"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Researcher 3"
              />
              <img
                className="lp-avatar"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Researcher 4"
              />
            </div>
            <div className="lp-trust-text">
              <span className="lp-stars">★★★★★</span>
              <span>Trusted by 10,000+ researchers worldwide</span>
            </div>
          </div>
        </div>
        <div
          className="lp-hero-visual"
          aria-label="ScholarTrend analytics dashboard"
        >
          <div className="lp-dashboard-mockup">
            <div className="lp-dash-header">
              <span
                className="lp-dash-logo"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    background:
                      "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
                    borderRadius: "5px",
                    padding: "5px",
                    boxShadow: "0 2px 6px rgba(6, 182, 212, 0.25)",
                  }}
                >
                  <svg
                    viewBox="0 0 32 32"
                    width="100%"
                    height="100%"
                    aria-hidden="true"
                  >
                    <path
                      d="M16 4 L10 8 L10 16 L16 20 L16 12 L16 4 Z"
                      fill="white"
                      opacity="0.95"
                    />
                    <path
                      d="M16 4 L22 8 L22 16 L16 20 L16 12 L16 4 Z"
                      fill="white"
                      opacity="0.75"
                    />
                    <path
                      d="M16 4 L10 8 L16 10 L22 8 Z"
                      fill="rgba(255, 255, 255, 0.95)"
                    />
                    <path
                      d="M16 4 L16 28"
                      stroke="rgba(2, 132, 199, 0.4)"
                      strokeWidth="1.5"
                    />
                    <circle cx="16" cy="28" r="1.5" fill="white" />
                  </svg>
                </span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>
                  Scholar<span style={{ color: "#06b6d4" }}>Trend</span>
                </span>
              </span>
              <div className="lp-dash-search-container">
                <svg
                  viewBox="0 0 24 24"
                  className="lp-dash-search-icon"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16.5 16.5 4 4" />
                </svg>
                <input
                  className="lp-dash-search"
                  placeholder="Search anything..."
                  readOnly
                />
              </div>
              <div className="lp-dash-header-actions">
                <svg
                  viewBox="0 0 24 24"
                  className="lp-dash-bell"
                  aria-hidden="true"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <img
                  className="lp-dash-avatar"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=40&h=40&q=80"
                  alt="Avatar"
                />
              </div>
            </div>
            <div className="lp-dash-body">
              <nav className="lp-dash-sidebar">
                {[
                  {
                    name: "Overview",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="5" rx="1.5" />
                        <rect x="14" y="12" width="7" height="9" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    ),
                  },
                  {
                    name: "Trends",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M3 17l6-6 4 4 8-8" />
                        <path d="M21 7v6h-6" />
                      </svg>
                    ),
                  },
                  {
                    name: "Publications",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                    ),
                  },
                  {
                    name: "Journals",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    ),
                  },
                  {
                    name: "Authors",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    ),
                  },
                  {
                    name: "Alerts",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    ),
                  },
                  {
                    name: "Saved",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    ),
                  },
                  {
                    name: "Settings",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.25m5.07 5.07l4.24 4.25M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.07-5.07l4.24-4.25" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <span
                    key={item.name}
                    className={`lp-dash-navitem${item.name === "Overview" ? " active" : ""}`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </span>
                ))}
              </nav>
              <div className="lp-dash-content">
                <div className="lp-dash-title">Overview</div>
                <div className="lp-dash-stats">
                  <div className="lp-dash-stat">
                    <div className="lp-dash-stat-left">
                      <span className="lp-dash-stat-val">2.1M+</span>
                      <span className="lp-dash-stat-label">Publications</span>
                    </div>
                    <div className="lp-dash-stat-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        className="lp-dash-stat-icon"
                        aria-hidden="true"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  </div>
                  <div className="lp-dash-stat">
                    <div className="lp-dash-stat-left">
                      <span className="lp-dash-stat-val">150K+</span>
                      <span className="lp-dash-stat-label">Journals</span>
                    </div>
                    <div className="lp-dash-stat-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        className="lp-dash-stat-icon"
                        aria-hidden="true"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
                      </svg>
                    </div>
                  </div>
                  <div className="lp-dash-stat">
                    <div className="lp-dash-stat-left">
                      <span className="lp-dash-stat-val">500K+</span>
                      <span className="lp-dash-stat-label">Researchers</span>
                    </div>
                    <div className="lp-dash-stat-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        className="lp-dash-stat-icon"
                        aria-hidden="true"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                  </div>
                  <div className="lp-dash-stat">
                    <div className="lp-dash-stat-left">
                      <span className="lp-dash-stat-val">98+</span>
                      <span className="lp-dash-stat-label">Countries</span>
                    </div>
                    <div className="lp-dash-stat-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        className="lp-dash-stat-icon"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="lp-dash-charts">
                  <div className="lp-dash-chart-box">
                    <div className="lp-dash-chart-title">Publication Trend</div>
                    <svg
                      viewBox="0 0 180 80"
                      className="lp-mini-chart"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient
                          id="chartFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#3b82f6"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="#3b82f6"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <line
                        x1="20"
                        y1="15"
                        x2="170"
                        y2="15"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <line
                        x1="20"
                        y1="35"
                        x2="170"
                        y2="35"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <line
                        x1="20"
                        y1="55"
                        x2="170"
                        y2="55"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <line
                        x1="20"
                        y1="70"
                        x2="170"
                        y2="70"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />

                      <path
                        d="M20 65 Q 35 62, 50 56 T 80 46 T 110 30 T 140 18 T 170 8"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      <path
                        d="M20 65 Q 35 62, 50 56 T 80 46 T 110 30 T 140 18 T 170 8 L 170 70 L 20 70 Z"
                        fill="url(#chartFill)"
                      />

                      <circle
                        cx="20"
                        cy="65"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="50"
                        cy="56"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="80"
                        cy="46"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="110"
                        cy="30"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="140"
                        cy="18"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="170"
                        cy="8"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />

                      <text x="5" y="18" fill="#94a3b8" fontSize="6">
                        100K
                      </text>
                      <text x="5" y="38" fill="#94a3b8" fontSize="6">
                        50K
                      </text>
                      <text x="5" y="58" fill="#94a3b8" fontSize="6">
                        25K
                      </text>
                      <text x="5" y="73" fill="#94a3b8" fontSize="6">
                        0
                      </text>

                      <text
                        x="20"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2020
                      </text>
                      <text
                        x="50"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2021
                      </text>
                      <text
                        x="80"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2022
                      </text>
                      <text
                        x="110"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2023
                      </text>
                      <text
                        x="140"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2024
                      </text>
                    </svg>
                  </div>
                  <div className="lp-dash-chart-box donut-box">
                    <div className="lp-dash-chart-title">
                      Top Research Areas
                    </div>
                    <DonutChartInteractive />
                  </div>
                </div>
                <div className="lp-dash-bottom-grid">
                  <div className="lp-dash-emerging">
                    <div className="lp-dash-chart-title">Emerging Topics</div>
                    {[
                      {
                        label: "Large Language Models",
                        pct: "+168%",
                        data: [15, 12, 14, 8, 6, 2],
                      },
                      {
                        label: "AI in Healthcare",
                        pct: "+112%",
                        data: [14, 10, 11, 7, 4, 2],
                      },
                      {
                        label: "Quantum Computing",
                        pct: "+95%",
                        data: [16, 13, 9, 8, 6, 3],
                      },
                      {
                        label: "Sustainable Energy",
                        pct: "+74%",
                        data: [15, 12, 12, 9, 7, 4],
                      },
                    ].map((t) => (
                      <div key={t.label} className="lp-emerging-row">
                        <span className="lp-emerging-label">{t.label}</span>
                        <div
                          className="lp-emerging-sparkline-wrap"
                          style={{ width: "60px", height: "20px" }}
                        >
                          <Line
                            data={{
                              labels: ["", "", "", "", "", ""],
                              datasets: [
                                {
                                  data: t.data,
                                  borderColor: "#3b82f6",
                                  borderWidth: 1.5,
                                  tension: 0.4,
                                  pointRadius: 0,
                                  pointHoverRadius: 0,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                                tooltip: { enabled: false },
                              },
                              scales: {
                                x: { display: false },
                                y: { display: false },
                              },
                              elements: {
                                line: {
                                  borderCapStyle: "round",
                                  borderJoinStyle: "round",
                                },
                              },
                            }}
                          />
                        </div>
                        <span className="lp-emerging-pct">{t.pct}</span>
                      </div>
                    ))}
                  </div>
                  <div className="lp-dash-journals">
                    <div className="lp-dash-chart-title">Top Journals</div>
                    <table className="lp-dash-table">
                      <thead>
                        <tr>
                          <th>Journal</th>
                          <th>Volume</th>
                          <th style={{ textAlign: "right" }}>Publications</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="lp-dash-table-name">Nature</td>
                          <td className="lp-dash-table-bar-col">
                            <div className="lp-dash-table-bar-wrap">
                              <div
                                className="lp-dash-table-bar"
                                style={{ width: "85%" }}
                              ></div>
                            </div>
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            className="lp-dash-table-val"
                          >
                            28,632
                          </td>
                        </tr>
                        <tr>
                          <td className="lp-dash-table-name">Science</td>
                          <td className="lp-dash-table-bar-col">
                            <div className="lp-dash-table-bar-wrap">
                              <div
                                className="lp-dash-table-bar"
                                style={{ width: "68%" }}
                              ></div>
                            </div>
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            className="lp-dash-table-val"
                          >
                            22,401
                          </td>
                        </tr>
                        <tr>
                          <td className="lp-dash-table-name">IEEE/CAA</td>
                          <td className="lp-dash-table-bar-col">
                            <div className="lp-dash-table-bar-wrap">
                              <div
                                className="lp-dash-table-bar"
                                style={{ width: "55%" }}
                              ></div>
                            </div>
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            className="lp-dash-table-val"
                          >
                            18,505
                          </td>
                        </tr>
                        <tr>
                          <td className="lp-dash-table-name">The Lancet</td>
                          <td className="lp-dash-table-bar-col">
                            <div className="lp-dash-table-bar-wrap">
                              <div
                                className="lp-dash-table-bar"
                                style={{ width: "36%" }}
                              ></div>
                            </div>
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            className="lp-dash-table-val"
                          >
                            12,098
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        className="lp-stats-bar"
        aria-label="Platform statistics"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          padding: "48px 0",
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "32px",
            padding: "0 24px",
          }}
        >
          {[
            {
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              ),
              value: "2M+",
              label: "Publications Indexed",
              color: "#3b82f6",
              gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            },
            {
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
              value: "500K+",
              label: "Researchers",
              color: "#8b5cf6",
              gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            },
            {
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              ),
              value: "150K+",
              label: "Journals",
              color: "#10b981",
              gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            },
            {
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              ),
              value: "50+",
              label: "Countries",
              color: "#f59e0b",
              gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="lp-stat-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "24px",
                background: "white",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 24px ${stat.color}20`;
                e.currentTarget.style.borderColor = `${stat.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <div
                className="lp-stat-icon"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: stat.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${stat.color}30`,
                }}
              >
                <div style={{ color: "white", width: "28px", height: "28px" }}>
                  {stat.icon}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  minWidth: 0,
                }}
              >
                <strong
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#1e293b",
                    lineHeight: "1",
                  }}
                >
                  {stat.value}
                </strong>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Powerful Features Section */}
      <section
        id="features"
        className="lp-features-section"
        aria-labelledby="features-title"
      >
        <div
          className="lp-section-label"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="18"
            height="18"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          POWERFUL FEATURES
        </div>
        <h2 id="features-title" className="lp-section-h2">
          Everything you need for
          <br />
          smarter research
        </h2>
        <p className="lp-section-desc">
          Advanced tools to help you discover, analyze, and stay ahead in the
          ever-evolving world of academic research.
        </p>
        <div className="lp-feature-grid">
          {[
            {
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              ),
              title: "Smart Search",
              desc: "Advanced semantic search understands context, not just keywords. Find the most relevant publications instantly.",
              color: "#3b82f6",
              gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            },
            {
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="M18 17l-5-5-4 4-6-6" />
                </svg>
              ),
              title: "Trend Analytics",
              desc: "Visualize research trends over time, identify emerging topics, and track citation velocity in real-time.",
              color: "#8b5cf6",
              gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            },
            {
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              ),
              title: "AI Insights",
              desc: "AI-powered summaries, research gap analysis, and key findings extraction from complex papers.",
              color: "#10b981",
              gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            },
            {
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  <path d="M12 7v5" />
                  <path d="M10 9h4" />
                </svg>
              ),
              title: "Personal Workspace",
              desc: "Save papers, follow topics, set alerts, and organize your research in one personalized workspace.",
              color: "#f59e0b",
              gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            },
          ].map((feature, i) => (
            <article
              key={feature.title}
              className="lp-feat-card"
              style={{
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = `0 20px 40px ${feature.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div
                className={`lp-feat-icon ${["blue", "purple", "green", "orange"][i]}`}
                style={{
                  background: `${feature.color}15`,
                  border: `2px solid ${feature.color}30`,
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    right: "-50%",
                    width: "100%",
                    height: "100%",
                    background: feature.gradient,
                    opacity: 0.1,
                    borderRadius: "50%",
                  }}
                />
                <div
                  style={{
                    color: feature.color,
                    width: "32px",
                    height: "32px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {feature.icon}
                </div>
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "12px",
                  textAlign: "center",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  color: "#64748b",
                  lineHeight: "1.7",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                {feature.desc}
              </p>
              <a
                className="lp-feat-link"
                href="/register"
                onClick={navTo("/register")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: feature.color,
                  fontWeight: "500",
                  fontSize: "14px",
                  textDecoration: "none",
                  transition: "gap 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.gap = "10px")}
                onMouseLeave={(e) => (e.currentTarget.style.gap = "6px")}
              >
                Learn more
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Dark Trend Visualization Section */}
      <section
        id="trends"
        className="lp-trend-section"
        aria-labelledby="trend-title"
      >
        <div className="lp-trend-container">
          <div className="lp-trend-left">
            <div className="lp-trend-label">TREND VISUALIZATION</div>
            <h2 id="trend-title" className="lp-trend-h2">
              Discover Emerging
              <br />
              Trends Before
              <br />
              Everyone Else
            </h2>
            <p className="lp-trend-desc">
              Our real-time analytics engine scans millions of publications to
              identify emerging research areas and predict future trends.
            </p>
            <a
              className="lp-explore-btn"
              href="/register"
              onClick={navTo("/register")}
            >
              Explore Trends →
            </a>
          </div>

          <div className="lp-trend-middle">
            <div className="lp-trend-chart-header">
              <span className="lp-trend-topic">AI in Healthcare</span>
              <span className="lp-trend-badge">Emerging</span>
            </div>

            <div style={{ height: "180px", position: "relative" }}>
              <Line
                data={{
                  labels: ["2020", "2021", "2022", "2023", "2024", "2025"],
                  datasets: [
                    {
                      label: "AI in Healthcare Publications",
                      data: [5000, 10800, 23800, 42000, 61500, 96847],
                      borderColor: "#06b6d4",
                      backgroundColor: "rgba(6, 182, 212, 0.2)",
                      tension: 0.4,
                      fill: true,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                      pointBackgroundColor: "#06b6d4",
                      pointBorderColor: "#fff",
                      pointBorderWidth: 2,
                      pointHoverBackgroundColor: "#06b6d4",
                      pointHoverBorderColor: "#fff",
                      pointHoverBorderWidth: 3,
                      borderWidth: 3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  onClick: (event, elements) => {
                    if (elements.length > 0) {
                      setActiveDataPoint(elements[0].index);
                    }
                  },
                  interaction: {
                    mode: "point",
                    intersect: true,
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      enabled: true,
                      backgroundColor: "rgba(13, 27, 42, 0.95)",
                      borderColor: "rgba(6, 182, 212, 0.4)",
                      borderWidth: 1.5,
                      padding: 12,
                      titleColor: "#ffffff",
                      bodyColor: "#06b6d4",
                      titleFont: {
                        size: 13,
                        weight: "bold",
                      },
                      bodyFont: {
                        size: 12,
                        weight: "bold",
                      },
                      footerColor: "rgba(255,255,255,0.65)",
                      footerFont: {
                        size: 11,
                      },
                      displayColors: false,
                      callbacks: {
                        title: function (context) {
                          const year = context[0].label;
                          return year === "2025" ? year + " (Projected)" : year;
                        },
                        label: function (context) {
                          return (
                            context.parsed.y.toLocaleString() + " publications"
                          );
                        },
                        footer: function (context) {
                          const idx = context[0].dataIndex;
                          if (idx === 0) return "Starting year";
                          const currentYear = parseInt(context[0].label);
                          const growth = chartData[idx].growth;
                          return growth + " from " + (currentYear - 1);
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100000,
                      grid: {
                        color: "rgba(255, 255, 255, 0.06)",
                        drawBorder: false,
                      },
                      ticks: {
                        color: "#94a3b8",
                        font: {
                          size: 10,
                        },
                        callback: function (value) {
                          return value / 1000 + "k";
                        },
                        stepSize: 25000,
                      },
                      border: {
                        display: false,
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                        drawBorder: false,
                      },
                      ticks: {
                        color: "#64748b",
                        font: {
                          size: 10,
                        },
                      },
                      border: {
                        color: "rgba(255, 255, 255, 0.1)",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="lp-trend-right">
            <div className="lp-top-rising">
              <div className="lp-top-rising-title">Top Rising Topics</div>
              {[
                { label: "Large Language Models", pct: "+149%" },
                { label: "AI in Healthcare", pct: "+112%" },
                { label: "Quantum Computing", pct: "+95%" },
                { label: "Sustainable Energy", pct: "+76%" },
                { label: "Bioinformatics", pct: "+63%" },
              ].map((t, i) => (
                <div key={t.label} className="lp-rising-row">
                  <span className="lp-rising-rank">{i + 1}</span>
                  <span className="lp-rising-label">{t.label}</span>
                  <span className="lp-rising-pct">{t.pct}</span>
                </div>
              ))}
              <a
                className="lp-view-all-btn"
                href="/register"
                onClick={navTo("/register")}
              >
                View All Trends
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-how-section" aria-labelledby="how-title">
        <div
          className="lp-section-label"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="18"
            height="18"
          >
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          HOW IT WORKS
        </div>
        <h2 id="how-title" className="lp-section-h2">
          From Search to Insight in 4 Simple Steps
        </h2>
        <div className="lp-steps-row">
          {[
            {
              num: "1",
              color: "#3b82f6",
              bgGradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              ),
              label: "Search",
              desc: "Search for topics, keywords, authors, or journals.",
            },
            {
              num: "2",
              color: "#10b981",
              bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 21H4.6c-.56 0-.84 0-1.054-.109a1 1 0 01-.437-.437C3 20.24 3 19.96 3 19.4V3" />
                  <path d="M7 14l3.5-3.5L14 14l5.5-5.5" />
                </svg>
              ),
              label: "Analyze",
              desc: "Analyze trends, citations, and research patterns.",
            },
            {
              num: "3",
              color: "#f59e0b",
              bgGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M12 18v-6" />
                  <path d="M9 15h6" />
                </svg>
              ),
              label: "Explore",
              desc: "Explore related papers, authors, and emerging topics.",
            },
            {
              num: "4",
              color: "#8b5cf6",
              bgGradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  <path d="M12 11V7" />
                  <path d="M10 9h4" />
                </svg>
              ),
              label: "Save & Track",
              desc: "Save your research and get alerts on new developments.",
            },
          ].map((step, i) => (
            <React.Fragment key={step.num}>
              <div
                className="lp-step"
                style={{
                  position: "relative",
                  transition: "transform 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-8px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  className={`lp-step-num lp-step-num-${i}`}
                  style={{
                    background: step.bgGradient,
                    color: "white",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "700",
                    margin: "0 auto 16px",
                    boxShadow: `0 4px 14px ${step.color}40`,
                  }}
                >
                  {step.num}
                </div>
                <div
                  className="lp-step-icon"
                  style={{
                    width: "56px",
                    height: "56px",
                    margin: "0 auto 16px",
                    background: `${step.color}10`,
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${step.color}20`,
                  }}
                >
                  <div
                    style={{ color: step.color, width: "28px", height: "28px" }}
                  >
                    {step.icon}
                  </div>
                </div>
                <div
                  className="lp-step-label"
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e293b",
                    marginBottom: "8px",
                  }}
                >
                  {step.label}
                </div>
                <div
                  className="lp-step-desc"
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    lineHeight: "1.6",
                  }}
                >
                  {step.desc}
                </div>
              </div>
              {i < 3 && (
                <div
                  className="lp-step-arrow"
                  aria-hidden="true"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 -20px",
                    alignSelf: "center",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    width="32"
                    height="32"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="resources"
        className="lp-testimonials-section"
        aria-labelledby="testimonials-title"
      >
        <div className="lp-section-label">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
            style={{
              display: "inline-block",
              marginRight: "8px",
              verticalAlign: "middle",
            }}
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          TRUSTED BY RESEARCHERS
        </div>
        <h2 id="testimonials-title" className="lp-section-h2">
          Loved by Researchers Worldwide
        </h2>
        <div className="lp-testimonials-grid">
          {[
            {
              quote:
                "ScholarTrend has transformed how I discover and track research trends. It saves me hours every week.",
              name: "Dr. Sarah Chen",
              org: "University of Stanford",
              role: "Professor of Computer Science",
              img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
              rating: 5,
            },
            {
              quote:
                "The trend analysis and AI insights are incredibly accurate. Essential tool for any researcher.",
              name: "Prof. Michael Rodriguez",
              org: "MIT",
              role: "Research Director",
              img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80",
              rating: 5,
            },
            {
              quote:
                "Finding emerging topics has never been easier. ScholarTrend keeps me ahead of the curve.",
              name: "Dr. Emily Johnson",
              org: "Harvard University",
              role: "Associate Professor",
              img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
              rating: 5,
            },
          ].map((t) => (
            <article key={t.name} className="lp-testimonial-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="32"
                  height="32"
                  style={{ color: "#6366f1", opacity: 0.2 }}
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[...Array(t.rating)].map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      fill="#fbbf24"
                      width="16"
                      height="16"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p
                className="lp-testimonial-text"
                style={{
                  fontSize: "15px",
                  lineHeight: "1.7",
                  marginBottom: "20px",
                  color: "#475569",
                }}
              >
                {t.quote}
              </p>
              <div
                className="lp-testimonial-author"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <img
                  className="lp-testimonial-avatar"
                  src={t.img}
                  alt={t.name}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #e0e7ff",
                  }}
                />
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "2px",
                    }}
                  >
                    <div
                      className="lp-testimonial-name"
                      style={{ fontWeight: "600", color: "#1e293b" }}
                    >
                      {t.name}
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="#3b82f6"
                      width="16"
                      height="16"
                      title="Verified"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div
                    className="lp-testimonial-org"
                    style={{ fontSize: "13px", color: "#64748b" }}
                  >
                    {t.role}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      fontWeight: "500",
                    }}
                  >
                    {t.org}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="lp-testimonials-dots" aria-hidden="true">
          <span className="active"></span>
          <span></span>
          <span></span>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="pricing"
        className="lp-cta-section"
        aria-label="Call to action"
      >
        <div className="lp-cta-rocket-container" aria-hidden="true">
          <div className="lp-cta-rocket-circle">
            <svg
              viewBox="0 0 24 24"
              className="lp-cta-rocket-svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M12 2C7 2 4 7 4 12c0 2 1.5 4 1.5 4s1.5.5 3 0c3-1 4.5-4 4.5-4S12 11 12 9s-2-2-3-1M12 2c5 0 8 5 8 10 0 2-1.5 4-1.5 4s-1.5.5-3 0c-3-1-4.5-4-4.5-4s1-1 1-3 2-2 3-1" />
              <path d="M12 9c3 3 6 3 9 1.5M12 9c-3 3-6 3-9 1.5M19 19c-1.5 1.5-3.5 2.5-3.5 2.5s1-2.25 2.5-3.5" />
            </svg>
          </div>
          {/* Sparks */}
          <div className="lp-cta-spark spark-1"></div>
          <div className="lp-cta-spark spark-2"></div>
          <div className="lp-cta-spark spark-3"></div>
        </div>
        <div className="lp-cta-text">
          <h2 className="lp-cta-h2">
            Ready to Discover the Next Big
            <br />
            Research Trend?
          </h2>
          <p className="lp-cta-desc">
            Join thousands of researchers who are already using ScholarTrend to
            accelerate their research.
          </p>
        </div>
        <div className="lp-cta-actions">
          <a
            className="lp-cta-btn"
            href="/register"
            onClick={navTo("/register")}
          >
            Start Researching Free →
          </a>
          <span className="lp-cta-note">no credit card required</span>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-col brand-col">
            <Brand small />
            <p className="lp-footer-tagline">
              The most advanced research intelligence platform for modern
              researchers.
            </p>
            <div className="lp-footer-socials">
              <a href="/" className="lp-social-icon" aria-label="X (Twitter)">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="/" className="lp-social-icon" aria-label="LinkedIn">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="/" className="lp-social-icon" aria-label="Facebook">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="/" className="lp-social-icon" aria-label="GitHub">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a href="/" className="lp-social-icon" aria-label="Instagram">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Product</div>
            <a href="/">Features</a>
            <a href="/">Trends</a>
            <a href="/">Pricing</a>
            <a href="/">API</a>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Resources</div>
            <a href="/">Documentation</a>
            <a href="/">Blog</a>
            <a href="/">Guides</a>
            <a href="/">Support</a>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Company</div>
            <a href="/">About Us</a>
            <a href="/">Careers</a>
            <a href="/">Contact</a>
            <a href="/">Privacy Policy</a>
          </div>
          <div className="lp-footer-col newsletter-col">
            <div className="lp-footer-col-title">Newsletter</div>
            <p className="lp-newsletter-desc">
              Stay updated with the latest research trends and platform updates.
            </p>
            <div className="lp-newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="lp-newsletter-input"
              />
              <button className="lp-newsletter-btn" aria-label="Subscribe">
                →
              </button>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 ScholarTrend. All rights reserved.</span>
          <nav className="lp-footer-bottom-links" aria-label="Legal links">
            <a href="/">Terms of Service</a>
            <a href="/">Privacy Policy</a>
            <a href="/">Contact</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function RegisterPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState(
    STUDENT_REGISTRATION_ROLE,
  );
  const [authFeedback, setAuthFeedback] = React.useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [selectedAcademicProvider, setSelectedAcademicProvider] =
    React.useState("");

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      setAuthFeedback({
        type: "error",
        text: "Please enter full name, email, and password.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setAuthFeedback({
        type: "error",
        text: "Confirm password does not match.",
      });
      return;
    }

    setIsRegistering(true);
    setAuthFeedback({ type: "success", text: "Creating account..." });

    try {
      const payload = await authServerFetch("/api/auth/register", {
        method: "POST",
        body: {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role: normalizeRoleForApi(selectedRole),
        },
      });

      const registeredEmail = String(payload.user?.email || email)
        .trim()
        .toLowerCase();
      const registeredRole = normalizeRoleForUi(
        payload.user?.role || selectedRole,
      );
      await clearAuthCookie();
      clearAuth();
      window.localStorage.setItem("scholartrend.login.email", registeredEmail);
      window.sessionStorage.setItem(
        REGISTERED_LOGIN_HINT_KEY,
        JSON.stringify({
          email: registeredEmail,
          password,
          role: registeredRole,
          fullName: fullName.trim(),
        }),
      );
      window.sessionStorage.setItem(
        "scholartrend.justRegisteredEmail",
        registeredEmail,
      );
      setAuthFeedback({
        type: "success",
        text: "Account created. Please sign in with your new account.",
      });

      window.setTimeout(() => goToRoute("/login?registered=1"), 450);
    } catch (error) {
      setAuthFeedback(getFriendlyRegisterError(error));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    setAuthFeedback({
      type: "success",
      text: "Opening Google authentication...",
    });

    try {
      await beginGoogleOAuth(selectedRole);
    } catch (error) {
      setIsGoogleLoading(false);
      setAuthFeedback({
        type: "error",
        text: error.message,
      });
    }
  };

  const handleAcademicProviderRegister = async (provider) => {
    setSelectedAcademicProvider(provider);
    setAuthFeedback({
      type: "success",
      text: `Opening ${provider} authentication...`,
    });
    try {
      await beginAcademicOAuth(provider, selectedRole);
    } catch (error) {
      setSelectedAcademicProvider("");
      setAuthFeedback({ type: "error", text: error.message });
    }
  };

  return (
    <main className="auth-shell" aria-label="Register account">
      <section className="auth-card">
        <div className="auth-form-panel">
          <Brand />
          <div className="auth-heading">
            <h1>Create an Account</h1>
            <p>Join the academic intelligence network.</p>
          </div>

          <form className="register-form" onSubmit={handleRegister}>
            <label className="field">
              <span>Full Name</span>
              <span className="input-with-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 11.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z" />
                  <path d="M5 20c.6-3.7 3.1-5.8 7-5.8s6.4 2.1 7 5.8" />
                  <path d="M17.7 5.5h2.8M19.1 4.1v2.8" />
                </svg>
                <input
                  type="text"
                  placeholder="Dr. Jane Doe"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </span>
            </label>
            <label className="field">
              <span>Email Address</span>
              <span className="input-with-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6.5h16v11H4z" />
                  <path d="m5.2 7.8 6.8 5 6.8-5" />
                  <path d="M16.8 4.1v2.3M15.7 5.2h2.3" />
                </svg>
                <input
                  type="email"
                  placeholder="jane.doe@university.edu"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>
            <fieldset className="register-role-field">
              <legend>Register as</legend>
              <div className="register-role-options">
                {["Student", "Lecturer", "Researcher"].map((role) => (
                  <label
                    className={selectedRole === role ? "is-selected" : ""}
                    key={role}
                  >
                    <input
                      type="radio"
                      name="registration-role"
                      value={role}
                      checked={selectedRole === role}
                      onChange={() => setSelectedRole(role)}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="field">
              <span>Password</span>
              <span className="input-with-icon password-input">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.7 18.2 7v4.4c0 3.5-2.4 6.2-6.2 7.7-3.8-1.5-6.2-4.2-6.2-7.7V7L12 3.7Z" />
                  <path d="M9.2 11.3V10a2.8 2.8 0 0 1 5.6 0v1.3" />
                  <rect x="8.6" y="11.3" width="6.8" height="5" rx="1.2" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.6 17.6L20 20M9.8 9.8a3 3 0 114.2 4.2M2 12s3-5.5 10-5.5a9.8 9.8 0 014.2.9M6.8 17.2A10.4 10.4 0 012 12M12 17.5c2.8 0 5.4-1.2 7-3.3M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </span>
            </label>
            <div className="password-meter" aria-label="Weak password">
              <strong>Weak password</strong>
              <span className="meter-bars" aria-hidden="true">
                <i className="active"></i>
                <i></i>
                <i></i>
                <i></i>
              </span>
            </div>
            <label className="field">
              <span>Confirm Password</span>
              <span className="input-with-icon password-input">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.7 18.2 7v4.4c0 3.5-2.4 6.2-6.2 7.7-3.8-1.5-6.2-4.2-6.2-7.7V7L12 3.7Z" />
                  <path d="M9.4 13.1 11.2 15l3.8-4.2" />
                </svg>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.6 17.6L20 20M9.8 9.8a3 3 0 114.2 4.2M2 12s3-5.5 10-5.5a9.8 9.8 0 014.2.9M6.8 17.2A10.4 10.4 0 012 12M12 17.5c2.8 0 5.4-1.2 7-3.3M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </span>
            </label>
            <label className="terms-check">
              <input type="checkbox" />
              <span>
                I agree to the <a href="/">Terms &amp; Conditions</a> and{" "}
                <a href="/">Privacy Policy</a>.
              </span>
            </label>
            <button
              className="auth-submit"
              type="submit"
              disabled={isRegistering}
            >
              {isRegistering ? "Creating Account..." : "Register Account"}
            </button>
            <div className="auth-divider">
              <span>OR</span>
            </div>
            <div className="login-providers">
              <button
                className="google-login-button google-auth-button"
                type="button"
                onClick={handleGoogleRegister}
                disabled={isGoogleLoading}
                title="Continue with Google OAuth2"
              >
                <svg
                  className="google-mark"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M21.6 12.23c0-.75-.07-1.47-.19-2.16H12v4.09h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.46Z" />
                  <path d="M12 22c2.7 0 4.96-.89 6.62-2.41l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H3.07v2.59A9.99 9.99 0 0 0 12 22Z" />
                  <path d="M6.41 13.92A6.01 6.01 0 0 1 6.09 12c0-.66.12-1.31.32-1.92V7.49H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.07 4.51l3.34-2.59Z" />
                  <path d="M12 5.97c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.98 14.7 2 12 2a9.99 9.99 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.97 12 5.97Z" />
                </svg>
                {isGoogleLoading
                  ? "Connecting Google..."
                  : "Continue with Google"}
              </button>
              <button
                className="institution-login-button"
                type="button"
                onClick={() =>
                  handleAcademicProviderRegister("Institution SSO")
                }
                title="Continue with Institution SSO"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.5 9.2 12 4.5l8.5 4.7" />
                  <path d="M5.5 10.6h13" />
                  <path d="M7.2 10.6v6.8M12 10.6v6.8M16.8 10.6v6.8" />
                  <path d="M4.6 19.5h14.8" />
                  <path d="M9.5 7.8h5" />
                </svg>
                {selectedAcademicProvider === "Institution SSO"
                  ? "Institution SSO selected"
                  : "Institutional ID"}
              </button>
              <button
                className="orcid-login-button"
                type="button"
                onClick={() => handleAcademicProviderRegister("ORCID")}
                title="Continue with ORCID"
              >
                <span className="orcid-mark" aria-hidden="true">
                  iD
                </span>
                {selectedAcademicProvider === "ORCID"
                  ? "ORCID selected"
                  : "ORCID"}
              </button>
            </div>
            {authFeedback && (
              <div
                className={`login-feedback register-feedback ${authFeedback.type}`}
                role={authFeedback.type === "error" ? "alert" : "status"}
              >
                {authFeedback.title ? (
                  <strong>{authFeedback.title}</strong>
                ) : null}
                <span>{authFeedback.text}</span>
                {authFeedback.actionRoute ? (
                  <a
                    href={authFeedback.actionRoute}
                    onClick={navTo(authFeedback.actionRoute)}
                  >
                    {authFeedback.actionText || "Continue"}
                  </a>
                ) : null}
              </div>
            )}
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <a href="/login" onClick={navTo("/login")}>
              Login
            </a>
          </p>
        </div>

        <aside
          className="auth-visual-panel"
          aria-label="ScholarTrend discovery preview"
        >
          <div className="orbit-visual" aria-hidden="true">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="orbit orbit-three"></div>
            <div className="research-plane"></div>
            <div className="spark-field">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div
            className="visual-copy"
            style={{
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              className="accent-line"
              aria-hidden="true"
              style={{
                background: "linear-gradient(180deg, #06b6d4 0%, #0284c7 100%)",
                boxShadow:
                  "0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)",
                animation: "accentPulse 3s ease-in-out infinite",
              }}
            ></div>
            <div
              style={{
                animation: "fadeInUp 1s ease-out",
              }}
            >
              <h2
                style={{
                  fontSize: "42px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  marginBottom: "20px",
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                  animation: "slideInLeft 0.8s ease-out",
                }}
              >
                Accelerate
                <br />
                Discovery
              </h2>
              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.6,
                  color: "#94a3b8",
                  maxWidth: "480px",
                  animation: "fadeIn 1.2s ease-out 0.3s both",
                }}
              >
                Join researchers and institutions using analytical intelligence
                to uncover publication trends and drive scientific progress.
              </p>
            </div>
          </div>
          <div
            className="auth-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "40px",
              animation: "fadeInUp 1s ease-out 0.5s both",
            }}
          >
            <div
              style={{
                padding: "24px",
                background: "rgba(6, 182, 212, 0.05)",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(6, 182, 212, 0.1)";
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.4)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(6, 182, 212, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                Publications Tracked
              </span>
              <strong
                style={{
                  display: "block",
                  fontSize: "36px",
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                }}
              >
                14.2M+
              </strong>
            </div>
            <div
              style={{
                padding: "24px",
                background: "rgba(6, 182, 212, 0.05)",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(6, 182, 212, 0.1)";
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.4)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(6, 182, 212, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                Global Institutions
              </span>
              <strong
                style={{
                  display: "block",
                  fontSize: "36px",
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                }}
              >
                8,450
              </strong>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function LoginPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState(() => {
    const registrationHint = getRegisteredLoginHint();
    return (
      registrationHint?.email ||
      window.localStorage.getItem("scholartrend.login.email") ||
      ""
    );
  });
  const [password, setPassword] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("Student");
  const [loginOptions, setLoginOptions] = React.useState({
    isAdministrator: false,
    allowedRoles: ["Researcher", "Lecturer", "Student"],
  });
  const [rememberMe, setRememberMe] = React.useState(() => {
    return (
      window.localStorage.getItem("scholartrend.login.remember") === "true"
    );
  });
  const [feedback, setFeedback] = React.useState(null);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const loginRequestInProgressRef = React.useRef(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [selectedAcademicProvider, setSelectedAcademicProvider] =
    React.useState("");
  const [isSendingResetCode, setIsSendingResetCode] = React.useState(false);
  const [isResetMode, setIsResetMode] = React.useState(false);
  const [resetToken, setResetToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  const [registrationHint, setRegistrationHint] = React.useState(() =>
    getRegisteredLoginHint(),
  );

  const roleRoutes = {
    Researcher: "/researcher-dashboard",
    Lecturer: "/lecturer-dashboard",
    Student: "/student-dashboard",
    Administrator: "/admin-dashboard",
  };

  React.useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setLoginOptions({
        isAdministrator: false,
        allowedRoles: ["Researcher", "Lecturer", "Student"],
      });
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const options = await authServerFetch(
          `/api/auth/login-options?email=${encodeURIComponent(normalizedEmail)}`,
          { signal: controller.signal },
        );
        const allowedRoles = Array.isArray(options.allowedRoles)
          ? options.allowedRoles
          : ["Researcher", "Lecturer", "Student"];
        setLoginOptions({
          isAdministrator: Boolean(options.isAdministrator),
          allowedRoles,
        });
        if (
          !options.isAdministrator &&
          options.assignedRole &&
          allowedRoles.includes(options.assignedRole)
        ) {
          setSelectedRole(options.assignedRole);
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          setLoginOptions({
            isAdministrator: false,
            allowedRoles: ["Researcher", "Lecturer", "Student"],
          });
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [email]);

  const goToWorkspace = (route) => {
    window.history.pushState({}, "", route);
    window.dispatchEvent(new Event("scholartrend:navigate"));
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freshRegistrationHint = getRegisteredLoginHint();
    const registeredEmail =
      window.sessionStorage.getItem("scholartrend.justRegisteredEmail") || "";
    if (
      params.get("registered") === "1" ||
      registeredEmail ||
      freshRegistrationHint?.email
    ) {
      const loginEmail =
        freshRegistrationHint?.email ||
        registeredEmail ||
        window.localStorage.getItem("scholartrend.login.email") ||
        "";
      if (loginEmail) {
        setEmail(loginEmail);
      }
      setPassword("");
      setSelectedRole(freshRegistrationHint?.role || STUDENT_REGISTRATION_ROLE);
      setRegistrationHint(freshRegistrationHint);
      setFeedback({
        type: "success",
        text: freshRegistrationHint?.email
          ? "Account created. Click the email field or choose the suggested email to fill the password, then Sign In."
          : "Account created. Please sign in with the email and password you just registered.",
      });
      window.sessionStorage.removeItem("scholartrend.justRegisteredEmail");
      window.history.replaceState({}, "", "/login");
      return;
    }

    const authResult = params.get("auth");

    if (!authResult) return;

    window.history.replaceState({}, "", "/login");

    if (authResult.endsWith("-error")) {
      const providerName = authResult.startsWith("orcid")
        ? "ORCID"
        : authResult.startsWith("institution")
          ? "Institution SSO"
          : "Google";
      setFeedback({
        type: "error",
        text:
          params.get("message") ||
          `${providerName} authentication could not be completed.`,
      });
      return;
    }

    const providerName = authResult.startsWith("orcid")
      ? "ORCID"
      : authResult.startsWith("institution")
        ? "Institution SSO"
        : "Google";

    const finishExternalLogin = async () => {
      setIsGoogleLoading(true);
      setFeedback({
        type: "success",
        text: `${providerName} profile verified. Preparing your workspace...`,
      });

      try {
        const response = await fetch(`${GOOGLE_AUTH_BASE_URL}/api/auth/me`, {
          credentials: "include",
        });
        const contentType = response.headers.get("content-type") || "";
        const payload = contentType.includes("application/json")
          ? await response.json()
          : {};

        if (!response.ok || !payload.authenticated) {
          throw new Error(
            `${providerName} session was not found. Please sign in again.`,
          );
        }

        persistAuth(payload);
        setFeedback({
          type: "success",
          text: `${payload.user.role} ${providerName} profile verified. Loading your workspace...`,
        });

        window.setTimeout(
          () =>
            goToWorkspace(
              payload.user.route || roleDashboardRoutes[payload.user.role],
            ),
          550,
        );
      } catch (error) {
        setIsGoogleLoading(false);
        setFeedback({
          type: "error",
          text: error.message,
        });
      }
    };

    finishExternalLogin();
  }, []);

  const rememberLoginEmail = (normalizedEmail) => {
    if (rememberMe) {
      window.localStorage.setItem("scholartrend.login.email", normalizedEmail);
      window.localStorage.setItem("scholartrend.login.remember", "true");
    } else {
      window.localStorage.removeItem("scholartrend.login.email");
      window.localStorage.removeItem("scholartrend.login.remember");
    }
  };

  const clearRegistrationHint = () => {
    window.sessionStorage.removeItem(REGISTERED_LOGIN_HINT_KEY);
    window.sessionStorage.removeItem("scholartrend.justRegisteredEmail");
    setRegistrationHint(null);
  };

  const fillRegisteredAccountHint = (selectedHint = registrationHint) => {
    const hint = selectedHint || getRegisteredLoginHint();
    if (!hint?.email) return;

    setRegistrationHint(hint);
    setEmail(hint.email);
    setPassword(hint.password);
    setSelectedRole(hint.role || STUDENT_REGISTRATION_ROLE);
    setFeedback({
      type: "success",
      text: "New account filled. Click Sign In to enter your dashboard.",
    });
  };

  const handleLoginEmailChange = (event) => {
    const nextEmail = event.target.value;
    setEmail(nextEmail);

    const hint = registrationHint || getRegisteredLoginHint();
    if (hint?.email && nextEmail.trim().toLowerCase() === hint.email) {
      fillRegisteredAccountHint(hint);
    }
  };

  const handleLoginEmailPaste = (event) => {
    const pastedEmail = event.clipboardData.getData("text").trim();
    if (!pastedEmail) return;
    event.preventDefault();
    setEmail(pastedEmail);
    setFeedback(null);
  };

  const handleLoginEmailFocus = () => {
    const hint = registrationHint || getRegisteredLoginHint();
    if (hint?.email && email.trim().toLowerCase() === hint.email && !password) {
      fillRegisteredAccountHint(hint);
    }
  };

  const finishLogin = (role, route, message) => {
    setFeedback({
      type: "success",
      text: message,
    });
    window.setTimeout(
      () =>
        goToWorkspace(
          route || roleDashboardRoutes[role] || "/researcher-dashboard",
        ),
      550,
    );
  };

  const loginWithCredentials = async ({
    loginEmail,
    loginPassword,
    requestedRole,
  }) => {
    if (loginRequestInProgressRef.current) return;

    const normalizedEmail = loginEmail.trim().toLowerCase();

    if (!normalizedEmail || !loginPassword) {
      setFeedback({
        type: "error",
        text: "Please enter both your academic email and password.",
      });
      return;
    }

    loginRequestInProgressRef.current = true;
    rememberLoginEmail(normalizedEmail);
    setIsLoggingIn(true);
    setFeedback({ type: "success", text: "Checking test account..." });

    try {
      const payload = await authServerFetch("/api/auth/login", {
        method: "POST",
        body: {
          email: normalizedEmail,
          password: loginPassword,
          requestedRole: requestedRole || null, // Allow null for auto-detect
        },
      });
      persistAuth(payload);
      const role = normalizeRoleForUi(payload.user?.role);
      setSelectedRole(role);
      clearRegistrationHint();

      // Auto-redirect based on user's actual role from backend
      finishLogin(
        role,
        roleDashboardRoutes[role],
        `${role} account verified. Loading your workspace...`,
      );
    } catch (error) {
      setIsLoggingIn(false);
      setFeedback({ type: "error", text: error.message });
    } finally {
      loginRequestInProgressRef.current = false;
    }
  };

  const handleRoleSelect = (nextRole) => {
    setSelectedRole(nextRole);
    setFeedback(null);
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    // Check if any role is selected (not needed for admin, but required for others)
    const normalizedEmail = email.trim().toLowerCase();

    // Allow login without role selection - backend will validate
    await loginWithCredentials({
      loginEmail: email,
      loginPassword: password,
      requestedRole: selectedRole || "", // Empty string if no role selected
    });
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFeedback({
        type: "error",
        text: "Enter your academic email first so ScholarTrend can prepare a reset link.",
      });
      return;
    }

    setIsSendingResetCode(true);

    try {
      const payload = await authServerFetch("/api/auth/forgot-password", {
        method: "POST",
        body: { email: normalizedEmail },
      });
      setIsResetMode(true);
      setResetToken(payload.resetToken || "");
      setNewPassword("");
      setConfirmNewPassword("");
      setFeedback({
        type: "success",
        text: payload.resetToken
          ? `Reset code generated: ${payload.resetToken}. Enter a new password below.`
          : payload.message ||
            `Reset instructions were prepared for ${normalizedEmail}.`,
      });
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
    } finally {
      setIsSendingResetCode(false);
    }
  };

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = resetToken.trim();

    if (!normalizedEmail || !normalizedToken || !newPassword) {
      setFeedback({
        type: "error",
        text: "Enter your email, reset code, and new password.",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFeedback({
        type: "error",
        text: "Confirm password does not match.",
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      const payload = await authServerFetch("/api/auth/reset-password", {
        method: "POST",
        body: {
          email: normalizedEmail,
          token: normalizedToken,
          newPassword,
        },
      });
      setIsResetMode(false);
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPassword("");
      setFeedback({
        type: "success",
        text:
          payload.message ||
          "Password has been reset. Please sign in with your new password.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setFeedback({
      type: "success",
      text: "Opening Google authentication...",
    });

    try {
      await beginGoogleOAuth(selectedRole);
    } catch (error) {
      setIsGoogleLoading(false);
      setFeedback({
        type: "error",
        text: error.message,
      });
    }
  };

  const handleAcademicProviderLogin = async (provider) => {
    setSelectedAcademicProvider(provider);
    setFeedback({
      type: "success",
      text: `Opening ${provider} authentication...`,
    });
    try {
      await beginAcademicOAuth(provider, selectedRole);
    } catch (error) {
      setSelectedAcademicProvider("");
      setFeedback({ type: "error", text: error.message });
    }
  };

  return (
    <main className="login-shell" aria-label="Login">
      <section className="login-wrap">
        <div className="login-logo">
          <Brand />
          <span>Analytical Intelligence</span>
        </div>

        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-card-bar"></div>
          <h1>{t("login.welcome")}</h1>
          <p>{t("login.subtitle")}</p>

          <label className="field login-field">
            <span>{t("login.email")}</span>
            <span className="input-with-icon">
              <span className="icon-container">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <defs>
                    <linearGradient
                      id="emailGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="1"
                      />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0.7"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M4 6.5h16v11H4z"
                    fill="none"
                    stroke="url(#emailGrad)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="m5.2 7.7 6.8 5 6.8-5"
                    fill="none"
                    stroke="url(#emailGrad)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M17.5 4.2v2.2M16.4 5.3h2.2"
                    fill="none"
                    stroke="url(#emailGrad)"
                    strokeWidth="1.4"
                  />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={handleLoginEmailChange}
                onPaste={handleLoginEmailPaste}
                onFocus={handleLoginEmailFocus}
                autoComplete="email"
                list={
                  registrationHint?.email
                    ? "registered-login-email-hints"
                    : undefined
                }
              />
              {registrationHint?.email ? (
                <datalist id="registered-login-email-hints">
                  <option
                    value={registrationHint.email}
                    label="New account from registration"
                  />
                </datalist>
              ) : null}
            </span>
          </label>

          {loginOptions.isAdministrator ? (
            <div className="login-admin-detected" role="status">
              Administrator account detected. Sign in to open the Admin Dashboard.
            </div>
          ) : (
          <div className="field login-field role-field">
            <div
              className="role-picker"
              role="radiogroup"
              aria-label={t("login.role")}
            >
              {loginOptions.allowedRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`role-choice ${
                    selectedRole === role ? "active" : ""
                  }`}
                  role="radio"
                  aria-checked={selectedRole === role}
                  onClick={() => handleRoleSelect(role)}
                  disabled={isLoggingIn}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {role === "Student" ? (
                      <>
                        <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
                        <path d="M7 12v3.2c0 1.8 2 3 5 3s5-1.2 5-3V12" />
                      </>
                    ) : role === "Lecturer" ? (
                      <>
                        <path d="M4 5.5h16v11H4z" />
                        <path d="M8 20h8" />
                        <path d="M9 10h6M9 13h4" />
                      </>
                    ) : (
                      <>
                        <path d="M5 19V5l7 3 7-3v14l-7-3-7 3Z" />
                        <path d="M12 8v8" />
                      </>
                    )}
                  </svg>
                  <span>{t(`roles.${role.toLowerCase()}`)}</span>
                </button>
              ))}
            </div>
          </div>
          )}

          <label className="field login-field">
            <span>{t("login.password")}</span>
            <span className="input-with-icon password-input">
              <span className="icon-container">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <defs>
                    <linearGradient
                      id="lockGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="1"
                      />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0.7"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 3.6 18.5 7v4.6c0 3.6-2.5 6.4-6.5 8-4-1.6-6.5-4.4-6.5-8V7L12 3.6Z"
                    fill="none"
                    stroke="url(#lockGrad)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M9.2 11.2V10a2.8 2.8 0 0 1 5.6 0v1.2"
                    fill="none"
                    stroke="url(#lockGrad)"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="8.6"
                    y="11.2"
                    width="6.8"
                    height="5"
                    rx="1.2"
                    fill="none"
                    stroke="url(#lockGrad)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="12"
                    cy="13.8"
                    r="1"
                    fill="currentColor"
                    opacity="0.8"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <defs>
                      <linearGradient
                        id="eyeHideGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="currentColor"
                          stopOpacity="1"
                        />
                        <stop
                          offset="100%"
                          stopColor="currentColor"
                          stopOpacity="0.6"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M3 3l18 18M5 5c-1.5 1.5-3 3.5-3 7 0 6 4 9 10 9 2.5 0 4.5-1 6-2.5M19 5c1.5 1.5 3 3.5 3 7 0 6-4 9-10 9-2.5 0-4.5-1-6-2.5"
                      fill="none"
                      stroke="url(#eyeHideGrad)"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                      fill="none"
                      stroke="url(#eyeHideGrad)"
                      strokeWidth="1.5"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <defs>
                      <linearGradient
                        id="eyeShowGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="currentColor"
                          stopOpacity="1"
                        />
                        <stop
                          offset="100%"
                          stopColor="currentColor"
                          stopOpacity="0.6"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12 5C6.5 5 2.5 8.5 2.5 12c0 3.5 4 7 9.5 7s9.5-3.5 9.5-7-4-7-9.5-7Z"
                      fill="none"
                      stroke="url(#eyeShowGrad)"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="url(#eyeShowGrad)"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1.5"
                      fill="currentColor"
                      opacity="0.8"
                    />
                  </svg>
                )}
              </button>
            </span>
          </label>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />{" "}
              {t("login.rememberMe")}
            </label>
            <a href="/" onClick={handleForgotPassword}>
              {isSendingResetCode
                ? "Sending reset code..."
                : t("login.forgotPassword")}
            </a>
          </div>

          {feedback && (
            <p
              className={`login-feedback ${feedback.type}`}
              role={feedback.type === "error" ? "alert" : "status"}
            >
              {feedback.text}
            </p>
          )}

          {isResetMode ? (
            <div className="password-reset-panel" aria-label="Reset password">
              <label className="field login-field">
                <span>Reset code</span>
                <span className="input-with-icon">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={resetToken}
                    onChange={(event) => setResetToken(event.target.value)}
                    placeholder="6-digit code"
                  />
                </span>
              </label>
              <label className="field login-field">
                <span>New password</span>
                <span className="input-with-icon">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                  />
                </span>
              </label>
              <label className="field login-field">
                <span>Confirm new password</span>
                <span className="input-with-icon">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(event) =>
                      setConfirmNewPassword(event.target.value)
                    }
                    placeholder="Confirm new password"
                  />
                </span>
              </label>
              <button
                className="password-reset-submit"
                type="button"
                disabled={isResettingPassword}
                onClick={handleResetPassword}
              >
                {isResettingPassword ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          ) : null}

          <button className="login-submit" type="submit" disabled={isLoggingIn}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.5 17.5 9 13l3.2 2.6 6.3-7.1" />
              <path d="M15.5 8.5h3v3" />
              <path d="M5 20h14" />
              <path d="M7 15v3M12 12v6M17 10v8" />
            </svg>
            <span>
              {isLoggingIn ? t("login.signingIn") : t("login.signIn")}
            </span>
          </button>

          <div className="divider">
            <span>{t("login.or")}</span>
          </div>

          <div className="login-providers">
            <button
              className="google-login-button"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              title="Continue with Google OAuth2"
            >
              <svg
                className="google-mark"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M21.6 12.23c0-.75-.07-1.47-.19-2.16H12v4.09h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.46Z" />
                <path d="M12 22c2.7 0 4.96-.89 6.62-2.41l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H3.07v2.59A9.99 9.99 0 0 0 12 22Z" />
                <path d="M6.41 13.92A6.01 6.01 0 0 1 6.09 12c0-.66.12-1.31.32-1.92V7.49H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.07 4.51l3.34-2.59Z" />
                <path d="M12 5.97c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.98 14.7 2 12 2a9.99 9.99 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.97 12 5.97Z" />
              </svg>
              {isGoogleLoading
                ? "Connecting Google..."
                : t("login.continueWithGoogle")}
            </button>
            <button
              className="orcid-login-button"
              type="button"
              onClick={() => handleAcademicProviderLogin("ORCID")}
              title="Continue with ORCID"
            >
              <span className="orcid-mark" aria-hidden="true">
                iD
              </span>
              {selectedAcademicProvider === "ORCID"
                ? "ORCID selected"
                : t("login.continueWithORCID")}
            </button>
            <button
              className="institution-login-button"
              type="button"
              onClick={() => handleAcademicProviderLogin("Institution SSO")}
              title="Continue with Institution SSO"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.5 9.2 12 4.5l8.5 4.7" />
                <path d="M5.5 10.6h13" />
                <path d="M7.2 10.6v6.8M12 10.6v6.8M16.8 10.6v6.8" />
                <path d="M4.6 19.5h14.8" />
                <path d="M9.5 7.8h5" />
              </svg>
              {selectedAcademicProvider === "Institution SSO"
                ? "Institution SSO selected"
                : t("login.continueWithSSO")}
            </button>
          </div>
        </form>

        <p className="login-switch">
          {t("login.noAccount")}{" "}
          <a href="/register" onClick={navTo("/register")}>
            {t("login.signUp")}
          </a>
        </p>

        <div className="login-help">
          <p>{t("login.needHelp")}</p>
          <div className="login-help-links">
            <a href="/help/login" onClick={navTo("/help/login")}>
              {t("login.howToLogin")}
            </a>
            <a href="/help/access" onClick={navTo("/help/access")}>
              {t("login.cantAccess")}
            </a>
            <a href="/contact-support" onClick={navTo("/contact-support")}>
              {t("login.contactSupport")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

const sidebarItems = [
  {
    label: "Dashboard",
    route: "/student-dashboard",
    icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z",
  },
  {
    label: "Search",
    route: "/student-search",
    icon: "M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20",
  },
  {
    label: "Bookmarks",
    route: "/student-bookmarks",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z",
  },
  {
    label: "Notifications",
    route: "/student-notifications",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
  },
];

const statCards = [
  {
    label: "My Bookmarks",
    value: "42",
    note: "+3 this week",
    tone: "green",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15ZM9 8h6M9 11h4",
  },
  {
    label: "Followed Keywords",
    value: "12",
    note: "Active",
    tone: "gray",
    icon: "M5 7h14M8 12h8M10 17h4M7 5.5v3M17 5.5v3M10 10.5v3M14 10.5v3",
  },
  {
    label: "Unread Alerts",
    value: "5",
    note: "Needs review",
    tone: "gray",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2",
    red: true,
  },
  {
    label: "Recently Viewed",
    value: "18",
    note: "Last 7 days",
    tone: "gray",
    icon: "M12 7v5l3 2M20 12a8 8 0 1 1-2.35-5.65M12 3v2M19 12h2",
  },
];

const publications = [
  {
    tags: ["Computer Science", "Peer Reviewed"],
    title:
      "Neural Network Architectures for Predictive Data Synthesis in High-Noise Environments",
    excerpt:
      "This paper explores novel approaches to structural adjustments within deep learning models when exposed to datasets characterized by extreme signal noise.",
    meta: "Oct 2023 - 128 Citations - IF: 4.2",
  },
  {
    tags: ["Environmental Science"],
    title:
      "Longitudinal Analysis of Urban Heat Island Mitigation Strategies in Coastal Metropolises",
    excerpt:
      "A comprehensive ten-year study evaluating the efficacy of green roof implementations and reflective surface treatments across five major coastal cities.",
    meta: "Sep 2023 - 54 Citations - IF: 3.8",
  },
];

const activities = [
  [
    "Quantum Cryptography Protocols",
    "Viewed 2 hours ago",
    "M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12ZM12 9v6M9 12h6",
  ],
  [
    "Dataset: Global Emiss...",
    "Downloaded yesterday",
    "M12 4v10M8 10l4 4 4-4M5 19h14M7 6h3M14 6h3",
  ],
  [
    "Sociological Impact of AI",
    "Bookmarked 3 days ago",
    "M6 4.5h12v15L12 16l-6 3.5v-15ZM9 8h6M9 11h4",
  ],
  [
    "Advanced Polymer Synthesis",
    "Viewed 1 week ago",
    "M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12ZM12 9v6M9 12h6",
  ],
];

const searchResults = [
  {
    title: "Attention Is All You Need",
    authors:
      "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin",
    abstract:
      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.",
    year: "2017",
    source: "NeurIPS",
    citations: "99,842",
    saved: false,
  },
  {
    title: "Deep Residual Learning for Image Recognition",
    authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
    abstract:
      "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.",
    year: "2016",
    source: "CVPR",
    citations: "152,109",
    saved: true,
  },
];

const bookmarkTabs = ["Publications", "Keywords", "Journals", "Topics"];

const bookmarkedPapers = [
  {
    title:
      "Attention Is All You Need: A Retrospective Analysis of Transformer Architectures",
    excerpt:
      "This paper reviews the impact of the original Transformer architecture introduced in 2017, analyzing its adaptations across various domains including natural language processing, computer vision, and computational biology over the last five years.",
    date: "Oct 2023",
    citations: "14,203",
    impact: "High",
  },
  {
    title: "Quantum Supremacy using a Programmable Superconducting Processor",
    excerpt:
      'We report the demonstration of quantum supremacy. We developed a new 54-qubit processor, named "Sycamore", that is comprised of fast, high-fidelity quantum logic gates, in order to perform the benchmark testing.',
    date: "Oct 2019",
    citations: "451",
    impact: "High",
  },
];

const bookmarkedKeywords = [
  { name: "Deep Learning", count: "128 papers", trend: "+12% this week" },
  { name: "Quantum Computing", count: "45 papers", trend: "+5% this week" },
  { name: "Computational Biology", count: "89 papers", trend: "Stable" },
];

const bookmarkedJournals = [
  {
    name: "Nature Computational Science",
    impactFactor: "12.3",
    status: "Active alerts",
  },
  {
    name: "Journal of Machine Learning Research",
    impactFactor: "8.5",
    status: "Weekly digest",
  },
  { name: "Bioinformatics", impactFactor: "6.9", status: "Monthly digest" },
];

const bookmarkedTopics = [
  {
    name: "Manifold Learning",
    tracked: "32 papers",
    activity: "High activity",
  },
  {
    name: "Predictive Data Synthesis",
    tracked: "14 papers",
    activity: "Medium activity",
  },
  {
    name: "Neural Network Architectures",
    tracked: "55 papers",
    activity: "Low activity",
  },
];

const notificationFilters = [
  {
    title: "Filters",
    options: [
      { label: "All Notifications", active: true },
      { label: "Unread" },
    ],
  },
  {
    title: "",
    options: [
      { label: "Any Time", active: true },
      { label: "Today" },
      { label: "This Week" },
    ],
  },
];

const notificationItems = [
  {
    id: "topic-alert-neural-architecture",
    type: "TOPIC ALERT",
    time: "Just now",
    title: "NEW TOPIC MATCH:",
    text: 'A new publication titled "Advancements in Neural Architecture Search" matches your interest in Deep Learning. Similarity: 92%.',
    icon: "M12 3.5 19.5 7.8v8.4L12 20.5 4.5 16.2V7.8L12 3.5ZM8.5 10.2l3.5 2 3.5-2M12 12.2v4.3M8.5 7.9l3.5 2 3.5-2",
    tone: "purple",
    unread: true,
    bookmarked: true,
    route: "/researcher-search?view=list",
  },
  {
    id: "trend-transformer-models",
    type: "TREND ALERT",
    time: "10 mins ago",
    title: "",
    text: 'Keyword "Transformer Models" is showing a 34% spike in citations this month across top-tier ML journals.',
    icon: "M4 17.5 9 12l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14M7 16v4M12 14v6M17 11v9",
    tone: "green",
    unread: true,
    route: "/researcher-trend-tracking",
  },
  {
    id: "new-publications-quantum",
    type: "NEW PUBLICATION",
    time: "2 hours ago",
    title: "",
    text: '5 new publications match your followed keyword "Quantum Computing Scaling" in Nature Physics.',
    icon: "M7 4.5h8.5L19 8v12H7zM15.5 4.5V8H19M10 12h5M10 15h6M10 18h3M4 7.5v12h3",
    tone: "purple-soft",
    unread: true,
    route: "/researcher-search?view=list",
  },
  {
    id: "system-sync-arxiv",
    type: "SYSTEM",
    time: "yesterday",
    title: "",
    text: "Sync management encountered a delay integrating the latest ArXiv dataset. The issue has been resolved.",
    icon: "M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8L20 6M17 16.5a6 6 0 0 1-10.2 2.8L4 18",
    tone: "gray",
    route: "/researcher-sync-management",
  },
  {
    id: "author-paper-thorne",
    type: "NEW PUBLICATION",
    time: "3 days ago",
    title: "",
    text: 'Dr. E. Thorne, whom you follow, published a new paper: "Neuroplasticity in Adult Avian Models."',
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0M16.5 5.5h3M18 4v3",
    tone: "purple-soft",
    route: "/researcher-profile",
  },
];

const profileTabs = [
  {
    label: "Personal Info",
    icon: "M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM3 20a9 9 0 0 1 18 0",
    active: true,
  },
  {
    label: "Academic Identity",
    icon: "M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6ZM8 9h8M8 13h6M18 7v2M16 8h4",
  },
  {
    label: "Role Change Request",
    icon: "M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3-3m-3 3 3 3",
  },
  {
    label: "Change Password",
    icon: "M5 11h14v10H5V11ZM8 11V8a4 4 0 0 1 8 0v3M12 14v4",
  },
  {
    label: "Research Interests",
    icon: "M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2L12 16.8l-6.4 4.4 2.4-7.2-6-4.8h7.6L12 2Z",
  },
  {
    label: "Notification Settings",
    icon: "M10 5a2 2 0 0 1 4 0 7 7 0 0 1 7 7v5l2 2v1H1v-1l2-2v-5a7 7 0 0 1 7-7ZM9 21h6",
  },
  {
    label: "Privacy & Security",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM12 8v4M12 16h.01",
  },
  {
    label: "Preferences",
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 6v6l4 2",
  },
];

const relatedPublications = [
  {
    title: "Topological Data Analysis in Genomics",
    authors: "Zhang et al.",
    meta: "Bioinformatics (2022)",
    stats: "892 Citations  |  Impact: 7.2",
  },
  {
    title: "Benchmarking Dimensionality Reduction Methods",
    authors: "Chen, L., Gupta, S.",
    meta: "Nature Methods (2021)",
    stats: "2,105 Citations  |  Impact: 14.5",
  },
];

const researcherNavGroups = [
  {
    items: [
      {
        label: "Dashboard",
        route: "/researcher-dashboard",
        icon: "M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6zM7 8h.01M17 8h.01M7 17h.01M17 17h.01",
      },
      {
        label: "Search",
        route: "/researcher-search",
        icon: "M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6",
      },
      {
        label: "Bookmarks",
        route: "/researcher-bookmarks",
        icon: "M6 4.5h12v15L12 16l-6 3.5v-15ZM9 8h6M9 11h5",
      },
      {
        label: "Notifications",
        route: "/researcher-notifications",
        icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2",
      },
    ],
  },
  {
    heading: "Analysis",
    items: [
      {
        label: "Trend Tracking",
        route: "/researcher-trend-tracking",
        icon: "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14",
      },
      {
        label: "Reports",
        route: "/researcher-reports",
        icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 15V9M12 15v-3M15 15v-5",
      },
      {
        label: "Year Comparison",
        route: "/researcher-year-comparison",
        icon: "M5 6h4v13H5zM15 4h4v15h-4zM10.5 10h3M10.5 14h3M4 20h16",
      },
    ],
  },
];

const researcherStats = [
  {
    label: "admin.totalPublications",
    value: "124,592",
    note: "+2.4% vs last month",
    tone: "positive",
    icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5M9 17h3",
  },
  {
    label: "New This Week",
    value: "1,843",
    note: "+12% vs last week",
    tone: "positive",
    icon: "M5 18h14M7 15l4-4 3 2.5 5-6M16 7h3v3M7 7h4",
  },
  {
    label: "Your Bookmarks",
    value: "47",
    note: "3 recently updated",
    tone: "neutral",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15ZM9 8h6M9 11h5",
  },
  {
    label: "Unread Alerts",
    value: "12",
    note: "5 high priority",
    tone: "danger",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2",
  },
];

const publicationGrowthData = [
  { year: 2014, publications: 14592 },
  { year: 2015, publications: 19840 },
  { year: 2016, publications: 27315 },
  { year: 2017, publications: 36480 },
  { year: 2018, publications: 48720 },
  { year: 2019, publications: 58640 },
  { year: 2020, publications: 61430 },
  { year: 2021, publications: 57180 },
  { year: 2022, publications: 75290 },
  { year: 2023, publications: 80110 },
  { year: 2024, publications: 87240 },
];

const researcherKeywords = [
  { label: "Machine Learning", percent: "+45%", width: "92%" },
  { label: "Climate Change", percent: "+32%", width: "72%" },
  { label: "CRISPR", percent: "+28%", width: "60%" },
  { label: "Quantum Computing", percent: "+15%", width: "48%" },
  { label: "Microplastics", percent: "+12%", width: "32%" },
];

const researcherDomains = [
  { label: "Medicine", value: "40%", color: "#4f46e5" },
  { label: "Engineering", value: "30%", color: "#0f172a" },
  { label: "Biology", value: "20%", color: "#10b981" },
];

const trendMetricCards = [
  {
    label: "Total Pubs",
    value: "142,890",
    icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5M9 17h3",
    bars: [28, 34, 46, 55, 76],
    tone: "volume",
  },
  {
    label: "YoY Growth",
    value: "+18.4%",
    note: "vs last year",
    icon: "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14",
    bars: [35, 43, 48, 57, 83],
    tone: "growth",
  },
  {
    label: "Trending Score A",
    sublabel: "(Raw)",
    value: "94.2",
    note: "+1.2",
    icon: "M5 19h14M8 15v-5M12 15V7M16 15v-8M7 5h2M11 4h2M15 3h2",
    score: 94,
    tone: "score-a",
  },
  {
    label: "Trending Score B",
    sublabel: "(Rate)",
    value: "88.7",
    note: "+4.5",
    icon: "M12 4v3M12 17v3M4 12h3M17 12h3M7.8 7.8l2.8 2.8M16.2 7.8 13 11M8 16l3-3M12 12l4.2 4.2",
    score: 89,
    tone: "score-b",
  },
];

const trendLineData = [
  { year: 2019, value: 11700 },
  { year: 2020, value: 14500 },
  { year: 2021, value: 21400 },
  { year: 2022, value: 42600 },
  { year: 2023, value: 62700 },
];

const trendTopRaw = [
  { keyword: "Deep Learning", count: "45,210", values: [38, 48, 62, 76, 92] },
  { keyword: "Neural Networks", count: "38,902", values: [30, 44, 58, 68, 84] },
  { keyword: "NLP", count: "29,450", values: [24, 36, 42, 63, 75] },
  { keyword: "Computer Vision", count: "25,100", values: [34, 39, 48, 54, 69] },
  {
    keyword: "Reinforcement Learning",
    count: "18,320",
    values: [18, 28, 38, 50, 64],
  },
];

const trendTopGrowth = [
  { keyword: "Large Language Models", growth: "+850%" },
  { keyword: "Generative AI", growth: "+420%" },
  { keyword: "Prompt Engineering", growth: "+315%" },
  { keyword: "Federated Learning", growth: "+180%" },
  { keyword: "Quantum ML", growth: "+145%" },
];

const trendVolumeRows = [
  {
    discipline: "Computer Science",
    values: ["8,400", "10,200", "14,500", "28,000", "42,100"],
    total: "103,200",
  },
  {
    discipline: "Medicine & Health",
    values: ["1,200", "1,800", "3,100", "6,500", "11,200"],
    total: "23,800",
  },
  {
    discipline: "Engineering",
    values: ["2,100", "2,500", "3,800", "8,100", "9,400"],
    total: "25,900",
  },
  {
    discipline: "Aggregated Total",
    values: ["11,700", "14,500", "21,400", "42,600", "62,700"],
    total: "152,900",
    summary: true,
  },
];

const trendTopicFilters = [
  "All Topics",
  "Artificial Intelligence",
  "Systems Biology",
  "Quantum Computing",
  "Nanotechnology",
  "Neuroscience",
];

const trendKeywordOverview = [
  {
    keyword: "Transformers",
    category: "Artificial Intelligence",
    mentions: "12,450",
    change: "+42%",
    tone: "up",
  },
  {
    keyword: "CRISPR-Cas9",
    category: "Biotechnology",
    mentions: "8,920",
    change: "+28%",
    tone: "up",
    selected: true,
  },
  {
    keyword: "LLMs",
    category: "Artificial Intelligence",
    mentions: "15,300",
    change: "+156%",
    tone: "up",
  },
  {
    keyword: "Graphene",
    category: "Materials Science",
    mentions: "5,102",
    change: "-4%",
    tone: "down",
  },
];

const reportMetrics = [
  "Publication Count",
  "Growth Rate",
  "Trending Score A",
  "Trending Score B",
  "Top Authors",
  "Top Journals",
  "Citation Analysis",
];

const reportHistoryRows = [
  { name: "ML_Nature_Sci_18_23.xlsx", date: "Today, 14:32", format: "Excel" },
  { name: "Genomics_Growth_Q3.csv", date: "Yesterday, 09:15", format: "CSV" },
  { name: "Author_Analysis_AI.xlsx", date: "Oct 12, 2023", format: "Excel" },
];

const yearMetricCards = [
  {
    label: "admin.totalPublications",
    value: "12,450",
    note: "+8.4%",
    icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5M9 17h3",
    bars: [28, 46, 38, 50, 66, 78],
  },
  {
    label: "Total Citations",
    value: "84,201",
    note: "+12.1%",
    extra: "99",
    icon: "M5 19h14M8 16V9M12 16V7M16 16v-5M7 5h2M11 4h2M15 6h2",
    bars: [24, 36, 29, 43, 58, 70],
  },
  {
    label: "Top Keyword Shift",
    value: "Machine Lear",
    subvalue: "Stable",
    icon: "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14",
    ranks: ["Rank #1 (2024)", "Rank #1 (2025)"],
  },
  {
    label: "Top Journal Divergence",
    value: "Nature Comm.",
    subvalue: "2 Rank",
    icon: "M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3M8 10h2M14 10h2M8 13h2M14 13h2",
    ranks: ["Rank #2 (2024)", "Rank #4 (2025)"],
    danger: true,
  },
];

const yearKeywordDiff = [
  { keyword: "LLMs", delta: "+245%", tone: "up" },
  { keyword: "CRISPR", delta: "+88%", tone: "up" },
  { keyword: "Data Mining", delta: "--", tone: "flat" },
  { keyword: "Hadoop", delta: "-42%", tone: "down" },
  { keyword: "Blockchain", delta: "-18%", tone: "down" },
  { keyword: "Web3", delta: "-65%", tone: "down" },
];

const yearTrajectoryData = [
  { quarter: "Q1", baseline: 280, comparison: 340 },
  { quarter: "Q2", baseline: 560, comparison: 760 },
  { quarter: "Q3", baseline: 500, comparison: 1080 },
  { quarter: "Q4", baseline: 900, comparison: 1260 },
  { quarter: "Q4", baseline: 820, comparison: 1420 },
];

const syncSourceCards = [
  {
    name: "Semantic Scholar API",
    role: "Primary metadata source",
    status: "Connected",
    statusTone: "healthy",
    synced: "128,420",
    latency: "184 ms",
    coverage: "96%",
  },
  {
    name: "OpenAlex API",
    role: "RQ2 comparison sample",
    status: "Compare-only",
    statusTone: "warning",
    synced: "24,880",
    latency: "231 ms",
    coverage: "Sample",
  },
];

const syncPipelineSteps = [
  {
    label: "Fetch Publication Metadata",
    detail: "DOI, title, authors, venue, abstract",
    state: "complete",
  },
  {
    label: "Normalize Schema",
    detail: "Map API fields into ScholarTrend database",
    state: "active",
  },
  {
    label: "Deduplicate Records",
    detail: "Merge by DOI, Semantic Scholar ID, OpenAlex ID",
    state: "queued",
  },
  {
    label: "Persist to Database",
    detail: "Write publication, author, keyword relations",
    state: "queued",
  },
];

const syncJobs = [
  {
    job: "Nightly Semantic Scholar Refresh",
    schedule: "02:00 daily",
    lastRun: "Today, 02:03",
    duration: "18m 42s",
    status: "Succeeded",
  },
  {
    job: "OpenAlex RQ2 Sample Compare",
    schedule: "Saturday",
    lastRun: "Jun 15, 09:00",
    duration: "07m 11s",
    status: "Succeeded",
  },
  {
    job: "Metadata Normalization Sweep",
    schedule: "Every 6 hours",
    lastRun: "Today, 12:00",
    duration: "04m 36s",
    status: "Running",
  },
];

const syncLogs = [
  {
    time: "14:21:09",
    level: "Info",
    message: "Normalized 1,284 publication records into canonical schema.",
  },
  {
    time: "14:19:44",
    level: "Warn",
    message:
      "OpenAlex sample returned 18 records without DOI; matched by title similarity.",
  },
  {
    time: "14:17:02",
    level: "Error",
    message:
      "Semantic Scholar rate limit hit for batch #42. Retry scheduled in 120 seconds.",
  },
  {
    time: "14:12:18",
    level: "Info",
    message: "Hangfire job Metadata Normalization Sweep started.",
  },
];

const graphPaper = {
  title: "DeepFruits: A Fruit Detection System Using Deep Neural Networks",
  authors:
    "Inkyu Sa, ZongYuan Ge, Feras Dayoub, B. Upcroft, Tristan Perez, C. McCool",
  year: "2016",
  venue: "Sensors Journal",
  similarity: "98.2%",
  citations: "1,429",
  abstract:
    "This paper presents a novel approach to fruit detection using deep convolutional neural networks. The aim is to build an accurate, fast and reliable fruit detection system, which is a vital element of an autonomous agricultural robotic platform.",
  accessPoints: ["PDF via IEEE Xplore", "arXiv:1604.04770"],
};

const graphNodes = [
  {
    id: "deepfruits",
    label: "DeepFruits, 2016",
    x: 360,
    y: 330,
    r: 30,
    selected: true,
  },
  { id: "sa", label: "Sa et al., 2014", x: 372, y: 210, r: 7 },
  { id: "inkyu", label: "Inkyu Sa, 2015", x: 250, y: 285, r: 8 },
  { id: "mccool", label: "McCool, 2016", x: 456, y: 384, r: 13 },
  { id: "bargoti", label: "Bargoti, 2017", x: 286, y: 455, r: 8 },
];

const graphLinks = [
  ["deepfruits", "sa"],
  ["deepfruits", "inkyu"],
  ["deepfruits", "mccool"],
  ["deepfruits", "bargoti"],
];

const graph3DNodes = [
  {
    id: "deepfruits",
    label: "DeepFruits, 2016",
    position: [130, 10, 24],
    size: 48,
    color: "#c3d8d7",
    selected: true,
  },
  {
    id: "tarjan1972",
    label: "Tarjan, 1972",
    position: [60, 72, 8],
    size: 70,
    color: "#b9cecc",
  },
  {
    id: "aho1974",
    label: "Aho, 1974",
    position: [285, -74, -28],
    size: 62,
    color: "#c4d7d6",
  },
  {
    id: "hopcroft1974",
    label: "Hopcroft, 1974",
    position: [-24, -76, 18],
    size: 46,
    color: "#b7cecd",
  },
  {
    id: "lipton1977",
    label: "Lipton, 1977",
    position: [14, 106, -24],
    size: 42,
    color: "#c7d9d9",
  },
  {
    id: "gabow2000",
    label: "Gabow, 2000",
    position: [-74, 92, 28],
    size: 36,
    color: "#608a89",
  },
  {
    id: "gabow1976",
    label: "Gabow, 1976",
    position: [178, 154, -52],
    size: 38,
    color: "#c4d6d5",
  },
  {
    id: "frederickson1987",
    label: "Frederickson, 1987",
    position: [184, 74, -18],
    size: 42,
    color: "#8aa8a8",
  },
  {
    id: "williamson1984",
    label: "Williamson, 1984",
    position: [-185, 12, 30],
    size: 38,
    color: "#b2c9c8",
  },
  {
    id: "boyer1976",
    label: "BoyerEven, 1976",
    position: [-175, -38, 8],
    size: 45,
    color: "#c8d6d4",
  },
  {
    id: "fraysseix1985",
    label: "Fraysseix, 1985",
    position: [-276, 36, -10],
    size: 32,
    color: "#9db8b7",
  },
  {
    id: "fraysseix2006a",
    label: "Fraysseix, 2006",
    position: [-188, 86, 12],
    size: 23,
    color: "#6b9493",
  },
  {
    id: "fraysseix2012",
    label: "Fraysseix, 2012",
    position: [-230, 120, -42],
    size: 18,
    color: "#416f6e",
  },
  {
    id: "boyer2003",
    label: "Boyer, 2003",
    position: [-236, -24, 48],
    size: 27,
    color: "#517b7a",
  },
  {
    id: "shih2003",
    label: "Shih, 2003",
    position: [-298, -64, 16],
    size: 25,
    color: "#6d9998",
  },
  {
    id: "shih1999",
    label: "Shih, 1999",
    position: [-250, -112, 30],
    size: 28,
    color: "#577f7e",
  },
  {
    id: "tamassia1986",
    label: "Tamassia, 1986",
    position: [-340, -126, -8],
    size: 39,
    color: "#91b0af",
  },
  {
    id: "tamassia1987",
    label: "Tamassia, 1987",
    position: [-346, -244, -34],
    size: 42,
    color: "#8fb0af",
  },
  {
    id: "feng1995",
    label: "Feng, 1995",
    position: [-224, -158, 16],
    size: 35,
    color: "#6f9998",
  },
  {
    id: "battista1989",
    label: "Battista, 1989",
    position: [-166, -220, -16],
    size: 37,
    color: "#7fa2a1",
  },
  {
    id: "gutwenger2000",
    label: "Gutwenger, 2000",
    position: [-116, -148, 42],
    size: 40,
    color: "#5d8987",
  },
  {
    id: "booth1976",
    label: "Booth, 1976",
    position: [-62, -196, -26],
    size: 52,
    color: "#bdd2d1",
  },
  {
    id: "kuratowski",
    label: "Kuratowski",
    position: [-58, -326, -38],
    size: 50,
    color: "#9d9d9d",
  },
  {
    id: "junger1998",
    label: "Junger, 1998",
    position: [-248, -266, -18],
    size: 36,
    color: "#5e8887",
  },
  {
    id: "nishizeki1988",
    label: "Nishizeki, 1988",
    position: [-238, -354, 22],
    size: 38,
    color: "#7fa4a3",
  },
  {
    id: "korach1988",
    label: "Korach, 1988",
    position: [-104, 186, 12],
    size: 30,
    color: "#87aaa9",
  },
  {
    id: "korach1993",
    label: "Korach, 1993",
    position: [-24, 162, -10],
    size: 22,
    color: "#85a9a8",
  },
  {
    id: "tarjan1986",
    label: "Tarjan, 1986",
    position: [-110, 96, 36],
    size: 32,
    color: "#b8cfce",
  },
  {
    id: "tarjan2022",
    label: "Tarjan, 2022",
    position: [-14, 248, 32],
    size: 24,
    color: "#426f6f",
  },
  {
    id: "hopcroft1972",
    label: "Hopcroft, 1972",
    position: [30, 142, -58],
    size: 31,
    color: "#cedfdf",
  },
  {
    id: "asano1985",
    label: "Asano, 1985",
    position: [-18, 30, 62],
    size: 35,
    color: "#9db9b8",
  },
  {
    id: "colbourn1981",
    label: "Colbourn, 1981",
    position: [-22, -38, 42],
    size: 32,
    color: "#bed5d4",
  },
  {
    id: "grigoreva1991",
    label: "Grigor'eva, 1991",
    position: [38, -70, 20],
    size: 18,
    color: "#779d9c",
  },
  {
    id: "lueker1979",
    label: "Lueker, 1979",
    position: [78, -236, -12],
    size: 36,
    color: "#b0c8c7",
  },
  {
    id: "hopcroft1971",
    label: "Hopcroft, 1971",
    position: [164, -228, -50],
    size: 30,
    color: "#d5e3e3",
  },
  {
    id: "luks1980",
    label: "Luks, 1980",
    position: [256, -326, -16],
    size: 44,
    color: "#b2cbca",
  },
  {
    id: "hopcroft1974b",
    label: "Hopcroft, 1974",
    position: [222, -250, 12],
    size: 34,
    color: "#c5d8d7",
  },
];

const graph3DLinks = [
  ["deepfruits", "tarjan1972", "strong"],
  ["deepfruits", "hopcroft1974", "strong"],
  ["deepfruits", "lipton1977", "strong"],
  ["deepfruits", "grigoreva1991", "strong"],
  ["deepfruits", "frederickson1987", "strong"],
  ["deepfruits", "aho1974", "faint"],
  ["tarjan1972", "lipton1977", "strong"],
  ["tarjan1972", "gabow2000", "strong"],
  ["tarjan1972", "korach1993", "faint"],
  ["tarjan1972", "tarjan1986", "faint"],
  ["lipton1977", "hopcroft1974", "faint"],
  ["hopcroft1974", "colbourn1981", "strong"],
  ["hopcroft1974", "booth1976", "faint"],
  ["hopcroft1974", "lueker1979", "strong"],
  ["lueker1979", "luks1980", "strong"],
  ["lueker1979", "hopcroft1971", "faint"],
  ["luks1980", "hopcroft1974b", "strong"],
  ["gabow2000", "gabow1976", "faint"],
  ["gabow2000", "hopcroft1972", "faint"],
  ["frederickson1987", "gabow1976", "faint"],
  ["williamson1984", "boyer1976", "strong"],
  ["williamson1984", "fraysseix1985", "strong"],
  ["williamson1984", "fraysseix2006a", "faint"],
  ["boyer1976", "boyer2003", "strong"],
  ["boyer1976", "feng1995", "faint"],
  ["boyer1976", "gutwenger2000", "faint"],
  ["fraysseix1985", "fraysseix2012", "faint"],
  ["fraysseix1985", "shih2003", "strong"],
  ["fraysseix1985", "boyer2003", "faint"],
  ["fraysseix2006a", "fraysseix2012", "strong"],
  ["shih2003", "shih1999", "strong"],
  ["shih1999", "tamassia1986", "faint"],
  ["tamassia1986", "tamassia1987", "strong"],
  ["tamassia1986", "feng1995", "faint"],
  ["feng1995", "battista1989", "faint"],
  ["feng1995", "junger1998", "strong"],
  ["battista1989", "gutwenger2000", "strong"],
  ["junger1998", "nishizeki1988", "faint"],
  ["gutwenger2000", "booth1976", "strong"],
  ["booth1976", "kuratowski", "faint"],
  ["korach1988", "korach1993", "strong"],
  ["korach1988", "tarjan1986", "strong"],
  ["korach1993", "tarjan2022", "faint"],
  ["tarjan1986", "asano1985", "faint"],
  ["asano1985", "colbourn1981", "strong"],
  ["colbourn1981", "booth1976", "faint"],
  ["asano1985", "williamson1984", "faint"],
  ["tarjan1986", "boyer1976", "faint"],
  ["gabow2000", "williamson1984", "faint"],
  ["colbourn1981", "lueker1979", "faint"],
  ["fraysseix1985", "korach1988", "faint"],
  ["boyer1976", "tarjan1986", "faint"],
  ["williamson1984", "asano1985", "faint"],
  ["gutwenger2000", "hopcroft1974", "faint"],
];

const getGraphNodeRelevance = (node) => {
  if (!node) return "0%";
  const explicitScore = Number(
    node.similarity ?? node.paper?.similarityPercent,
  );
  if (Number.isFinite(explicitScore) && explicitScore > 0) {
    return `${Math.max(1, Math.min(99.9, explicitScore)).toFixed(1)}%`;
  }

  const [x = 0, y = 0, z = 0] = Array.isArray(node.position)
    ? node.position
    : [0, 0, 0];
  const distanceFromCenter = Math.hypot(Number(x), Number(y), Number(z));
  const sizeScore = Number(node.size || 20) * 0.42;
  const proximityScore = Math.max(0, 34 - distanceFromCenter / 12);
  const yearMatch = String(node.label || "").match(/\b(19|20)\d{2}\b/);
  const yearBonus = yearMatch
    ? Math.max(0, 12 - Math.abs(Number(yearMatch[0]) - 2016) * 0.35)
    : 4;
  const score = 38 + sizeScore + proximityScore + yearBonus;
  return `${Math.max(35, Math.min(98.5, score)).toFixed(1)}%`;
};

const getGraphPaperForNode = (node) => {
  if (node?.paper) {
    const authors = Array.isArray(node.paper.authors)
      ? node.paper.authors.join(", ")
      : node.paper.authors || "Unknown authors";
    const sourceLinks = buildExternalSourceLinks(node.paper);
    return {
      id: node.paper.id,
      title: node.paper.title,
      authors,
      year: node.paper.year || "Published",
      venue: node.paper.journalName || "ScholarTrend Published",
      similarity: getGraphNodeRelevance(node),
      citations: formatCount(node.paper.citationCount || 0),
      abstract: node.paper.abstract || "No abstract provided.",
      sourceUrl: node.paper.sourceUrl,
      sourceApi: node.paper.sourceApi,
      doi: node.paper.doi || node.paper.DOI,
      accessPoints: sourceLinks,
    };
  }

  if (!node || node.id === "deepfruits") return graphPaper;

  const [name, rawYear] = node.label.split(", ");
  const year = rawYear || "Network";
  const citationCount = Math.round(
    node.size * 27 +
      Math.abs(node.position[0]) * 1.8 +
      Math.abs(node.position[1]) +
      180,
  );

  return {
    title: `${node.label}: Citation Neighborhood`,
    authors: `${name} and related indexed publications`,
    year,
    venue: "ScholarTrend Knowledge Graph",
    similarity: getGraphNodeRelevance(node),
    citations: citationCount.toLocaleString("en-US"),
    abstract: `${node.label} sits inside a connected citation neighborhood. ScholarTrend ranks this node by graph proximity, citation overlap, and topical similarity to the selected research query.`,
    accessPoints: ["Open citation path", "Inspect related publications"],
  };
};

const createApiBackedGraphNodes = (publications = [], accuracyLimit = 100) => {
  const realPublications = publications.filter((paper) => paper?.title);
  if (!realPublications.length) {
    return [];
  }

  return graph3DNodes.slice(0, realPublications.length).map((layoutNode, index) => {
    const paper = realPublications[index];
    const title = paper.title || layoutNode.label;
    const year = paper.year || "Published";
    const firstAuthor = Array.isArray(paper.authors)
      ? paper.authors[0]
      : String(paper.authors || "").split(",")[0];
    const authorLabel = String(firstAuthor || "")
      .trim()
      .split(/\s+/)
      .slice(-1)[0]
      ?.replace(/[^\p{L}\p{N}'-]/gu, "");
    const fallbackLabel = String(layoutNode.label || title).split(",")[0];
    const shortLabel = `${authorLabel || fallbackLabel}, ${year}`;
    return {
      ...layoutNode,
      label: shortLabel,
      color: layoutNode.id === "deepfruits" ? "#c3d8d7" : layoutNode.color,
      similarity: getPublicationDisplaySimilarity(
        paper,
        accuracyLimit,
        Number(getGraphNodeRelevance(layoutNode).replace("%", "")),
      ),
      published: true,
      paper: {
        ...paper,
        id: paper.id,
        title,
        year,
        journalName: paper.journalName || "ScholarTrend Indexed",
        citationCount: paper.citationCount || 0,
        abstract: paper.abstract || "No abstract provided.",
        authors: Array.isArray(paper.authors) ? paper.authors : [],
        similarityPercent: getPublicationDisplaySimilarity(
          paper,
          accuracyLimit,
          Number(getGraphNodeRelevance(layoutNode).replace("%", "")),
        ),
      },
    };
  });
};

function MiniIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function StudentSidebar({ activeRoute }) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const session = getCurrentAccountPlan();
  const displayName = session.name || session.email || "Student Account";
  const displayRole = session.role || "Student";
  const avatarUrl =
    session.picture ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
  const closeMobile = React.useCallback(() => setMobileOpen(false), []);
  const handleNavigate = (route) => (event) => {
    closeMobile();
    navTo(route)(event);
  };

  React.useEffect(() => {
    const openSidebar = () => setMobileOpen(true);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMobile();
    };

    window.addEventListener("scholartrend:student-sidebar-open", openSidebar);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener(
        "scholartrend:student-sidebar-open",
        openSidebar,
      );
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeMobile]);

  React.useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className={`student-sidebar-backdrop ${mobileOpen ? "open" : ""}`}
        aria-label="Close student navigation"
        onClick={closeMobile}
      />
      <aside className={`student-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div
          className="student-logo"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(226, 232, 240, 0.14)",
            position: "relative",
          }}
        >
          <span
            className="student-logo-mark"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
              borderRadius: "8px",
              padding: "8px",
              boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
              flexShrink: 0,
              marginTop: 0,
            }}
          >
            <svg
              viewBox="0 0 32 32"
              width="100%"
              height="100%"
              aria-hidden="true"
            >
              <path
                d="M16 4 L10 8 L10 16 L16 20 L16 12 L16 4 Z"
                fill="white"
                opacity="0.95"
              />
              <path
                d="M16 4 L22 8 L22 16 L16 20 L16 12 L16 4 Z"
                fill="white"
                opacity="0.75"
              />
              <path
                d="M16 4 L10 8 L16 10 L22 8 Z"
                fill="rgba(255, 255, 255, 0.95)"
              />
              <path
                d="M16 4 L16 28"
                stroke="rgba(2, 132, 199, 0.4)"
                strokeWidth="1.5"
              />
              <circle cx="16" cy="28" r="1.5" fill="white" />
            </svg>
          </span>
          <div
            className="student-logo-copy"
            style={{ display: "flex", flexDirection: "column", gap: "2px" }}
          >
            <a
              href="/"
              onClick={handleNavigate("/")}
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#cbd5e1",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                letterSpacing: "0.08em",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "inline", marginTop: 0 }}>Scholar</span>
              <span
                style={{ color: "#06b6d4", display: "inline", marginTop: 0 }}
              >
                Trend
              </span>
            </a>
            <span
              style={{
                display: "block",
                marginTop: 0,
                maxWidth: "116px",
                fontSize: "11px",
                color: "#7f8aa0",
                fontWeight: 700,
                letterSpacing: "0.06em",
                lineHeight: 1.2,
                textTransform: "uppercase",
              }}
            >
              Analytical
              <br />
              Intelligence
            </span>
          </div>
          <button
            type="button"
            className="student-sidebar-close"
            aria-label="Close navigation"
            onClick={closeMobile}
          >
            <MiniIcon path="M6 6l12 12M18 6 6 18" />
          </button>
        </div>

        <nav className="student-nav" aria-label="Student dashboard navigation">
          {sidebarItems.map((item) => (
            <a
              className={item.route === activeRoute ? "active" : ""}
              href={item.route}
              onClick={handleNavigate(item.route)}
              key={item.label}
            >
              <MiniIcon path={item.icon} />
              <span>{t(item.label)}</span>
            </a>
          ))}
        </nav>

        <div className="student-sidebar-footer">
          <a
            className={`sidebar-profile-card ${activeRoute === "/student-profile" ? "active" : ""}`}
            href="/student-profile"
            onClick={handleNavigate("/student-profile")}
          >
            <div className="sidebar-avatar">
              <img src={avatarUrl} alt={`${displayName} avatar`} />
            </div>
            <div className="sidebar-profile-info">
              <strong>{displayName}</strong>
              <span>{displayRole}</span>
            </div>
          </a>
          <button
            type="button"
            className="student-logout-button"
            onClick={handleLogout}
          >
            <MiniIcon path="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function StudentTopbar({
  crumb = "Dashboard",
  searchValue = "",
  wideSearch = false,
  variant = "default",
  searchPlaceholder = "Search keyword, author, or DOI...",
}) {
  const isProfileUtility = variant === "profile";
  const isUtility = variant === "utility" || isProfileUtility;
  const [queryValue, setQueryValue] = React.useState(searchValue);
  React.useEffect(() => {
    setQueryValue(searchValue || "");
  }, [searchValue]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = queryValue.trim();
    goToRoute(
      query
        ? `/student-search?q=${encodeURIComponent(query)}`
        : "/student-search",
    );
  };

  return (
    <header
      className={`student-topbar ${isUtility ? "utility" : ""} ${isProfileUtility ? "profile-utility" : ""}`}
    >
      <button
        type="button"
        className="student-menu-button"
        aria-label="Toggle navigation"
        onClick={() =>
          window.dispatchEvent(new Event("scholartrend:student-sidebar-open"))
        }
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      {crumb ? (
        typeof crumb === "string" ? (
          <span className="student-topbar-title">{crumb}</span>
        ) : (
          crumb
        )
      ) : null}
      <div className="student-top-actions">
        <form
          className={`student-global-search ${wideSearch ? "wide" : ""}`}
          onSubmit={handleSearchSubmit}
        >
          <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
          <input
            type="search"
            name="query"
            placeholder={searchPlaceholder}
            value={queryValue}
            onChange={(event) => setQueryValue(event.target.value)}
          />
        </form>
        <div className="topbar-icon-group">
          <button
            type="button"
            aria-label={isUtility ? "Help" : "Notifications"}
            className={`top-icon ${isUtility ? "" : "alert-dot"}`}
            onClick={isUtility ? undefined : navTo("/student-notifications")}
          >
            <MiniIcon
              path={
                isUtility
                  ? "M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  : "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4"
              }
            />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="top-icon"
            onClick={navTo("/student-profile")}
          >
            <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
          </button>
          <button
            type="button"
            aria-label="User profile"
            className="student-avatar image-avatar"
            onClick={navTo("/student-profile")}
          >
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User profile"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

function StudentDashboard() {
  const [localBookmarks, setLocalBookmarkState] = React.useState(() =>
    getLocalBookmarks(),
  );
  const [dashboardQuery, setDashboardQuery] = React.useState("");
  const session = getCurrentAccountPlan();
  const displayName = getSessionDisplayName(session, "Student");
  const displayRole = normalizeRoleForUi(session.role || "Student");
  const hasBackendAuth = Boolean(getStoredAuth().accessToken);
  const { data: dashboardSuggestions } = useSearchSuggestions(
    dashboardQuery,
    6,
  );
  const { data: publicationData } = useApiResource(null, publications, {
    select: (payload) => unwrapList(payload).map(mapPublicationForCard),
  });
  const { data: recommendedData } = useApiResource(
    hasBackendAuth ? "/api/recommendations?topN=8" : null,
    [],
    {
      auth: true,
      select: (payload) => unwrapList(payload).map(mapPublicationForCard),
    },
  );
  const publishedPublicationCards = React.useMemo(
    () => getPublishedPublications().map(mapPublishedPublicationForCard),
    [],
  );
  const { data: keywordData } = useApiResource(
    null,
    ["Machine Learning", "Climate Change Policy", "CRISPR Applications"],
    {
      select: (payload) =>
        unwrapList(payload)
          .map((item) => item.keyword)
          .filter(Boolean)
          .slice(0, 3),
    },
  );
  const { data: statsData } = useApiResource(null, null);
  const studentStats = React.useMemo(() => {
    if (!statsData) return statCards;
    return statCards.map((card) => {
      if (card.label === "My Bookmarks") {
        return { ...card, value: formatCount(statsData.totalPublications) };
      }
      if (card.label === "Followed Keywords") {
        return { ...card, value: formatCount(statsData.totalKeywords) };
      }
      return card;
    });
  }, [statsData]);
  const studentPublications = React.useMemo(
    () =>
      mergePublicationsByIdOrTitle(publishedPublicationCards, publicationData)
        .concat(recommendedData)
        .filter((paper, index, list) => {
          const key = String(paper.id || paper.title).toLowerCase();
          return (
            list.findIndex(
              (item) => String(item.id || item.title).toLowerCase() === key,
            ) === index
          );
        })
        .slice(0, 8)
        .map((paper) => ({
          ...paper,
          saved: hasLocalBookmark(paper, localBookmarks),
        })),
    [
      publicationData,
      publishedPublicationCards,
      recommendedData,
      localBookmarks,
    ],
  );

  const handleTogglePublicationBookmark = async (paper) => {
    const nextSaved = !hasLocalBookmark(paper, localBookmarks);
    const nextLocalBookmarks = nextSaved
      ? upsertLocalBookmark(paper)
      : removeLocalBookmark(paper);
    setLocalBookmarkState(nextLocalBookmarks);

    if (isBackendNumericId(paper.id) && getStoredAuth().accessToken) {
      apiFetch(`/api/bookmarks/${paper.id}`, {
        method: nextSaved ? "POST" : "DELETE",
        auth: true,
      }).catch(() => {});
    }
  };

  const handleDashboardSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (dashboardQuery.trim()) params.set("q", dashboardQuery.trim());
    goToRoute(
      `/student-search${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-dashboard" />
      <section className="student-main">
        <StudentTopbar />

        <div className="student-content">
          <div className="student-welcome-row">
            <div>
              <h1>Welcome back, {displayName}</h1>
              <p>
                <span>{displayRole}</span> University of Applied Sciences
              </p>
            </div>
          </div>

          <section className="student-stats" aria-label="Student metrics">
            {studentStats.map((card) => (
              <article className="student-stat-card" key={card.label}>
                <div>
                  <span>{card.label}</span>
                  <MiniIcon path={card.icon} />
                </div>
                <strong>{card.value}</strong>
                <p className={card.tone}>{card.note}</p>
              </article>
            ))}
          </section>

          <section className="deep-search" aria-label="Deep dive into research">
            <h2>Deep Dive into Research</h2>
            <p>
              Search across millions of academic papers, journals, and
              analytical reports.
            </p>
            <form onSubmit={handleDashboardSearch}>
              <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
              <input
                type="search"
                value={dashboardQuery}
                onChange={(event) => setDashboardQuery(event.target.value)}
                placeholder="Search by title, author, DOI, or keyword..."
                list="student-dashboard-search-suggestions"
              />
              <datalist id="student-dashboard-search-suggestions">
                {dashboardSuggestions.map((suggestion) => (
                  <option value={suggestion} key={suggestion} />
                ))}
              </datalist>
              <button type="submit">Search</button>
            </form>
            <div className="trending-keywords">
              <span>Trending:</span>
              {keywordData.map((keyword) => (
                <a
                  href={`/student-search?q=${encodeURIComponent(keyword)}`}
                  onClick={navTo(
                    `/student-search?q=${encodeURIComponent(keyword)}`,
                  )}
                  key={keyword}
                >
                  {keyword}
                </a>
              ))}
            </div>
          </section>

          <div className="student-dashboard-grid">
            <section className="recommended-publications">
              <div className="section-title-row">
                <h2>Recommended Publications</h2>
                <a href="/student-search" onClick={navTo("/student-search")}>
                  View all -&gt;
                </a>
              </div>
              {studentPublications.map((paper) => (
                <article className="publication-card" key={paper.title}>
                  <button
                    type="button"
                    aria-label={
                      paper.saved ? "Remove bookmark" : "Bookmark publication"
                    }
                    className={`bookmark-button ${paper.saved ? "saved" : ""}`}
                    onClick={() => handleTogglePublicationBookmark(paper)}
                  >
                    <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
                  </button>
                  <div className="publication-tags">
                    {paper.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <h3>{paper.title}</h3>
                  <p>{paper.excerpt}</p>
                  <small>{paper.meta}</small>
                </article>
              ))}
            </section>

            <section className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {activities.map(([title, meta, icon], index) => (
                  <a
                    className="activity-item"
                    href="/student-publication"
                    onClick={navTo("/student-publication")}
                    key={title}
                  >
                    <MiniIcon path={icon} />
                    <div>
                      <strong>{title}</strong>
                      <span>{meta}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResearcherSidebar({
  activeRoute = "/researcher-dashboard",
  role = "researcher",
  collapsed = false,
  mobileOpen = false,
  onClose,
  onToggleCollapse,
  onSettings,
}) {
  const { t } = useTranslation();
  return (
    <aside
      className={`researcher-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
    >
      <div
        className="researcher-logo"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
            borderRadius: "8px",
            padding: "8px",
            boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
            flexShrink: 0,
            marginTop: 0,
          }}
        >
          <svg
            viewBox="0 0 32 32"
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            <path
              d="M16 4 L10 8 L10 16 L16 20 L16 12 L16 4 Z"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M16 4 L22 8 L22 16 L16 20 L16 12 L16 4 Z"
              fill="white"
              opacity="0.75"
            />
            <path
              d="M16 4 L10 8 L16 10 L22 8 Z"
              fill="rgba(255, 255, 255, 0.95)"
            />
            <path
              d="M16 4 L16 28"
              stroke="rgba(2, 132, 199, 0.4)"
              strokeWidth="1.5"
            />
            <circle cx="16" cy="28" r="1.5" fill="white" />
          </svg>
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "9px",
            flex: 1,
            minWidth: 0,
            paddingTop: "2px",
          }}
        >
          <a
            href="/"
            onClick={navTo("/")}
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#cbd5e1",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              letterSpacing: "0.08em",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            <span style={{ display: "inline", marginTop: 0 }}>Scholar</span>
            <span style={{ color: "#06b6d4", display: "inline", marginTop: 0 }}>
              Trend
            </span>
          </a>
          <span
            style={{
              display: "block",
              marginTop: 0,
              maxWidth: "116px",
              fontSize: "11px",
              color: "#7f8aa0",
              fontWeight: 700,
              letterSpacing: "0.06em",
              lineHeight: 1.2,
              textTransform: "uppercase",
            }}
          >
            Analytical
            <br />
            Intelligence
          </span>
        </div>
        <button
          type="button"
          className="researcher-sidebar-close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <MiniIcon path="M6 6l12 12M18 6 6 18" />
        </button>
        <button
          type="button"
          className="researcher-sidebar-toggle"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          onClick={onToggleCollapse}
        >
          <MiniIcon
            path={collapsed ? "M9 5l7 7-7 7M4 5v14" : "M15 5l-7 7 7 7M20 5v14"}
          />
        </button>
      </div>

      <nav
        className="researcher-nav"
        aria-label={`${role === "lecturer" ? "Lecturer" : "Researcher"} dashboard navigation`}
      >
        {researcherNavGroups.map((group, groupIndex) => (
          <div
            className="researcher-nav-group"
            key={group.heading || `primary-${groupIndex}`}
          >
            {group.heading ? <h2>{group.heading}</h2> : null}
            {group.items.map((item) => {
              const itemRoute = getAcademicPath(item.route, role);
              const dashboardRoute = getAcademicPath(
                "/researcher-dashboard",
                role,
              );

              return (
                <a
                  className={
                    itemRoute === activeRoute &&
                    (activeRoute !== dashboardRoute ||
                      item.label === "Dashboard")
                      ? "active"
                      : ""
                  }
                  href={itemRoute}
                  onClick={navTo(itemRoute)}
                  key={`${group.heading || "primary"}-${item.label}`}
                >
                  <MiniIcon path={item.icon} />
                  <span>{t(item.label)}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="researcher-sidebar-footer">
        <div className="researcher-footer-actions">
          <a
            href={getAcademicPath("/researcher-profile", role)}
            onClick={navTo(getAcademicPath("/researcher-profile", role))}
            aria-label="Profile"
          >
            <MiniIcon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 18.2a5.7 5.7 0 0 1 10 0" />
            <span>Profile</span>
          </a>
          <button type="button" aria-label="Settings" onClick={onSettings}>
            <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="researcher-logout-button"
            aria-label="Logout"
            onClick={handleLogout}
          >
            <MiniIcon path="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

const proPlanFeatures = [
  "Unlimited tracked keywords",
  "Priority trend alerts",
  "Advanced citation intelligence",
  "Full report export suite",
];

const defaultAcademicWorkspaceSettings = {
  sources: {
    openAlex: true,
    semanticScholar: true,
    crossref: true,
    arxiv: false,
  },
  alerts: {
    trendSpikes: true,
    citationMilestones: true,
    authorUpdates: true,
    journalQuartileChanges: false,
  },
  privacy: {
    publicProfile: true,
    shareReadingSignals: false,
    showInstitutionDashboard: true,
  },
  defaultDiscipline: "Computer Science",
  trendThreshold: "20% weekly growth",
  digestFrequency: "Weekly",
  citationWindow: "Last 12 months",
  graphDensity: "Balanced",
  exportFormat: "PDF + CSV",
};

const getDefaultAcademicWorkspaceSettings = (role = "researcher") => ({
  ...defaultAcademicWorkspaceSettings,
  defaultDiscipline:
    role === "lecturer" ? "AI in Education" : "Computer Science",
});

const mergeAcademicWorkspaceSettings = (saved, role) => {
  const defaults = getDefaultAcademicWorkspaceSettings(role);
  return {
    ...defaults,
    ...(saved || {}),
    sources: {
      ...defaults.sources,
      ...(saved?.sources || {}),
    },
    alerts: {
      ...defaults.alerts,
      ...(saved?.alerts || {}),
    },
    privacy: {
      ...defaults.privacy,
      ...(saved?.privacy || {}),
    },
  };
};

function AcademicSettingsPanel({ open, onClose, role = "researcher" }) {
  const storageKey = `scholartrend.${role}.workspaceSettings`;
  const roleLabel = role === "lecturer" ? "Lecturer" : "Researcher";
  const readSavedSettings = () => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        return mergeAcademicWorkspaceSettings(JSON.parse(saved), role);
      } catch {
        return getDefaultAcademicWorkspaceSettings(role);
      }
    }

    return getDefaultAcademicWorkspaceSettings(role);
  };
  const [settings, setSettings] = React.useState(readSavedSettings);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!open) return undefined;

    setSettings(readSavedSettings());
    setMessage("");

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, role]);

  if (!open) return null;

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateGroupSetting = (group, key, value) => {
    setSettings((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value,
      },
    }));
  };

  const saveSettings = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    setMessage("Settings saved for this browser.");
  };

  const resetSettings = () => {
    const defaults = getDefaultAcademicWorkspaceSettings(role);
    setSettings(defaults);
    window.localStorage.setItem(storageKey, JSON.stringify(defaults));
    setMessage("Settings reset to ScholarTrend defaults.");
  };

  const openProfileNotifications = () => {
    saveSettings();
    onClose();
    goToRoute(getAcademicPath("/researcher-profile", role));
  };

  const sourceOptions = [
    [
      "openAlex",
      "OpenAlex",
      "Works, authors, institutions, and concepts",
      "M4 7.5 12 3l8 4.5-8 4.5L4 7.5ZM4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5",
      "cyan",
    ],
    [
      "semanticScholar",
      "Semantic Scholar",
      "Citation graph and paper similarity",
      "M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10",
      "indigo",
    ],
    [
      "googleScholar",
      "Google Scholar",
      "Scholar results provided through SerpApi",
      "M7 4.5h7l3 3V20H7zM14 4.5V8h3M10 12h4M10 15h6M10 18h3M4 8v12h3",
      "emerald",
    ],
    [
      "researchGate",
      "ResearchGate",
      "Publication pages discovered through Scholar lookup",
      "M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5ZM8.5 10.2l3.5 2 3.5-2M12 12.2v4.3",
      "amber",
    ],
  ];
  const alertOptions = [
    [
      "trendSpikes",
      "Trend spike alerts",
      "Notify when a keyword accelerates beyond your threshold.",
      "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3",
    ],
    [
      "citationMilestones",
      "Citation milestones",
      "Track citation gains on saved and authored papers.",
      "M12 19V5M7 10l5-5 5 5M5 19h14",
    ],
    [
      "authorUpdates",
      "Author updates",
      "Watch followed researchers for new publications.",
      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
    ],
    [
      "journalQuartileChanges",
      "Journal quartile changes",
      "Flag ranking changes for followed journals.",
      "M5 19V5h14v14H5ZM8 15l2.4-2.4 2 1.6L16.5 9M15 9h2v2",
    ],
  ];
  const privacyOptions = [
    [
      "publicProfile",
      "Public academic profile",
      "Allow collaborators to view your research identity.",
      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
    ],
    [
      "shareReadingSignals",
      "Share reading signals",
      "Use saved papers and views to improve recommendations.",
      "M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12ZM12 9v6M9 12h6",
    ],
    [
      "showInstitutionDashboard",
      "Institution dashboard visibility",
      "Include your aggregate activity in department analytics.",
      "M3.5 20h17M5 17V9h4v8M10 17V5h4v12M15 17v-6h4v6",
    ],
  ];

  return (
    <div
      className="academic-settings-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="academic-settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="academic-settings-title"
      >
        <header className="academic-settings-header">
          <div className="academic-settings-title-wrap">
            <i className="academic-settings-hero-icon" aria-hidden="true">
              <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
            </i>
            <div>
              <span>{roleLabel} Workspace</span>
              <h2 id="academic-settings-title">Settings</h2>
              <p>
                Control how ScholarTrend tracks publications, trends, and
                alerts.
              </p>
            </div>
          </div>
          <button type="button" aria-label="Close settings" onClick={onClose}>
            <MiniIcon path="M6 6l12 12M18 6 6 18" />
          </button>
        </header>

        <div className="academic-settings-body">
          <div
            className="academic-settings-summary"
            aria-label="Current settings summary"
          >
            <div>
              <i className="summary-icon teal" aria-hidden="true">
                <MiniIcon path="M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" />
              </i>
              <span>
                <small>Trend threshold</small>
                <strong>{settings.trendThreshold}</strong>
              </span>
            </div>
            <div>
              <i className="summary-icon violet" aria-hidden="true">
                <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
              </i>
              <span>
                <small>Digest</small>
                <strong>{settings.digestFrequency}</strong>
              </span>
            </div>
            <div>
              <i className="summary-icon blue" aria-hidden="true">
                <MiniIcon path="M4 7.5 12 3l8 4.5-8 4.5L4 7.5ZM4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
              </i>
              <span>
                <small>Sources</small>
                <strong>
                  {Object.values(settings.sources).filter(Boolean).length}{" "}
                  active
                </strong>
              </span>
            </div>
          </div>

          <section className="academic-settings-section">
            <div className="academic-settings-section-title">
              <i className="academic-section-icon cyan" aria-hidden="true">
                <MiniIcon path="M4 7.5 12 3l8 4.5-8 4.5L4 7.5ZM4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
              </i>
              <h3>Academic data sources</h3>
            </div>
            <div className="academic-settings-list">
              {sourceOptions.map(([key, label, detail, icon, tone]) => (
                <label className="academic-settings-toggle" key={key}>
                  <span className="academic-toggle-copy">
                    <i
                      className={`academic-toggle-icon ${tone}`}
                      aria-hidden="true"
                    >
                      <MiniIcon path={icon} />
                    </i>
                    <span>
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                  </span>
                  <span className="academic-toggle-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.sources[key])}
                      onChange={(event) =>
                        updateGroupSetting("sources", key, event.target.checked)
                      }
                    />
                    <span className="academic-toggle-track" aria-hidden="true">
                      <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="academic-settings-section">
            <div className="academic-settings-section-title">
              <i className="academic-section-icon emerald" aria-hidden="true">
                <MiniIcon path="M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" />
              </i>
              <h3>Trend and citation alerts</h3>
            </div>
            <div className="academic-settings-grid">
              <label>
                <span>Default discipline</span>
                <select
                  value={settings.defaultDiscipline}
                  onChange={(event) =>
                    updateSetting("defaultDiscipline", event.target.value)
                  }
                >
                  <option>Computer Science</option>
                  <option>AI in Education</option>
                  <option>Biomedical Science</option>
                  <option>Environmental Science</option>
                  <option>Business Analytics</option>
                </select>
              </label>
              <label>
                <span>Trend threshold</span>
                <select
                  value={settings.trendThreshold}
                  onChange={(event) =>
                    updateSetting("trendThreshold", event.target.value)
                  }
                >
                  <option>10% weekly growth</option>
                  <option>20% weekly growth</option>
                  <option>35% weekly growth</option>
                  <option>Top 5% topic momentum</option>
                </select>
              </label>
              <label>
                <span>Citation window</span>
                <select
                  value={settings.citationWindow}
                  onChange={(event) =>
                    updateSetting("citationWindow", event.target.value)
                  }
                >
                  <option>Last 30 days</option>
                  <option>Last 6 months</option>
                  <option>Last 12 months</option>
                  <option>All time</option>
                </select>
              </label>
              <label>
                <span>Digest frequency</span>
                <select
                  value={settings.digestFrequency}
                  onChange={(event) =>
                    updateSetting("digestFrequency", event.target.value)
                  }
                >
                  <option>Real time</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </label>
            </div>
            <div className="academic-settings-list">
              {alertOptions.map(([key, label, detail, icon]) => (
                <label className="academic-settings-toggle" key={key}>
                  <span className="academic-toggle-copy">
                    <i className="academic-toggle-icon rose" aria-hidden="true">
                      <MiniIcon path={icon} />
                    </i>
                    <span>
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                  </span>
                  <span className="academic-toggle-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.alerts[key])}
                      onChange={(event) =>
                        updateGroupSetting("alerts", key, event.target.checked)
                      }
                    />
                    <span className="academic-toggle-track" aria-hidden="true">
                      <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="academic-settings-section">
            <div className="academic-settings-section-title">
              <i className="academic-section-icon violet" aria-hidden="true">
                <MiniIcon path="M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10" />
              </i>
              <h3>Workspace output</h3>
            </div>
            <div className="academic-settings-grid">
              <label>
                <span>Knowledge graph density</span>
                <select
                  value={settings.graphDensity}
                  onChange={(event) =>
                    updateSetting("graphDensity", event.target.value)
                  }
                >
                  <option>Compact</option>
                  <option>Balanced</option>
                  <option>Expanded</option>
                </select>
              </label>
              <label>
                <span>Default report export</span>
                <select
                  value={settings.exportFormat}
                  onChange={(event) =>
                    updateSetting("exportFormat", event.target.value)
                  }
                >
                  <option>PDF</option>
                  <option>CSV</option>
                  <option>PDF + CSV</option>
                  <option>BibTeX + RIS</option>
                </select>
              </label>
            </div>
          </section>

          <section className="academic-settings-section">
            <div className="academic-settings-section-title">
              <i className="academic-section-icon slate" aria-hidden="true">
                <MiniIcon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              </i>
              <h3>Privacy and institution sharing</h3>
            </div>
            <div className="academic-settings-list">
              {privacyOptions.map(([key, label, detail, icon]) => (
                <label className="academic-settings-toggle" key={key}>
                  <span className="academic-toggle-copy">
                    <i
                      className="academic-toggle-icon slate"
                      aria-hidden="true"
                    >
                      <MiniIcon path={icon} />
                    </i>
                    <span>
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                  </span>
                  <span className="academic-toggle-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.privacy[key])}
                      onChange={(event) =>
                        updateGroupSetting("privacy", key, event.target.checked)
                      }
                    />
                    <span className="academic-toggle-track" aria-hidden="true">
                      <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <footer className="academic-settings-footer">
          <button
            type="button"
            className="settings-secondary"
            onClick={resetSettings}
          >
            Reset
          </button>
          <button
            type="button"
            className="settings-secondary"
            onClick={openProfileNotifications}
          >
            Profile settings
          </button>
          <button
            type="button"
            className="settings-primary"
            onClick={saveSettings}
          >
            Save Settings
          </button>
          {message ? <p role="status">{message}</p> : null}
        </footer>
      </section>
    </div>
  );
}

function useResearcherSidebarControls() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleMenu = React.useCallback(() => {
    if (window.matchMedia("(max-width: 820px)").matches) {
      setMobileOpen(true);
    } else {
      setCollapsed((value) => !value);
    }
  }, []);

  return {
    collapsed,
    mobileOpen,
    closeMobile: () => setMobileOpen(false),
    handleMenu,
    toggleCollapse: () => setCollapsed((value) => !value),
  };
}

function ResearcherTopbar({
  current = "Dashboard",
  onMenuClick,
  onOpenSettings,
  rootLabel = "ScholarTrend",
  rootPath = "/",
  searchPlaceholder = "Search publications, authors, keywords...",
  avatarUrl = "",
}) {
  return (
    <header className="researcher-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <nav className="researcher-breadcrumb" aria-label="Breadcrumb">
        <a href={rootPath} onClick={navTo(rootPath)}>
          {rootLabel}
        </a>
        <span>&gt;</span>
        <strong>{current}</strong>
      </nav>

      <div className="researcher-top-actions">
        <form
          className="researcher-search"
          onSubmit={navTo("/researcher-search")}
        >
          <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
          <input type="search" placeholder={searchPlaceholder} />
        </form>
        <button
          type="button"
          className="researcher-top-icon alert-dot"
          aria-label="Notifications"
          onClick={navTo("/researcher-notifications")}
        >
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2" />
        </button>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
        <button
          type="button"
          className="researcher-avatar"
          aria-label="User profile"
          onClick={navTo("/researcher-profile")}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Researcher profile" />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Researcher profile"
            />
          )}
        </button>
      </div>
    </header>
  );
}

function LecturerTopbar({ onMenuClick, onOpenSettings }) {
  return (
    <header className="researcher-topbar lecturer-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>

      <strong className="lecturer-topbar-title">Dashboard</strong>

      <form
        className="researcher-search lecturer-global-search"
        onSubmit={navTo("/lecturer-search")}
      >
        <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
        <input
          type="search"
          placeholder="Search keywords, reports, or users..."
          aria-label="Search Lecturer workspace"
        />
      </form>

      <div className="researcher-top-actions lecturer-top-actions">
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Notifications"
          onClick={navTo("/lecturer-notifications")}
        >
          <MiniIcon path="M18 16.5H6l1.5-2.2V10a4.5 4.5 0 0 1 9 0v4.3L18 16.5ZM10 19h4M17.5 5.5l1.7-1.7M6.5 5.5 4.8 3.8" />
        </button>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <MiniIcon path="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM12 3.5v2M12 18.5v2M4.6 7.8l1.7 1M17.7 15.2l1.7 1M4.6 16.2l1.7-1M17.7 8.8l1.7-1M3.5 12h2M18.5 12h2" />
        </button>
        <button
          type="button"
          className="researcher-avatar lecturer-avatar"
          aria-label="Lecturer profile"
          onClick={navTo("/lecturer-profile")}
        >
          <span>AT</span>
        </button>
      </div>
    </header>
  );
}

function ResearcherShell({
  activeRoute = "/researcher-dashboard",
  current = "Dashboard",
  topbar = "default",
  pageClassName = "",
  mainClassName = "",
  breadcrumbRootLabel,
  breadcrumbRootPath,
  searchPlaceholder,
  profileAvatarUrl = "",
  children,
}) {
  const sidebar = useResearcherSidebarControls();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const academicRole = getAcademicRole();
  const isLecturer = academicRole === "lecturer";
  const resolvedActiveRoute = getAcademicPath(activeRoute, academicRole);
  const TopbarComponent =
    topbar === "lecturer" ? (
      <LecturerTopbar
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    ) : topbar === "list" ? (
      <ResearcherListTopbar
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    ) : topbar === "graph" ? (
      <ResearcherSearchTopbar
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    ) : topbar === "publication" ? (
      <ResearcherPublicationTopbar
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    ) : (
      <ResearcherTopbar
        current={current}
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
        rootLabel={breadcrumbRootLabel}
        rootPath={breadcrumbRootPath}
        searchPlaceholder={searchPlaceholder}
        avatarUrl={profileAvatarUrl}
      />
    );

  return (
    <main
      className={`researcher-app ${isLecturer ? "lecturer-app" : ""} ${pageClassName} ${sidebar.collapsed ? "sidebar-collapsed" : ""} ${sidebar.mobileOpen ? "sidebar-mobile-open" : ""}`}
    >
      <button
        type="button"
        className="researcher-sidebar-backdrop"
        aria-label="Close navigation"
        onClick={sidebar.closeMobile}
      ></button>
      <ResearcherSidebar
        activeRoute={resolvedActiveRoute}
        role={academicRole}
        collapsed={sidebar.collapsed}
        mobileOpen={sidebar.mobileOpen}
        onClose={sidebar.closeMobile}
        onToggleCollapse={sidebar.toggleCollapse}
        onSettings={() => setSettingsOpen(true)}
      />
      <AcademicSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        role={academicRole}
      />
      <section className={`researcher-main ${mainClassName}`}>
        {TopbarComponent}
        {children}
      </section>
    </main>
  );
}

function ResearcherStatCard({ stat }) {
  return (
    <article className={`researcher-stat ${stat.tone}`}>
      <div className="researcher-stat-label">
        <span>{stat.label}</span>
        <MiniIcon path={stat.icon} />
      </div>
      <strong>{stat.value}</strong>
      <p>{stat.note}</p>
    </article>
  );
}

function PublicationGrowthChart({ data = publicationGrowthData }) {
  const mappedChartData = Array.isArray(data)
    ? data.map((item) => ({
        year: item.year || "N/A",
        publications: Number(item.publications || 0),
      }))
    : [];
  const chartData = mappedChartData.length
    ? mappedChartData
    : publicationGrowthData;
  const [activeIndex, setActiveIndex] = React.useState(chartData.length - 1);
  React.useEffect(() => {
    setActiveIndex(chartData.length - 1);
  }, [chartData.length]);
  const chartWidth = 720;
  const chartHeight = 430;
  const padding = { top: 28, right: 34, bottom: 54, left: 68 };
  const rawMaxValue = Math.max(
    1,
    ...chartData.map((item) => item.publications),
  );
  const maxValue =
    rawMaxValue <= 4
      ? 4
      : rawMaxValue <= 10
        ? 10
        : rawMaxValue <= 100
          ? Math.ceil(rawMaxValue / 10) * 10
          : rawMaxValue <= 1000
            ? Math.ceil(rawMaxValue / 100) * 100
            : rawMaxValue <= 10000
              ? Math.ceil(rawMaxValue / 1000) * 1000
              : Math.ceil(rawMaxValue / 10000) * 10000;
  const yTicks =
    maxValue <= 10
      ? Array.from(
          { length: maxValue / (maxValue <= 4 ? 1 : 2) + 1 },
          (_, index) => index * (maxValue <= 4 ? 1 : 2),
        )
      : [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const bottom = chartHeight - padding.bottom;
  const formatCount = (value) => {
    if (value === 0) return "0";
    if (value < 1000) return `${value}`;
    return `${Math.round(value / 1000)}k`;
  };
  const formatFullCount = (value) =>
    new Intl.NumberFormat("en-US").format(value);
  const getX = (index) =>
    padding.left + (index / Math.max(chartData.length - 1, 1)) * plotWidth;
  const getY = (value) => padding.top + (1 - value / maxValue) * plotHeight;
  const points = chartData.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.publications),
  }));
  if (!points.length) {
    return null;
  }
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), points.length - 1);
  const activePoint = points[safeActiveIndex] || points[points.length - 1];
  const previousPoint = points[safeActiveIndex - 1];
  const activeDelta = previousPoint?.publications
    ? ((activePoint.publications - previousPoint.publications) /
        previousPoint.publications) *
      100
    : 0;
  const latestPoint = points[points.length - 1];
  const previousYear = points[points.length - 2];
  const yearlyGrowth = previousYear?.publications
    ? ((latestPoint.publications - previousYear.publications) /
        previousYear.publications) *
      100
    : 0;
  const tooltipTransform =
    activePoint.x < 130
      ? "translate(0, -112%)"
      : activePoint.x > chartWidth - 130
        ? "translate(-100%, -112%)"
        : "translate(-50%, -112%)";

  return (
    <section
      className="researcher-chart-card"
      aria-label="Publication growth over time"
    >
      <div className="researcher-card-heading">
        <div>
          <h2>Publication Growth Over Time</h2>
          <p>10-year trend analysis across indexed databases</p>
        </div>
        <button type="button" aria-label="Chart options">
          <MiniIcon path="M12 5.5h.01M12 12h.01M12 18.5h.01" />
        </button>
      </div>

      <div
        className="chart-summary"
        aria-label="Current publication growth summary"
      >
        <span>
          <strong>{formatFullCount(latestPoint.publications)}</strong>{" "}
          publications in {latestPoint.year}
        </span>
        <span className={yearlyGrowth >= 0 ? "positive" : "danger"}>
          {yearlyGrowth >= 0 ? "+" : ""}
          {yearlyGrowth.toFixed(1)}% YoY
        </span>
      </div>

      <div className="growth-chart">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-labelledby="growthChartTitle"
        >
          <title id="growthChartTitle">
            Publication growth chart from {points[0].year} to{" "}
            {points[points.length - 1].year} based on yearly publication counts.
          </title>
          <defs>
            <linearGradient id="growthArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g className="chart-grid">
            {yTicks.map((tick) => (
              <path
                key={tick}
                d={`M${padding.left} ${getY(tick)}H${chartWidth - padding.right}`}
              />
            ))}
          </g>
          <path
            className="chart-axis-line"
            d={`M${padding.left} ${bottom}H${chartWidth - padding.right}`}
          />
          <g className="chart-axis-labels y-labels">
            {yTicks.map((tick) => (
              <text
                key={tick}
                x={padding.left - 18}
                y={getY(tick) + 4}
                textAnchor="end"
              >
                {formatCount(tick)}
              </text>
            ))}
          </g>
          <g className="chart-axis-labels x-labels">
            {points.map((point, index) =>
              index % 2 === 0 || index === points.length - 1 ? (
                <text
                  key={point.year}
                  x={point.x}
                  y={chartHeight - 18}
                  textAnchor="middle"
                >
                  {point.year}
                </text>
              ) : null,
            )}
          </g>

          <path className="chart-area" d={areaPath} />
          <path className="chart-line" d={linePath} />
          <path
            className="chart-active-line"
            d={`M${activePoint.x} ${padding.top}V${bottom}`}
          />

          {points.map((point, index) => (
            <g
              className={`chart-point-group ${index === safeActiveIndex ? "active" : ""}`}
              key={point.year}
              tabIndex="0"
              role="button"
              aria-label={`${point.year}: ${formatFullCount(point.publications)} publications`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <circle
                className="chart-hit-area"
                cx={point.x}
                cy={point.y}
                r="16"
              />
              <circle
                className="chart-point"
                cx={point.x}
                cy={point.y}
                r={index === safeActiveIndex ? "5" : "4"}
              />
            </g>
          ))}
        </svg>

        <div
          className="chart-tooltip"
          style={{
            left: `${(activePoint.x / chartWidth) * 100}%`,
            top: `${(activePoint.y / chartHeight) * 100}%`,
            transform: tooltipTransform,
          }}
        >
          <span>{activePoint.year}</span>
          <strong>{formatFullCount(activePoint.publications)}</strong>
          <em className={activeDelta >= 0 ? "positive" : "danger"}>
            {previousPoint
              ? `${activeDelta >= 0 ? "+" : ""}${activeDelta.toFixed(1)}% vs previous year`
              : "Baseline year"}
          </em>
        </div>
      </div>
    </section>
  );
}

function TrendingKeywordsCard({ keywords = researcherKeywords }) {
  return (
    <section className="researcher-side-card">
      <div className="researcher-card-heading compact">
        <div>
          <h2>Trending Keywords</h2>
          <p>Fastest growing terms in last 30 days</p>
        </div>
      </div>
      <div className="keyword-bars">
        {keywords.map((keyword, index) => (
          <div className="keyword-bar-row" key={keyword.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="keyword-bar-track">
              <i style={{ width: keyword.width }}></i>
              <strong>{keyword.label}</strong>
            </div>
            <em>{keyword.percent}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResearchDomainsCard() {
  return (
    <section className="researcher-side-card domain-card">
      <div className="researcher-card-heading compact">
        <div>
          <h2>Top Research Domains</h2>
          <p>Volume distribution</p>
        </div>
      </div>
      <div
        className="domain-donut"
        aria-label="Medicine 40%, Engineering 30%, Biology 20%"
      >
        <span>Total</span>
      </div>
      <div className="domain-legend">
        {researcherDomains.map((domain) => (
          <span key={domain.label}>
            <i style={{ background: domain.color }}></i>
            {domain.label} ({domain.value})
          </span>
        ))}
      </div>
    </section>
  );
}

function RecentlyPublishedCard({ publications = [] }) {
  const recentPublications = publications.slice(0, 4);

  return (
    <section className="researcher-side-card recently-published-card">
      <div className="researcher-card-heading compact">
        <div>
          <h2>Recently Published</h2>
          <p>Approved papers now visible to all academic users</p>
        </div>
      </div>
      <div className="recently-published-list">
        {recentPublications.length ? (
          recentPublications.map((paper) => {
            const detailPath = `/researcher-publication?id=${encodeURIComponent(
              paper.id,
            )}`;
            const authors = Array.isArray(paper.authors)
              ? paper.authors.join(", ")
              : paper.authors || "Unknown authors";
            return (
              <a href={detailPath} onClick={navTo(detailPath)} key={paper.id}>
                <strong>{paper.title}</strong>
                <span>
                  {authors} | {paper.year || "N/A"}
                </span>
              </a>
            );
          })
        ) : (
          <p>No approved publications yet.</p>
        )}
      </div>
    </section>
  );
}

const lecturerStats = [
  {
    label: "My Bookmarks",
    value: "1,284",
    badge: "+12%",
    tone: "blue",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z",
  },
  {
    label: "Followed Keywords",
    value: "42",
    badge: "+4%",
    tone: "purple",
    icon: "M12 4a8 8 0 1 0 8 8M12 7a5 5 0 1 0 5 5M12 10a2 2 0 1 0 2 2",
  },
  {
    label: "Alerts",
    value: "7 Unread",
    badge: "New",
    tone: "slate",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M7 4.5 5.5 6M17 4.5 18.5 6",
  },
  {
    label: "Research Pulse",
    value: "High Activity",
    tone: "green",
    icon: "M4 12h3l2-4 3.2 8 2.4-5H20M5 5.5h14v13H5z",
  },
];

const lecturerTrendingKeywords = [
  { label: "Neural Networks", value: 85 },
  { label: "Quantum Comp", value: 72 },
  { label: "CRISPR", value: 64 },
  { label: "Machine Learning", value: 58 },
  { label: "Climate Models", value: 45 },
];

const lecturerFieldPublications = [
  {
    title: "Advancements in Generative AI for Academic Synthesis",
    authors: "Smith, J., Doe, A. et al.",
    journal: "Journal of Data Science",
    date: "Oct 2023",
    citations: 124,
  },
  {
    title: "Evaluating Deep Learning Models in Predictive Analytics",
    authors: "Wang, L., Chen, H.",
    journal: "IEEE Transactions",
    date: "Sep 2023",
    citations: 89,
  },
  {
    title: "Sustainable Methodologies in Computational Research",
    authors: "Green, R.",
    journal: "Nature Computational Science",
  },
];

function LecturerStatCard({ stat }) {
  return (
    <article className={`lecturer-stat-card ${stat.tone}`}>
      <div className="lecturer-stat-topline">
        <span className="lecturer-stat-icon">
          <MiniIcon path={stat.icon} />
        </span>
        {stat.badge ? <em>{stat.badge}</em> : null}
      </div>
      <span className="lecturer-stat-label">{stat.label}</span>
      <strong>{stat.value}</strong>
    </article>
  );
}

function LecturerTrendingCard() {
  return (
    <section className="lecturer-dashboard-card lecturer-trending-card">
      <div className="lecturer-card-heading lecturer-trending-heading">
        <span className="lecturer-heading-icon">
          <MiniIcon path="M4 17 9 11l3 3 8-9" />
        </span>
        <h2>Top 5 Trending Keywords</h2>
        <a
          href="/lecturer-trend-tracking"
          onClick={navTo("/lecturer-trend-tracking")}
        >
          Full Trend Tracking
        </a>
        <MiniIcon path="M9 6l6 6-6 6" />
      </div>

      <div className="lecturer-keyword-list">
        {lecturerTrendingKeywords.map((keyword) => (
          <div className="lecturer-keyword-row" key={keyword.label}>
            <strong>{keyword.label}</strong>
            <span className="lecturer-keyword-track" aria-hidden="true">
              <i style={{ width: `${keyword.value}%` }}></i>
            </span>
            <em>{keyword.value}%</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function LecturerPublicationsCard({ publishedPublications = [] }) {
  const { data: backendFieldPublications } = useApiResource(
    "/api/publications/search?keyword=AI%20in%20Education&page=1&pageSize=5&sortBy=year",
    [],
    { select: (payload) => unwrapList(payload).map(mapPublicationForCard) },
  );
  const publicationsForUi = [
    ...publishedPublications.map((paper) => ({
      id: paper.id,
      title: paper.title,
      authors: Array.isArray(paper.authors)
        ? paper.authors.join(", ")
        : paper.authors || "Unknown authors",
      journal: paper.journalName || "ScholarTrend Published",
      date: paper.year || "Published",
      citations: formatCount(paper.citationCount || 0),
      published: true,
    })),
    ...backendFieldPublications.map((paper) => ({
      id: paper.id,
      title: paper.title,
      authors: paper.authors || "Unknown authors",
      journal: paper.source || "Scientific Journal",
      date: paper.year || "N/A",
      citations: paper.citations,
      published: isBackendNumericId(paper.id),
    })),
    ...lecturerFieldPublications,
  ].filter((paper, index, list) => {
    const key = String(paper.id || paper.title).toLowerCase();
    return (
      list.findIndex(
        (item) => String(item.id || item.title).toLowerCase() === key,
      ) === index
    );
  });

  return (
    <section className="lecturer-dashboard-card lecturer-publications-card">
      <div className="lecturer-card-heading lecturer-publications-heading">
        <MiniIcon path="M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4" />
        <h2>Publications in your field</h2>
        <button type="button" aria-label="Publication options">
          <MiniIcon path="M12 5.5h.01M12 12h.01M12 18.5h.01" />
        </button>
      </div>

      <div className="lecturer-publication-list">
        {publicationsForUi.map((publication) => {
          const detailPath = publication.published
            ? `/lecturer-publication?id=${encodeURIComponent(publication.id)}`
            : "/lecturer-publication";
          return (
            <a
              className="lecturer-publication-item"
              href={detailPath}
              onClick={navTo(detailPath)}
              key={publication.title}
            >
              <span className="lecturer-pdf-tile">PDF</span>
              <span className="lecturer-publication-copy">
                <strong>{publication.title}</strong>
                <small>
                  {publication.authors} <i>-</i> {publication.journal}
                </small>
                {publication.date ? (
                  <em>
                    <span>{publication.date}</span>
                    <span>{publication.citations} Citations</span>
                  </em>
                ) : null}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function LecturerDashboard() {
  const [exported, setExported] = React.useState(false);
  const session = getCurrentAccountPlan();
  const displayName = getSessionDisplayName(session, "Lecturer");
  const displayRole = normalizeRoleForUi(session.role || "Lecturer");
  const publishedPublications = React.useMemo(
    () => getPublishedPublications(),
    [],
  );

  return (
    <ResearcherShell
      activeRoute="/lecturer-dashboard"
      topbar="lecturer"
      pageClassName="lecturer-dashboard-page"
      mainClassName="lecturer-dashboard-main"
    >
      <div className="lecturer-dashboard-content">
        <div className="lecturer-welcome-row">
          <div>
            <div className="lecturer-title-row">
              <h1>Welcome back, {displayName}</h1>
              <span>{displayRole}</span>
            </div>
            <p>
              Here is the latest analytical intelligence for your tracked
              disciplines.
            </p>
          </div>
          <button
            type="button"
            className="lecturer-export-button"
            onClick={() => setExported(true)}
          >
            <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
            {exported ? "Report Exported" : "Export Report"}
          </button>
        </div>

        <section className="lecturer-stat-grid" aria-label="Lecturer metrics">
          {lecturerStats.map((stat) => (
            <LecturerStatCard stat={stat} key={stat.label} />
          ))}
        </section>

        <div className="lecturer-dashboard-grid">
          <LecturerTrendingCard />
          <LecturerPublicationsCard
            publishedPublications={publishedPublications}
          />
        </div>
      </div>
    </ResearcherShell>
  );
}

function ResearcherDashboard() {
  const { data: statsData } = useApiResource("/api/dashboard/stats", null);
  const publishedPublications = React.useMemo(
    () => getPublishedPublications(),
    [],
  );
  const { data: growthData } = useApiResource(
    "/api/dashboard/growth",
    publicationGrowthData,
    {
      select: (payload) => {
        const mapped = unwrapList(payload).map((item) => ({
          year: item.year || item.Year,
          publications: item.count || item.Count || 0,
        }));
        return mapped.length ? mapped : publicationGrowthData;
      },
    },
  );
  const { data: keywordData } = useApiResource(
    "/api/trends/top-keywords?count=5",
    researcherKeywords,
    {
      select: (payload) => {
        const mapped = unwrapList(payload).map((item) => ({
          label: item.keyword,
          percent: `${Number(item.trendingScore || 0).toFixed(1)}%`,
          width: `${Math.max(12, Math.min(100, Number(item.trendingScore || 0)))}%`,
        }));
        return mapped.length ? mapped : researcherKeywords;
      },
    },
  );
  const dashboardStats = React.useMemo(() => {
    if (!statsData) return researcherStats;
    return researcherStats.map((stat) => {
      if (stat.label === "admin.totalPublications") {
        return { ...stat, value: formatCount(statsData.totalPublications) };
      }
      if (stat.label === "New This Week") {
        return {
          ...stat,
          value: formatCount(statsData.totalKeywords),
          note: "Tracked keywords",
        };
      }
      return stat;
    });
  }, [statsData]);

  return (
    <ResearcherShell activeRoute="/researcher-dashboard" current="Dashboard">
      <div className="researcher-content">
        <div className="researcher-intro-row">
          <p>Here's your latest academic intelligence overview.</p>
          <button type="button" className="researcher-date-filter">
            <MiniIcon path="M7 7h10M9 12h6M11 17h2" />
            Last 30 Days
          </button>
        </div>

        <section className="researcher-stats" aria-label="Researcher metrics">
          {dashboardStats.map((stat) => (
            <ResearcherStatCard stat={stat} key={stat.label} />
          ))}
        </section>

        <div className="researcher-dashboard-grid">
          <PublicationGrowthChart data={growthData} />
          <aside className="researcher-side-column">
            <TrendingKeywordsCard keywords={keywordData} />
            <RecentlyPublishedCard publications={publishedPublications} />
            <ResearchDomainsCard />
          </aside>
        </div>
      </div>

      <button
        type="button"
        className="researcher-download"
        aria-label="Download report"
      >
        <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
      </button>
    </ResearcherShell>
  );
}

function TrendMetricCard({ card }) {
  return (
    <article className={`trend-metric-card ${card.tone}`}>
      <div className="trend-card-label">
        <span>{card.label}</span>
        {card.sublabel ? <em>{card.sublabel}</em> : null}
        <MiniIcon path={card.icon} />
      </div>
      <div className="trend-card-value-row">
        <strong>{card.value}</strong>
        {card.note ? <small>{card.note}</small> : null}
      </div>
      {card.bars ? (
        <div className="trend-mini-bars" aria-hidden="true">
          {card.bars.map((height, index) => (
            <i
              style={{ height: `${height}%` }}
              key={`${card.label}-${index}`}
            ></i>
          ))}
        </div>
      ) : (
        <div className="trend-score-track" aria-hidden="true">
          <i style={{ width: `${card.score}%` }}></i>
        </div>
      )}
    </article>
  );
}

function TrendKeywordsOverview() {
  const { data: overviewKeywords } = useApiResource(
    "/api/trends/top-keywords?count=8",
    trendKeywordOverview,
    {
      select: (payload) =>
        unwrapList(payload).map((item, index) => ({
          keyword: item.keyword,
          category: "Backend trend",
          mentions: formatCount(item.totalCount),
          change: Number(item.trendingScore || 0).toFixed(1),
          tone: "up",
          selected: index === 0,
        })),
    },
  );
  return (
    <section
      className="trend-keywords-overview"
      aria-label="Top keywords overview"
    >
      <div className="trend-overview-heading">
        <div>
          <span>Dashboard&nbsp; &gt;&nbsp; Trending Keywords</span>
          <h2>Top Keywords Overview</h2>
        </div>
        <div
          className="trend-sort-toggle"
          aria-label="Keyword ranking strategy"
        >
          <button type="button" className="active">
            By Count
          </button>
          <button type="button">By Growth</button>
        </div>
      </div>

      <div className="trend-topic-filters" aria-label="Topic filters">
        {trendTopicFilters.map((filter, index) => (
          <button
            type="button"
            className={index === 0 ? "active" : ""}
            key={filter}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="trend-keyword-card-grid">
        {overviewKeywords.map((keyword) => (
          <article
            className={`trend-keyword-card ${keyword.selected ? "selected" : ""}`}
            key={keyword.keyword}
          >
            <div className="trend-keyword-topline">
              <div>
                <h3>{keyword.keyword}</h3>
                <span>{keyword.category}</span>
              </div>
              <button
                type="button"
                aria-label={
                  keyword.selected
                    ? `Selected ${keyword.keyword}`
                    : `Add ${keyword.keyword}`
                }
                onClick={navTo("/researcher-trend-tracking")}
              >
                {keyword.selected ? (
                  <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                ) : (
                  "+"
                )}
              </button>
            </div>
            <div className="trend-keyword-bottomline">
              <div>
                <strong>{keyword.mentions}</strong>
                <span>Mentions</span>
              </div>
              <em className={keyword.tone}>
                {keyword.tone === "up" ? (
                  <MiniIcon path="M12 19V5M7 10l5-5 5 5" />
                ) : (
                  <MiniIcon path="M12 5v14M7 14l5 5 5-5" />
                )}
                {keyword.change}
              </em>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendMainChart({
  dateRange = "Last 5 Years (2019-2023)",
  keyword = "Machine Learning",
  comparisonKeyword = "",
}) {
  // Parse date range to get fromYear and toYear
  const yearMatch = dateRange.match(/(\d{4})-(\d{4})/);
  const fromYear = yearMatch ? yearMatch[1] : "2019";
  const toYear = yearMatch ? yearMatch[2] : "2023";
  const encodedKeyword = encodeURIComponent(keyword || "Machine Learning");

  const { data: backendTrendData } = useApiResource(
    `/api/trends?keyword=${encodedKeyword}&fromYear=${fromYear}&toYear=${toYear}&strategy=StrategyA_RawCount`,
    [],
    { select: unwrapList },
  );
  const encodedComparisonKeyword = encodeURIComponent(comparisonKeyword);
  const { data: backendComparisonData } = useApiResource(
    comparisonKeyword
      ? `/api/trends?keyword=${encodedComparisonKeyword}&fromYear=${fromYear}&toYear=${toYear}&strategy=StrategyA_RawCount`
      : null,
    [],
    { select: unwrapList },
  );

  const aggregateTrendRows = (items) =>
    items.reduce((rowsByYear, item) => {
      const year = Number(item.year || item.Year);
      const value = Number(item.publicationCount ?? item.PublicationCount ?? 0);
      const minYear = Number(fromYear);
      const maxYear = Number(toYear);
      if (year < minYear || year > maxYear || value < 0) return rowsByYear;
      rowsByYear[year] = {
        year: String(year),
        value: (rowsByYear[year]?.value || 0) + value,
      };
      return rowsByYear;
    }, {});
  const backendRowsByYear = aggregateTrendRows(backendTrendData);
  const comparisonRowsByYear = aggregateTrendRows(backendComparisonData);

  // Get number of years to display based on date range
  const yearCount = Number(toYear) - Number(fromYear) + 1;

  const fallbackRowsByYear = Object.fromEntries(
    trendLineData.map((item) => [Number(item.year), item.value]),
  );
  const chartRows = Array.from({ length: yearCount }, (_, index) => {
    const year = Number(fromYear) + index;
    return {
      year: String(year),
      value:
        backendRowsByYear[year]?.value ?? fallbackRowsByYear[year] ?? 0,
    };
  });
  const labels = chartRows.map((item) => item.year);
  const values = chartRows.map((item) => item.value);
  const comparisonValues = comparisonKeyword
    ? chartRows.map(
        (item) => comparisonRowsByYear[Number(item.year)]?.value ?? 0,
      )
    : values.map((value, index) =>
        Math.max(0, Math.round(index ? values[index - 1] : value * 0.88)),
      );
  const maxChartValue = Math.max(...values, ...comparisonValues, 1);
  const trendAxisMax = Math.max(4, Math.ceil(maxChartValue * 1.12));
  const trendStepSize = Math.max(1, Math.ceil(trendAxisMax / 5));

  return (
    <section
      className="trend-panel trend-chart-panel"
      aria-label="Publication trend over time"
    >
      <div className="trend-tabs">
        <button type="button" className="active">
          Publications Over Time
        </button>
        <button type="button">Distribution by Journal</button>
      </div>
      <div
        className="trend-chart-wrap"
        style={{ height: "400px", padding: "20px" }}
      >
        <Line
          data={{
            labels,
            datasets: [
              {
                label: keyword || "Machine Learning",
                data: values,
                borderColor: "rgba(99, 102, 241, 1)",
                backgroundColor: "rgba(99, 102, 241, 0.13)",
                tension: 0.32,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 9,
                pointBackgroundColor: "rgba(99, 102, 241, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointHoverBackgroundColor: "rgba(99, 102, 241, 1)",
                pointHoverBorderColor: "#fff",
                borderWidth: 3,
              },
              {
                label: comparisonKeyword || "Previous Year",
                data: comparisonValues,
                borderColor: "rgba(156, 163, 175, 0.62)",
                backgroundColor: "rgba(156, 163, 175, 0)",
                tension: 0.32,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: "rgba(156, 163, 175, 0.62)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                borderWidth: 2,
                borderDash: [5, 5],
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
                align: "end",
                labels: {
                  usePointStyle: true,
                  boxWidth: 10,
                  boxHeight: 10,
                  padding: 18,
                  color: "#4b5563",
                  font: {
                    size: 13,
                  },
                },
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                titleFont: {
                  size: 14,
                  weight: "bold",
                },
                bodyFont: {
                  size: 13,
                },
                callbacks: {
                  label: function (context) {
                    return (
                      context.dataset.label +
                      ": " +
                      context.parsed.y.toLocaleString() +
                      " publications"
                    );
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                min: 0,
                max: trendAxisMax,
                grid: {
                  color: "rgba(0, 0, 0, 0.06)",
                  drawBorder: false,
                },
                ticks: {
                  font: {
                    size: 12,
                  },
                  callback: function (value) {
                    if (value >= 1000000) {
                      return Math.round(value / 100000) / 10 + "M";
                    } else if (value >= 1000) {
                      return Math.round(value / 100) / 10 + "k";
                    }
                    return value;
                  },
                  stepSize: trendStepSize,
                },
                border: {
                  display: false,
                },
              },
              x: {
                grid: {
                  display: false,
                  drawBorder: false,
                },
                ticks: {
                  color: "#5f6674",
                  font: {
                    size: 13,
                  },
                },
                border: {
                  display: false,
                },
              },
            },
          }}
        />
      </div>
    </section>
  );
}

function TrendSparkline({ values }) {
  return (
    <span className="trend-sparkline" aria-hidden="true">
      {values.map((height, index) => (
        <i style={{ height: `${height}%` }} key={index}></i>
      ))}
    </span>
  );
}

function TrendRankingTables() {
  const { data: backendTopKeywords } = useApiResource(
    "/api/trends/top-keywords?count=10",
    [],
    { select: unwrapList },
  );
  const rankingRows = backendTopKeywords.length
    ? backendTopKeywords.map((item, index) => {
        const score = Number(item.trendingScore ?? item.TrendingScore ?? 0);
        return {
          keyword: item.keyword || item.Keyword || `Keyword ${index + 1}`,
          count: Number(item.totalCount ?? item.TotalCount ?? 0).toLocaleString(
            "en-US",
          ),
          growth: `${score.toFixed(1)}%`,
          values: [
            Math.max(12, Math.min(95, score * 0.45 + 18)),
            Math.max(12, Math.min(95, score * 0.55 + 20)),
            Math.max(12, Math.min(95, score * 0.65 + 22)),
            Math.max(12, Math.min(95, score * 0.75 + 24)),
            Math.max(12, Math.min(95, score * 0.85 + 26)),
          ],
        };
      })
    : trendTopRaw;
  const growthRows = backendTopKeywords.length
    ? [...rankingRows].sort(
        (left, right) =>
          Number.parseFloat(right.growth) - Number.parseFloat(left.growth),
      )
    : trendTopGrowth;
  const exportRankingRows = () => {
    downloadCsvFile("scholartrend-top-keywords-raw-count.csv", [
      ["Rank", "Keyword", "Count", "Trend 5y"],
      ...rankingRows.map((row, index) => [
        index + 1,
        row.keyword,
        row.count,
        Array.isArray(row.values) ? row.values.join(" | ") : "",
      ]),
    ]);
  };
  const exportGrowthRows = () => {
    downloadCsvFile("scholartrend-top-keywords-growth-rate.csv", [
      ["Rank", "Keyword", "Growth %"],
      ...growthRows.map((row, index) => [index + 1, row.keyword, row.growth]),
    ]);
  };

  return (
    <div className="trend-ranking-grid">
      <section className="trend-panel trend-table-card">
        <div className="trend-table-heading">
          <h2>
            <MiniIcon path="M5 7h14M5 12h14M5 17h14" /> Top 10 by Raw Count
            (Strategy A)
          </h2>
          <button type="button" onClick={exportRankingRows}>
            Export
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Keyword</th>
              <th>Count</th>
              <th>Trend (5y)</th>
            </tr>
          </thead>
          <tbody>
            {rankingRows.map((row, index) => (
              <tr key={row.keyword}>
                <td>{index + 1}</td>
                <td>{row.keyword}</td>
                <td>{row.count}</td>
                <td>
                  <TrendSparkline values={row.values} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="trend-panel trend-table-card">
        <div className="trend-table-heading">
          <h2>
            <MiniIcon path="M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" /> Top 10 by
            Growth Rate (Strategy B)
          </h2>
          <button type="button" onClick={exportGrowthRows}>
            Export
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Keyword</th>
              <th>Growth %</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {growthRows.map((row, index) => (
              <tr key={row.keyword}>
                <td>{index + 1}</td>
                <td>{row.keyword}</td>
                <td className="trend-positive">{row.growth}</td>
                <td>
                  <MiniIcon path="M12 19V5M7 10l5-5 5 5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function TrendVolumeMatrix() {
  const { data: backendTrendData } = useApiResource(
    "/api/trends?fromYear=2019&toYear=2026&strategy=StrategyA_RawCount",
    [],
    { select: unwrapList },
  );
  const matrixYears = backendTrendData.length
    ? [
        ...new Set(
          backendTrendData
            .map((item) => Number(item.year || item.Year))
            .filter(Boolean),
        ),
      ].sort((left, right) => left - right)
    : [2019, 2020, 2021, 2022, 2023];
  const matrixRows = backendTrendData.length
    ? Object.values(
        backendTrendData.reduce((acc, item) => {
          const keyword = item.keyword || item.Keyword || "Unknown keyword";
          const year = Number(item.year || item.Year);
          if (!acc[keyword]) {
            acc[keyword] = {
              discipline: keyword,
              values: matrixYears.map(() => 0),
              total: 0,
            };
          }
          const index = matrixYears.indexOf(year);
          const count = Number(
            item.publicationCount ?? item.PublicationCount ?? 0,
          );
          if (index >= 0) acc[keyword].values[index] += count;
          acc[keyword].total += count;
          return acc;
        }, {}),
      ).slice(0, 8)
    : trendVolumeRows;

  return (
    <section className="trend-panel trend-matrix">
      <h2>Detailed Volume Matrix (Target: Machine Learning)</h2>
      <div className="trend-matrix-scroll">
        <table>
          <thead>
            <tr>
              <th>Discipline / Year</th>
              {matrixYears.map((year) => (
                <th key={year}>{year}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row) => (
              <tr className={row.summary ? "summary" : ""} key={row.discipline}>
                <td>{row.discipline}</td>
                {row.values.map((value, index) => (
                  <td key={`${row.discipline}-${index}`}>{value}</td>
                ))}
                <td>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrendKeywordsPage() {
  return (
    <ResearcherShell
      activeRoute="/researcher-trend-tracking"
      current="Trending Keywords"
      pageClassName="trend-tracking-page trend-keywords-page"
      mainClassName="trend-keywords-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search publications, authors, keywords..."
    >
      <div className="trend-content trend-keywords-content">
        <TrendKeywordsOverview />
      </div>
    </ResearcherShell>
  );
}

function TrendTrackingDashboardPage() {
  const [dateRange, setDateRange] = React.useState("Last 5 Years (2019-2023)");
  const [keyword, setKeyword] = React.useState("Machine Learning");
  const [showComparison, setShowComparison] = React.useState(false);
  const [comparisonDraft, setComparisonDraft] = React.useState("");
  const [comparisonKeyword, setComparisonKeyword] = React.useState("");
  const [compareMessage, setCompareMessage] = React.useState("");

  const handleDateRangeChange = (e) => {
    const newRange = e.target.value;
    setDateRange(newRange);
    console.log("Date range changed to:", newRange);
    // Trigger data refresh - TrendMainChart will re-fetch with new params
  };

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleClearKeyword = () => {
    setKeyword("");
  };

  const handleCompareSubmit = (event) => {
    event.preventDefault();
    if (!showComparison) {
      setShowComparison(true);
      setCompareMessage("Enter a second keyword, then press Apply Compare.");
      return;
    }
    const nextKeyword = comparisonDraft.trim();
    if (!nextKeyword) {
      setCompareMessage("Enter a keyword to compare.");
      return;
    }
    if (nextKeyword.toLowerCase() === keyword.trim().toLowerCase()) {
      setCompareMessage("Choose a different keyword for comparison.");
      return;
    }
    setComparisonKeyword(nextKeyword);
    setCompareMessage(`Comparing ${keyword || "primary trend"} with ${nextKeyword}.`);
  };

  const clearComparison = () => {
    setShowComparison(false);
    setComparisonDraft("");
    setComparisonKeyword("");
    setCompareMessage("");
  };

  return (
    <ResearcherShell
      activeRoute="/researcher-trend-tracking"
      current="Trend Tracking"
      pageClassName="trend-tracking-page trend-dashboard-page"
      mainClassName="trend-tracking-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search keywords, authors..."
    >
      <div className="trend-content">
        <section className="trend-hero">
          <div>
            <h1>Trend Tracking</h1>
            <p>
              Analyze keyword velocity and raw publication volume across
              disciplines.
            </p>
          </div>
          <form
            className="trend-filter-panel"
            onSubmit={handleCompareSubmit}
          >
            <label className="trend-keyword-field">
              <MiniIcon path="M6 5h12M8 12h8M10 19h4" />
              <input
                type="search"
                value={keyword}
                onChange={handleKeywordChange}
                aria-label="Trend keyword"
              />
              <button
                type="button"
                aria-label="Clear keyword"
                onClick={handleClearKeyword}
              >
                x
              </button>
            </label>
            {showComparison ? (
              <label className="trend-keyword-field comparison-keyword-field">
                <MiniIcon path="M5 12h14M12 5v14" />
                <input
                  type="search"
                  value={comparisonDraft}
                  onChange={(event) => setComparisonDraft(event.target.value)}
                  aria-label="Comparison keyword"
                  placeholder="Comparison keyword"
                  autoFocus
                />
                <button
                  type="button"
                  aria-label="Remove comparison"
                  onClick={clearComparison}
                >
                  x
                </button>
              </label>
            ) : null}
            <div className="trend-filter-row">
              <label>
                <MiniIcon path="M7 4v3M17 4v3M5 9h14M6 6h12v13H6z" />
                <select
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  aria-label="Date range"
                >
                  <option>Last 5 Years (2019-2023)</option>
                  <option>Last 3 Years (2021-2023)</option>
                  <option>Last 10 Years (2014-2023)</option>
                </select>
              </label>
              <button type="submit">
                {showComparison ? "Apply Compare" : "+ Compare"}
              </button>
            </div>
            {compareMessage ? (
              <p className="trend-compare-message" role="status">
                {compareMessage}
              </p>
            ) : null}
          </form>
        </section>

        <section className="trend-metric-grid" aria-label="Trend metrics">
          {trendMetricCards.map((card) => (
            <TrendMetricCard card={card} key={card.label} />
          ))}
        </section>

        <TrendMainChart
          dateRange={dateRange}
          keyword={keyword}
          comparisonKeyword={comparisonKeyword}
        />
        <TrendRankingTables />
        <TrendVolumeMatrix />
      </div>
    </ResearcherShell>
  );
}

function ReportStepCard({ step, title, icon, children, accent = false }) {
  return (
    <section className={`report-step-card ${accent ? "accent" : ""}`}>
      <h2>
        <MiniIcon path={icon} /> Step {step}: {title}
      </h2>
      {children}
    </section>
  );
}

function ReportsPage() {
  const [reportKeyword, setReportKeyword] = React.useState("machine learning");
  const [reportFromYear, setReportFromYear] = React.useState("2018");
  const [reportToYear, setReportToYear] = React.useState("2023");
  const [reportFormat, setReportFormat] = React.useState("Csv");
  const [reportMessage, setReportMessage] = React.useState("");
  const [activeReportBarIndex, setActiveReportBarIndex] = React.useState(null);
  const reportYearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2010 + 1 }, (_, index) =>
      String(currentYear - index),
    );
  }, []);
  const reportPreviewPath = React.useMemo(() => {
    const params = new URLSearchParams({
      keyword: reportKeyword,
      fromYear: reportFromYear,
      toYear: reportToYear,
    });
    return `/api/dashboard/report-preview?${params.toString()}`;
  }, [reportKeyword, reportFromYear, reportToYear]);
  const { data: reportPreviewData, status: reportPreviewStatus } =
    useApiResource(reportPreviewPath, null);
  const reportTotals = React.useMemo(() => {
    const startYear = Number(reportFromYear) || 2018;
    const endYear = Number(reportToYear) || 2023;
    const fallbackLabels = Array.from(
      { length: Math.max(1, endYear - startYear + 1) },
      (_, index) => String(startYear + index),
    );
    const rows = Array.isArray(reportPreviewData?.yearlyCounts)
      ? reportPreviewData.yearlyCounts
      : [];
    const labels = rows.length
      ? rows.map((row) => String(row.year ?? row.Year))
      : fallbackLabels;
    const counts = rows.length
      ? rows.map((row) =>
          Number(row.publicationCount ?? row.PublicationCount ?? 0),
        )
      : fallbackLabels.map(() => 0);
    const maxCount = Math.max(...counts, 1);
    return {
      total: Number(reportPreviewData?.totalPublications ?? 0),
      averageGrowthRate: Number(reportPreviewData?.averageGrowthRate ?? 0),
      averageCitationsPerPaper: Number(
        reportPreviewData?.averageCitationsPerPaper ?? 0,
      ),
      labels,
      counts,
      barHeights: counts.map((count) =>
        count > 0 ? Math.max(12, Math.round((count / maxCount) * 92)) : 4,
      ),
      topAuthors: Array.isArray(reportPreviewData?.topAuthors)
        ? reportPreviewData.topAuthors
        : [],
    };
  }, [reportFromYear, reportToYear, reportPreviewData]);
  const reportPreviousCounts = React.useMemo(
    () =>
      reportTotals.counts.map((count, index, rows) =>
        Number(rows[index - 1] || Math.round(count * 0.88)),
      ),
    [reportTotals.counts],
  );
  const handleGenerateReport = async () => {
    setReportMessage("Generating report...");
    try {
      const token = getStoredAuth().accessToken;
      const response = await fetch(`${API_BASE_URL}/api/dashboard/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          keyword: reportKeyword,
          fromYear: Number(reportFromYear),
          toYear: Number(reportToYear),
          format: reportFormat === "Csv" ? 1 : 0,
        }),
      });
      if (!response.ok) throw new Error("Could not generate report.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `trend-report-${reportKeyword.replace(/\s+/g, "-")}-${reportFromYear}-${reportToYear}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setReportMessage("Report exported from backend.");
    } catch (error) {
      setReportMessage(error.message);
    }
  };

  return (
    <ResearcherShell
      activeRoute="/researcher-reports"
      current="Reports"
      pageClassName="researcher-reports-page"
      mainClassName="researcher-reports-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search..."
    >
      <div className="reports-content">
        <div className="reports-heading">
          <span>Dashboard&nbsp; &gt;&nbsp; Reports</span>
          <h1>Generate Custom Report</h1>
        </div>

        <div className="reports-layout">
          <aside className="reports-config-column">
            <ReportStepCard
              step="1"
              title="Select Scope"
              icon="M4 5h16l-6 7v5l-4 2v-7L4 5ZM8 8h8M10 12h4"
            >
              <label className="report-field">
                <span>Keywords (Multi-select)</span>
                <div className="report-token-box">
                  <span>
                    {reportKeyword} <button type="button">x</button>
                  </span>
                  <span>
                    climate models <button type="button">x</button>
                  </span>
                  <input
                    type="text"
                    placeholder="Type and press enter..."
                    value={reportKeyword}
                    onChange={(event) => setReportKeyword(event.target.value)}
                  />
                </div>
              </label>
              <label className="report-field">
                <span>Journals (Multi-select)</span>
                <div className="report-empty-select"></div>
              </label>
              <div className="report-year-grid">
                <label className="report-field">
                  <span>Start Year</span>
                  <select
                    value={reportFromYear}
                    onChange={(event) => setReportFromYear(event.target.value)}
                    aria-label="Start year"
                  >
                    {reportYearOptions.map((year) => (
                      <option
                        value={year}
                        disabled={Number(year) > Number(reportToYear)}
                        key={`report-start-${year}`}
                      >
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="report-field">
                  <span>End Year</span>
                  <select
                    value={reportToYear}
                    onChange={(event) => setReportToYear(event.target.value)}
                    aria-label="End year"
                  >
                    {reportYearOptions.map((year) => (
                      <option
                        value={year}
                        disabled={Number(year) < Number(reportFromYear)}
                        key={`report-end-${year}`}
                      >
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="report-field">
                <span>Topics</span>
                <input
                  type="text"
                  defaultValue="e.g. Artificial Intelligence, Genomics"
                />
              </label>
            </ReportStepCard>

            <ReportStepCard
              step="2"
              title="Choose Metrics"
              icon="M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 15V9M12 15v-3M15 15v-5"
            >
              <div className="report-metric-options">
                {reportMetrics.map((metric, index) => (
                  <label key={metric}>
                    <input
                      type="checkbox"
                      defaultChecked={index !== 3 && index !== 5}
                    />
                    <span>{metric}</span>
                  </label>
                ))}
              </div>
            </ReportStepCard>

            <ReportStepCard
              step="4"
              title="Export Options"
              icon="M12 4v10M8 10l4 4 4-4M5 19h14M7 6h3M14 6h3"
              accent
            >
              <div className="report-format-options">
                <label>
                  <input
                    type="radio"
                    name="format"
                    checked={reportFormat === "Excel"}
                    onChange={() => setReportFormat("Excel")}
                  />{" "}
                  <span>Excel (.xlsx)</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="format"
                    checked={reportFormat === "Csv"}
                    onChange={() => setReportFormat("Csv")}
                  />{" "}
                  <span>CSV</span>
                </label>
              </div>
              <label className="report-switch">
                <input type="checkbox" defaultChecked />
                <span>Include raw data sheets</span>
              </label>
              <button
                type="button"
                className="report-generate-button"
                onClick={handleGenerateReport}
              >
                <MiniIcon path="M13 3 5 14h6l-1 7 8-11h-6l1-7ZM8 5h2M15 18h2" />
                Generate Report
              </button>
              {reportMessage ? (
                <p className="report-status">{reportMessage}</p>
              ) : null}
            </ReportStepCard>
          </aside>

          <section className="reports-preview-column">
            <section className="report-preview-card">
              <div className="report-panel-heading">
                <h2>
                  <MiniIcon path="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12ZM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6ZM16.5 6.5l2-2" />{" "}
                  Step 3: Live Preview
                </h2>
                <button type="button">Sample Data</button>
              </div>
              <div className="report-document-preview">
                <h3>
                  Trend Analysis: {reportKeyword || "Selected keyword"} (
                  {reportFromYear}-{reportToYear})
                </h3>
                <p>
                  Generated on: {new Date().toLocaleDateString()} - Scope:
                  backend publication data
                  {reportPreviewStatus === "loading" ? " - refreshing..." : ""}
                </p>
                <div className="report-preview-metrics">
                  <div>
                    <span>Total Publications</span>
                    <strong>
                      {reportTotals.total.toLocaleString("en-US")}
                    </strong>
                    <i></i>
                  </div>
                  <div>
                    <span>Avg Growth Rate</span>
                    <strong>
                      {reportTotals.averageGrowthRate.toFixed(1)}%
                    </strong>
                    <i></i>
                  </div>
                  <div>
                    <span>Avg Citations/Paper</span>
                    <strong>
                      {reportTotals.averageCitationsPerPaper.toFixed(1)}
                    </strong>
                    <i></i>
                  </div>
                </div>
                <div
                  className="report-bar-chart"
                  aria-label="Publication bar chart"
                >
                  {reportTotals.barHeights.map((height, index) => {
                    const label = reportTotals.labels[index] || "Year";
                    const count = Number(reportTotals.counts[index] || 0);
                    const previousCount = Number(
                      reportPreviousCounts[index] || 0,
                    );
                    const active = activeReportBarIndex === index;

                    return (
                      <button
                        type="button"
                        className={`report-chart-bar ${active ? "active" : ""} ${
                          index === 0
                            ? "edge-left"
                            : index === reportTotals.barHeights.length - 1
                              ? "edge-right"
                              : ""
                        }`}
                        key={`report-preview-bar-${index}`}
                        aria-label={`${label}: ${count} publications, previous year ${previousCount} publications`}
                        onClick={() => setActiveReportBarIndex(index)}
                        onFocus={() => setActiveReportBarIndex(index)}
                        onMouseEnter={() => setActiveReportBarIndex(index)}
                        style={{ height: `${height}%` }}
                      >
                        {active ? (
                          <span className="report-chart-tooltip">
                            <strong>{label}</strong>
                            <em>
                              <b></b>
                              Publications Over Time:{" "}
                              {count.toLocaleString("en-US")} publications
                            </em>
                            <em>
                              <b className="previous"></b>
                              Previous Year:{" "}
                              {previousCount.toLocaleString("en-US")}{" "}
                              publications
                            </em>
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <table className="report-author-table">
                  <thead>
                    <tr>
                      <th>Top Authors</th>
                      <th>Pubs</th>
                      <th>Trend Score A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportTotals.topAuthors.length ? (
                      reportTotals.topAuthors.map((author) => (
                        <tr key={author.name}>
                          <td>{author.name}</td>
                          <td>{author.publications}</td>
                          <td>{Number(author.trendScore || 0).toFixed(1)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3">No author data for this scope</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-history-card">
              <div className="report-panel-heading">
                <h2>
                  <MiniIcon path="M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5M12 8v5l3 2" />{" "}
                  Report History
                </h2>
                <span>Last 10 reports</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Date Generated</th>
                    <th>Format</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reportHistoryRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.date}</td>
                      <td>
                        <span
                          className={row.format === "Excel" ? "excel" : "csv"}
                        >
                          {row.format}
                        </span>
                      </td>
                      <td>
                        <a
                          href="/researcher-reports"
                          onClick={navTo("/researcher-reports")}
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a
                className="report-history-link"
                href="/researcher-reports"
                onClick={navTo("/researcher-reports")}
              >
                View all historical reports
              </a>
            </section>
          </section>
        </div>
      </div>
    </ResearcherShell>
  );
}

function YearMetricCard({ card }) {
  return (
    <article className="year-metric-card">
      <div className="year-metric-head">
        <span>{card.label}</span>
        <MiniIcon path={card.icon} />
      </div>
      {card.extra ? <em>{card.extra}</em> : null}
      <strong>{card.value}</strong>
      {card.note ? <small>{card.note}</small> : null}
      {card.bars ? (
        <div className="year-mini-bars" aria-hidden="true">
          {card.bars.map((height, index) => (
            <i style={{ height: `${height}%` }} key={index}></i>
          ))}
        </div>
      ) : (
        <div className="year-rank-grid">
          {card.ranks.map((rank, index) => (
            <span
              className={card.danger && index === 1 ? "danger" : ""}
              key={rank}
            >
              {rank}
            </span>
          ))}
        </div>
      )}
      {card.subvalue ? (
        <b className={card.danger ? "danger" : ""}>{card.subvalue}</b>
      ) : null}
    </article>
  );
}

function YearTrajectoryChart({
  baselineYear = "2024",
  comparisonYear = "2025",
  baselineTotal = 0,
  comparisonTotal = 0,
}) {
  const distributeQuarterly = (total, fallback) => {
    if (!total) return fallback;
    const weights = [0.18, 0.24, 0.27, 0.31];
    return weights.map((weight) => Math.round(total * weight));
  };
  const baselineQuarterData = distributeQuarterly(
    baselineTotal,
    [320, 430, 520, 780],
  );
  const comparisonQuarterData = distributeQuarterly(
    comparisonTotal,
    [280, 730, 1100, 1480],
  );
  const maxQuarterValue = Math.max(
    ...baselineQuarterData,
    ...comparisonQuarterData,
    1600,
  );
  const width = 660;
  const height = 340;
  const padding = { top: 26, right: 30, bottom: 42, left: 52 };
  const maxValue = 1600;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const getX = (index) =>
    padding.left + (index / (yearTrajectoryData.length - 1)) * plotWidth;
  const getY = (value) => padding.top + (1 - value / maxValue) * plotHeight;
  const points = yearTrajectoryData.map((item, index) => ({
    ...item,
    x: getX(index),
    yBase: getY(item.baseline),
    yComp: getY(item.comparison),
  }));
  const baselinePath = points
    .map(
      (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.yBase}`,
    )
    .join(" ");
  const comparisonPath = points
    .map(
      (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.yComp}`,
    )
    .join(" ");

  return (
    <section className="year-chart-card">
      <div className="year-chart-heading">
        <h2>
          Publication Volume
          <br />
          Trajectory
        </h2>
        <div className="year-chart-legend">
          <span>
            <i className="baseline"></i> {baselineYear}
            <br />
            (Baseline)
          </span>
          <span>
            <i className="comparison"></i> {comparisonYear}
            <br />
            (Comparison)
          </span>
        </div>
      </div>
      <div style={{ height: "400px", padding: "20px" }}>
        <Line
          data={{
            labels: ["Q1", "Q2", "Q3", "Q4"],
            datasets: [
              {
                label: `${baselineYear} (Baseline)`,
                data: baselineQuarterData,
                borderColor: "rgba(156, 163, 175, 1)",
                backgroundColor: "rgba(156, 163, 175, 0.1)",
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: "rgba(156, 163, 175, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointHoverBackgroundColor: "rgba(156, 163, 175, 1)",
                pointHoverBorderColor: "#fff",
                borderWidth: 3,
                borderDash: [8, 4],
              },
              {
                label: `${comparisonYear} (Comparison)`,
                data: comparisonQuarterData,
                borderColor: "rgba(99, 102, 241, 1)",
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                tension: 0.4,
                fill: true,
                pointRadius: 7,
                pointHoverRadius: 10,
                pointBackgroundColor: "rgba(99, 102, 241, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 3,
                pointHoverBackgroundColor: "rgba(99, 102, 241, 1)",
                pointHoverBorderColor: "#fff",
                borderWidth: 4,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              legend: {
                display: false, // Using custom legend above
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                padding: 14,
                titleFont: {
                  size: 14,
                  weight: "bold",
                },
                bodyFont: {
                  size: 13,
                },
                bodySpacing: 6,
                callbacks: {
                  title: function (context) {
                    return "Quarter " + context[0].label;
                  },
                  label: function (context) {
                    const value = context.parsed.y;
                    const formatted =
                      value >= 1000
                        ? (value / 1000).toFixed(1) + "k"
                        : value.toString();
                    return (
                      context.dataset.label + ": " + formatted + " publications"
                    );
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                suggestedMax: Math.ceil(maxQuarterValue * 1.15),
                grid: {
                  color: "rgba(0, 0, 0, 0.06)",
                  drawBorder: false,
                },
                ticks: {
                  font: {
                    size: 11,
                  },
                  callback: function (value) {
                    if (value === 0) return "0";
                    return (value / 1000).toFixed(1) + "k";
                  },
                  stepSize: 500,
                },
                border: {
                  display: false,
                },
              },
              x: {
                grid: {
                  display: false,
                  drawBorder: false,
                },
                ticks: {
                  font: {
                    size: 12,
                    weight: "500",
                  },
                },
                border: {
                  display: false,
                },
              },
            },
          }}
        />
      </div>
    </section>
  );
}

function YearKeywordDifferential({ rows = yearKeywordDiff }) {
  return (
    <section className="year-keyword-card">
      <div className="year-keyword-heading">
        <h2>Keyword Differential</h2>
        <MiniIcon path="M5 7h14M9 12h10M13 17h6" />
      </div>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.keyword}>
              <td>{row.keyword}</td>
              <td>
                <span className={row.tone}>{row.delta}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function YearComparisonPage() {
  const [baselineYear, setBaselineYear] = React.useState("2024");
  const [comparisonYear, setComparisonYear] = React.useState("2025");
  const fromYear = Math.min(Number(baselineYear), Number(comparisonYear));
  const toYear = Math.max(Number(baselineYear), Number(comparisonYear));
  const { data: comparisonTrendRows } = useApiResource(
    `/api/trends?fromYear=${fromYear}&toYear=${toYear}&strategy=StrategyA_RawCount`,
    [],
    { select: unwrapList },
  );
  const comparisonStats = React.useMemo(() => {
    if (!comparisonTrendRows.length) {
      return {
        baselineTotal: 0,
        comparisonTotal: 0,
        keywordRows: yearKeywordDiff,
        metricCards: yearMetricCards,
      };
    }

    const byKeyword = comparisonTrendRows.reduce((acc, item) => {
      const keyword = item.keyword || item.Keyword || "Unknown keyword";
      const year = String(item.year || item.Year);
      const count = Number(item.publicationCount ?? item.PublicationCount ?? 0);
      if (!acc[keyword]) acc[keyword] = { keyword, baseline: 0, comparison: 0 };
      if (year === baselineYear) acc[keyword].baseline += count;
      if (year === comparisonYear) acc[keyword].comparison += count;
      return acc;
    }, {});
    const keywordRows = Object.values(byKeyword)
      .map((item) => {
        const delta =
          item.baseline > 0
            ? ((item.comparison - item.baseline) / item.baseline) * 100
            : item.comparison > 0
              ? 100
              : 0;
        return {
          keyword: item.keyword,
          delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`,
          tone: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
          volume: item.comparison,
        };
      })
      .sort(
        (left, right) =>
          Math.abs(Number.parseFloat(right.delta)) -
          Math.abs(Number.parseFloat(left.delta)),
      )
      .slice(0, 6);
    const baselineTotal = Object.values(byKeyword).reduce(
      (sum, item) => sum + item.baseline,
      0,
    );
    const comparisonTotal = Object.values(byKeyword).reduce(
      (sum, item) => sum + item.comparison,
      0,
    );
    const growth =
      baselineTotal > 0
        ? ((comparisonTotal - baselineTotal) / baselineTotal) * 100
        : 0;
    const topKeyword = keywordRows[0]?.keyword || "No keyword";

    return {
      baselineTotal,
      comparisonTotal,
      keywordRows: keywordRows.length ? keywordRows : yearKeywordDiff,
      metricCards: [
        {
          ...yearMetricCards[0],
          value: comparisonTotal.toLocaleString("en-US"),
          note: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
        },
        {
          ...yearMetricCards[1],
          value: baselineTotal.toLocaleString("en-US"),
          note: `${baselineYear} baseline`,
        },
        {
          ...yearMetricCards[2],
          value: topKeyword.slice(0, 14),
          subvalue: keywordRows[0]?.delta || "Stable",
        },
        yearMetricCards[3],
      ],
    };
  }, [baselineYear, comparisonTrendRows, comparisonYear]);
  const exportComparisonData = () => {
    downloadCsvFile(
      `scholartrend-year-comparison-${baselineYear}-vs-${comparisonYear}.csv`,
      [
        ["Metric", "Value"],
        ["Baseline Year", baselineYear],
        ["Comparison Year", comparisonYear],
        ["Baseline Total", comparisonStats.baselineTotal],
        ["Comparison Total", comparisonStats.comparisonTotal],
        [],
        ["Keyword", "Delta", "Tone", "Comparison Volume"],
        ...comparisonStats.keywordRows.map((row) => [
          row.keyword,
          row.delta,
          row.tone,
          row.volume ?? "",
        ]),
      ],
    );
  };

  return (
    <ResearcherShell
      activeRoute="/researcher-year-comparison"
      current="Year Comparison"
      pageClassName="researcher-year-page"
      mainClassName="researcher-year-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search..."
    >
      <div className="year-content">
        <section className="year-hero">
          <div>
            <span>Dashboard&nbsp; &gt;&nbsp; Year Comparison</span>
            <h1>Year Comparison Analysis</h1>
          </div>
          <form
            className="year-controls"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              Baseline{" "}
              <select
                value={baselineYear}
                onChange={(event) => setBaselineYear(event.target.value)}
              >
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
                <option>2021</option>
              </select>
            </label>
            <MiniIcon path="M8 7h10M14 3l4 4-4 4M16 17H6M10 13l-4 4 4 4" />
            <label>
              Comparison{" "}
              <select
                value={comparisonYear}
                onChange={(event) => setComparisonYear(event.target.value)}
              >
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
                <option>2023</option>
              </select>
            </label>
            <button type="button" onClick={exportComparisonData}>
              <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" /> Export Data
            </button>
          </form>
        </section>

        <section
          className="year-metric-grid"
          aria-label="Year comparison metrics"
        >
          {comparisonStats.metricCards.map((card) => (
            <YearMetricCard card={card} key={card.label} />
          ))}
        </section>

        <div className="year-analysis-grid">
          <YearTrajectoryChart
            baselineYear={baselineYear}
            comparisonYear={comparisonYear}
            baselineTotal={comparisonStats.baselineTotal}
            comparisonTotal={comparisonStats.comparisonTotal}
          />
          <YearKeywordDifferential rows={comparisonStats.keywordRows} />
        </div>
      </div>
    </ResearcherShell>
  );
}

function SyncSourceCard({ source }) {
  return (
    <article className="sync-source-card">
      <div className="sync-source-head">
        <div>
          <h2>{source.name}</h2>
          <p>{source.role}</p>
        </div>
        <span className={source.statusTone}>{source.status}</span>
      </div>
      <div className="sync-source-stats">
        <div>
          <span>Synced Records</span>
          <strong>{source.synced}</strong>
        </div>
        <div>
          <span>Latency</span>
          <strong>{source.latency}</strong>
        </div>
        <div>
          <span>Coverage</span>
          <strong>{source.coverage}</strong>
        </div>
      </div>
    </article>
  );
}

function SyncManagementPage() {
  return (
    <ResearcherShell
      activeRoute="/researcher-sync-management"
      current="Sync Management"
      pageClassName="researcher-sync-page"
      mainClassName="researcher-sync-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search sync jobs, APIs, logs..."
    >
      <div className="sync-content">
        <section className="sync-hero">
          <div>
            <h1>Academic Data Sync Management</h1>
            <p>
              Monitor publication metadata ingestion, API comparison samples,
              normalization, scheduled jobs, and failure logs.
            </p>
          </div>
          <div className="sync-hero-actions">
            <button type="button" className="sync-secondary-button">
              <MiniIcon path="M4 4v6h6M20 20v-6h-6M20 8a7 7 0 0 0-12.1-4M4 16a7 7 0 0 0 12.1 4M9 12h6" />{" "}
              Run Dry Check
            </button>
            <button type="button" className="sync-primary-button">
              <MiniIcon path="M12 5v14M5 12h14M7 7l10 10" /> Start Sync
            </button>
          </div>
        </section>

        <section className="sync-source-grid" aria-label="Sync data sources">
          {syncSourceCards.map((source) => (
            <SyncSourceCard source={source} key={source.name} />
          ))}
        </section>

        <div className="sync-dashboard-grid">
          <section className="sync-panel sync-pipeline-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8M17 16.5a6 6 0 0 1-10.2 2.8" />{" "}
                Metadata Pipeline
              </h2>
              <span>Current batch: #SS-2026-0618</span>
            </div>
            <div className="sync-pipeline-steps">
              {syncPipelineSteps.map((step, index) => (
                <article className={`sync-step ${step.state}`} key={step.label}>
                  <b>{index + 1}</b>
                  <div>
                    <h3>{step.label}</h3>
                    <p>{step.detail}</p>
                  </div>
                  <span>{step.state}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="sync-panel sync-schedule-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M7 4v3M17 4v3M5 9h14M6 6h12v13H6zM9 13h2M13 13h2M9 16h2" />{" "}
                Hangfire Schedule
              </h2>
              <button type="button">Configure</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Schedule</th>
                  <th>Last Run</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {syncJobs.map((job) => (
                  <tr key={job.job}>
                    <td>{job.job}</td>
                    <td>{job.schedule}</td>
                    <td>{job.lastRun}</td>
                    <td>{job.duration}</td>
                    <td>
                      <span className={job.status.toLowerCase()}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="sync-panel sync-health-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M12 21s8-4.5 8-11V5l-8-3-8 3v5c0 6.5 8 11 8 11ZM8.5 12l2.2 2.2L15.8 9" />{" "}
                Database Health
              </h2>
            </div>
            <div className="sync-health-grid">
              <div>
                <span>Canonical Publications</span>
                <strong>152,900</strong>
                <i style={{ width: "88%" }}></i>
              </div>
              <div>
                <span>Normalized Authors</span>
                <strong>48,730</strong>
                <i style={{ width: "74%" }}></i>
              </div>
              <div>
                <span>Duplicate Merge Rate</span>
                <strong>3.8%</strong>
                <i style={{ width: "38%" }}></i>
              </div>
              <div>
                <span>Error Queue</span>
                <strong>42</strong>
                <i className="danger" style={{ width: "24%" }}></i>
              </div>
            </div>
          </section>

          <section className="sync-panel sync-log-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5M18 4l2-2M20 6l2-2" />{" "}
                Sync Logs & Errors
              </h2>
              <span>Live logging</span>
            </div>
            <div className="sync-log-list">
              {syncLogs.map((log) => (
                <article
                  className={`sync-log ${log.level.toLowerCase()}`}
                  key={`${log.time}-${log.message}`}
                >
                  <time>{log.time}</time>
                  <strong>{log.level}</strong>
                  <p>{log.message}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ResearcherShell>
  );
}

function ResearcherSearchTopbar({ onMenuClick, onOpenSettings }) {
  const [queryValue, setQueryValue] = React.useState(
    () => getSearchParam("q") || "",
  );
  React.useEffect(() => {
    const syncQuery = () => setQueryValue(getSearchParam("q") || "");
    window.addEventListener("scholartrend:navigate", syncQuery);
    window.addEventListener("popstate", syncQuery);
    return () => {
      window.removeEventListener("scholartrend:navigate", syncQuery);
      window.removeEventListener("popstate", syncQuery);
    };
  }, []);
  const handleGraphSearchSubmit = (event) => {
    event.preventDefault();
    const query = queryValue.trim();
    const targetPath = query
      ? `/researcher-search?q=${encodeURIComponent(query)}`
      : "/researcher-search";

    window.history.pushState({}, "", getAcademicPath(targetPath));
    window.dispatchEvent(new Event("scholartrend:navigate"));
  };

  return (
    <header className="researcher-graph-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <nav className="researcher-graph-breadcrumb" aria-label="Breadcrumb">
        <a
          href="/researcher-dashboard"
          onClick={navTo("/researcher-dashboard")}
        >
          Dashboard
        </a>
        <span>&gt;</span>
        <strong>Knowledge Graph</strong>
      </nav>

      <form
        className="researcher-graph-search"
        onSubmit={handleGraphSearchSubmit}
      >
        <button
          type="submit"
          className="graph-search-submit"
          aria-label="Search publications"
        >
          <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
        </button>
        <input
          type="search"
          name="query"
          value={queryValue}
          onChange={(event) => setQueryValue(event.target.value)}
          placeholder="Search title, author, keyword, or DOI..."
          aria-label="Search knowledge graph"
        />
      </form>

      <div className="researcher-graph-actions">
        <button
          type="button"
          className="graph-toolbar-button"
          onClick={navTo("/researcher-search?view=list")}
        >
          <MiniIcon path="M6 6h12M6 12h12M6 18h12M4 6h.01M4 12h.01M4 18h.01" />
          List View
        </button>
        <button type="button" className="graph-toolbar-button active">
          <MiniIcon path="M4 5h16l-6.2 7.1V18l-3.6 1.6v-7.5L4 5ZM8 8h8" />
          Filters
        </button>
        <button type="button" className="graph-icon-button" aria-label="Help">
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM18.5 5.5l1.5-1.5" />
        </button>
        <button
          type="button"
          className="graph-icon-button"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
      </div>
    </header>
  );
}

function ResearcherPublicationTopbar({ onMenuClick, onOpenSettings }) {
  return (
    <header className="researcher-topbar researcher-publication-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <nav className="researcher-breadcrumb" aria-label="Breadcrumb">
        <a href="/researcher-search" onClick={navTo("/researcher-search")}>
          Search
        </a>
        <span>&gt;</span>
        <a href="/researcher-search" onClick={navTo("/researcher-search")}>
          Results
        </a>
        <span>&gt;</span>
        <strong>Deep Learning for Advanced Pattern Recognition...</strong>
      </nav>

      <div className="researcher-top-actions">
        <form
          className="researcher-search"
          onSubmit={navTo("/researcher-search")}
        >
          <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search publications"
          />
        </form>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Notifications"
          onClick={navTo("/researcher-notifications")}
        >
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2" />
        </button>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
        <button
          type="button"
          className="researcher-avatar"
          aria-label="User profile"
          onClick={navTo("/researcher-profile")}
        >
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Researcher profile"
          />
        </button>
      </div>
    </header>
  );
}

function KnowledgeGraphCanvas({
  nodes = graph3DNodes,
  selectedNodeId,
  onSelectNode,
}) {
  const mountRef = React.useRef(null);
  const labelLayerRef = React.useRef(null);
  const graphActionsRef = React.useRef({ zoomIn: null, zoomOut: null });
  const selectionApiRef = React.useRef(null);
  const selectedNodeIdRef = React.useRef(selectedNodeId);

  React.useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
    selectionApiRef.current?.applySelection(selectedNodeId);
  }, [selectedNodeId]);

  React.useEffect(() => {
    const mount = mountRef.current;
    const labelLayer = labelLayerRef.current;
    if (!mount || !labelLayer) return undefined;

    let disposed = false;
    let cleanup = () => {};
    const initializeGraph = async () => {
      const [THREE, controlsModule] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js"),
      ]);
      if (disposed) return;
      const { OrbitControls } = controlsModule;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 1800);
    camera.position.set(0, 0, 780);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("tabindex", "0");
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.28;
    controls.minDistance = 360;
    controls.maxDistance = 980;
    controls.enablePan = true;

    const normalizedNodes = nodes.map((node, index) => ({
      ...node,
      position: Array.isArray(node.position)
        ? node.position
        : dynamicGraphNodePositions[index % dynamicGraphNodePositions.length],
      size: Number(node.size || (index === 0 ? 48 : 32)),
    }));
    const graphGroup = new THREE.Group();
    graphGroup.rotation.x = -0.08;
    graphGroup.rotation.y = -0.18;
    graphGroup.position.x = 22;
    graphGroup.position.y = 110;
    graphGroup.scale.setScalar(0.86);
    scene.add(graphGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(160, 220, 340);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xc7d2fe, 1.1);
    fillLight.position.set(-260, -120, 220);
    scene.add(fillLight);

    const nodeById = Object.fromEntries(
      normalizedNodes.map((node) => [node.id, node]),
    );
    const labelItems = [];
    const nodeItems = new Map();
    const nodeMeshes = [];
    const graphLinksForUi = graph3DLinks.some(
      ([sourceId, targetId]) => nodeById[sourceId] && nodeById[targetId],
    )
      ? graph3DLinks.filter(
          ([sourceId, targetId]) => nodeById[sourceId] && nodeById[targetId],
        )
      : normalizedNodes.slice(1).flatMap((node, index) => {
          const links = [
            [normalizedNodes[0].id, node.id, index < 4 ? "strong" : "faint"],
          ];
          if (index > 0 && index % 2 === 0) {
            links.push([normalizedNodes[index].id, node.id, "faint"]);
          }
          return links;
        });

    graphLinksForUi.forEach(([sourceId, targetId, tone]) => {
      const source = nodeById[sourceId];
      const target = nodeById[targetId];
      if (!source || !target) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...source.position),
        new THREE.Vector3(...target.position),
      ]);
      const material = new THREE.LineBasicMaterial({
        color: tone === "strong" ? 0x0f172a : 0xaebfc4,
        transparent: true,
        opacity: tone === "strong" ? 0.34 : 0.12,
      });
      graphGroup.add(new THREE.Line(geometry, material));
    });

    const selectionGroup = new THREE.Group();
    const selectionHalo = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 24),
      new THREE.MeshBasicMaterial({
        color: 0xb8cfce,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    const selectionRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.055, 16, 120),
      new THREE.MeshBasicMaterial({
        color: 0x9a4a88,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
    );
    selectionGroup.add(selectionHalo, selectionRing);
    selectionGroup.visible = false;
    graphGroup.add(selectionGroup);

    normalizedNodes.forEach((node) => {
      const selectedRadius = node.size;
      const idleRadius = Math.max(node.size * 0.42, 8);
      const isActiveNode = node.id === selectedNodeIdRef.current;
      const radius = isActiveNode ? selectedRadius : idleRadius;
      const position = new THREE.Vector3(...node.position);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: isActiveNode ? 0.72 : 0.82,
        roughness: 0.48,
        metalness: 0.05,
      });
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 40, 24),
        material,
      );
      sphere.position.copy(position);
      sphere.scale.setScalar(radius);
      sphere.userData.nodeId = node.id;
      graphGroup.add(sphere);
      nodeMeshes.push(sphere);

      const label = document.createElement("span");
      label.className =
        node.id === selectedNodeIdRef.current
          ? "graph-3d-label selected"
          : "graph-3d-label";
      label.textContent = node.label;
      labelLayer.appendChild(label);
      const item = {
        label,
        sphere,
        material,
        node,
        idleRadius,
        selectedRadius,
        currentRadius: radius,
      };
      labelItems.push(item);
      nodeItems.set(node.id, item);
    });

    const applySelection = (nodeId) => {
      const fallbackNodeId = normalizedNodes[0]?.id || "deepfruits";
      const nextNodeId = nodeItems.has(nodeId) ? nodeId : fallbackNodeId;
      const selectedItem = nodeItems.get(nextNodeId);
      selectedNodeIdRef.current = nextNodeId;

      nodeItems.forEach((item, itemId) => {
        const active = itemId === nextNodeId;
        item.material.opacity = active ? 0.72 : 0.82;
        item.material.emissive.set(active ? 0x6d4df2 : 0x000000);
        item.material.emissiveIntensity = active ? 0.08 : 0;
        item.label.className = active
          ? "graph-3d-label selected"
          : "graph-3d-label";
      });

      if (selectedItem) {
        selectionGroup.visible = true;
        selectionGroup.position.copy(selectedItem.sphere.position);
        selectionGroup.scale.setScalar(selectedItem.currentRadius);
      }
    };

    selectionApiRef.current = { applySelection };
    applySelection(selectedNodeIdRef.current);
    let graphZoom = 0.86;

    const resize = () => {
      const width = Math.max(mount.clientWidth, 320);
      const height = Math.max(mount.clientHeight, 320);
      const isNarrow = width < 620;
      const baseZoom = isNarrow ? 0.78 : 0.86;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = isNarrow ? 1160 : 920;
      graphGroup.position.x = isNarrow ? -46 : 54;
      graphGroup.position.y = isNarrow ? 84 : 92;
      graphZoom = baseZoom;
      graphGroup.scale.setScalar(graphZoom);
      controls.target.set(graphGroup.position.x, graphGroup.position.y, 0);
      controls.minDistance = isNarrow ? 760 : 520;
      controls.maxDistance = isNarrow ? 1420 : 1180;
      camera.updateProjectionMatrix();
      controls.update();
    };

    const setGraphZoom = (nextZoom) => {
      graphZoom = THREE.MathUtils.clamp(nextZoom, 0.62, 1.42);
      graphGroup.scale.setScalar(graphZoom);
      controls.autoRotate = false;
      controls.update();
    };

    graphActionsRef.current.zoomIn = () => setGraphZoom(graphZoom * 1.16);
    graphActionsRef.current.zoomOut = () => setGraphZoom(graphZoom / 1.16);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown = null;

    const getIntersectedNodeId = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(nodeMeshes, false)[0]?.object.userData
        .nodeId;
    };

    const handlePointerDown = (event) => {
      pointerDown = { x: event.clientX, y: event.clientY };
      controls.autoRotate = false;
    };

    const handlePointerMove = (event) => {
      renderer.domElement.style.cursor = getIntersectedNodeId(event)
        ? "pointer"
        : "grab";
    };

    const handlePointerUp = (event) => {
      if (!pointerDown) return;
      const moved = Math.hypot(
        event.clientX - pointerDown.x,
        event.clientY - pointerDown.y,
      );
      pointerDown = null;
      if (moved > 7) return;

      const nodeId = getIntersectedNodeId(event);
      if (!nodeId) return;
      applySelection(nodeId);
      onSelectNode?.(nodeId);
    };

    const handlePointerLeave = () => {
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    const projectedPosition = new THREE.Vector3();
    const worldPosition = new THREE.Vector3();
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      selectionRing.quaternion.copy(camera.quaternion);

      const width = mount.clientWidth;
      const height = mount.clientHeight;
      labelItems.forEach(({ label, sphere, node, currentRadius }) => {
        const isSelected = node.id === selectedNodeIdRef.current;
        sphere.getWorldPosition(worldPosition);
        const offset = currentRadius + (isSelected ? 34 : 18);
        worldPosition.y += offset;
        projectedPosition.copy(worldPosition).project(camera);
        const x = (projectedPosition.x * 0.5 + 0.5) * width;
        const y = (-projectedPosition.y * 0.5 + 0.5) * height;
        const visible = projectedPosition.z < 1;
        const depthScale = THREE.MathUtils.clamp(
          1.08 - projectedPosition.z * 0.22,
          0.72,
          1.08,
        );
        label.style.opacity = visible ? (isSelected ? "1" : "0.86") : "0";
        label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${depthScale})`;
      });

      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);

    cleanup = () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      graphActionsRef.current.zoomIn = null;
      graphActionsRef.current.zoomOut = null;
      selectionApiRef.current = null;
      controls.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      mount.replaceChildren();
      labelLayer.replaceChildren();
    };
    };

    initializeGraph().catch((error) => {
      if (!disposed) console.error("Knowledge graph failed to load", error);
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [nodes, onSelectNode]);

  return (
    <section
      className="knowledge-graph-panel"
      aria-label="Research knowledge graph"
    >
      <div
        className="knowledge-graph-webgl"
        ref={mountRef}
        aria-hidden="true"
      ></div>
      <div
        className="knowledge-graph-label-layer"
        ref={labelLayerRef}
        aria-hidden="true"
      ></div>

      <div className="graph-zoom-controls" aria-label="Zoom controls">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => graphActionsRef.current.zoomIn?.()}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => graphActionsRef.current.zoomOut?.()}
        >
          -
        </button>
      </div>

      <div className="graph-bottom-bar">
        <button type="button" className="compare-paper-button">
          <MiniIcon path="M12 5v14M5 12h14" />
          Compare New Paper
        </button>
        <label className="year-range-control">
          <span>Year Range</span>
          <em>2010</em>
          <input
            type="range"
            min="2010"
            max="2024"
            defaultValue="2020"
            aria-label="Start year"
          />
          <input
            type="range"
            min="2010"
            max="2024"
            defaultValue="2024"
            aria-label="End year"
          />
          <em>2024</em>
        </label>
      </div>
    </section>
  );
}

function ResearcherPaperPanel({ selectedNode }) {
  const selectedPaper = getGraphPaperForNode(selectedNode);
  const isLecturerRoute = window.location.pathname.startsWith("/lecturer-");
  const bookmarksPath = isLecturerRoute
    ? "/lecturer-bookmarks"
    : "/researcher-bookmarks";
  const detailPath = `/researcher-publication${
    selectedPaper.id ? `?id=${encodeURIComponent(selectedPaper.id)}` : ""
  }`;
  const [localBookmarks, setLocalBookmarkState] = React.useState(() =>
    getLocalBookmarks(),
  );
  const [bookmarkMessage, setBookmarkMessage] = React.useState("");
  const currentBookmark = localBookmarks.find(
    (bookmark) => getBookmarkKey(bookmark) === getBookmarkKey(selectedPaper),
  );
  const fullTextSaved =
    currentBookmark?.saveMode === "full-text" ||
    currentBookmark?.fullTextSaved === true;
  const linkOnlySaved =
    currentBookmark?.saveMode === "link-only" ||
    currentBookmark?.linkOnly === true;

  React.useEffect(() => {
    setLocalBookmarkState(getLocalBookmarks());
    setBookmarkMessage("");
  }, [selectedPaper.id, selectedPaper.title]);

  const saveSelectedPaper = (mode) => {
    const bookmarkPayload = {
      ...selectedPaper,
      source: selectedPaper.venue,
      journalName: selectedPaper.venue,
      citationCount: Number(
        String(selectedPaper.citations || "0").replaceAll(",", ""),
      ),
      saveMode: mode,
      fullTextSaved: mode === "full-text",
      linkOnly: mode === "link-only",
    };
    const nextLocalBookmarks = upsertLocalBookmark(bookmarkPayload);
    setLocalBookmarkState(nextLocalBookmarks);
    setBookmarkMessage(
      mode === "full-text"
        ? "Saved full text to bookmarks."
        : "Saved link to bookmarks.",
    );

    if (isBackendNumericId(selectedPaper.id) && getStoredAuth().accessToken) {
      apiFetch(`/api/bookmarks/${selectedPaper.id}`, {
        method: "POST",
        auth: true,
      }).catch(() => {});
    }
  };

  return (
    <aside
      className="researcher-paper-panel"
      aria-label="Selected research paper"
    >
      <div className="paper-panel-actions">
        <span>Selected Node</span>
        <div>
          <button type="button" aria-label="Share paper">
            <MiniIcon path="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.3 6.8 8.7 15.2M8.7 8.8l6.6 3.7" />
          </button>
          <button
            type="button"
            aria-label="Open paper"
            onClick={navTo(detailPath)}
          >
            <MiniIcon path="M7 7h10v10M7 17 17 7" />
          </button>
        </div>
      </div>

      <h1>
        <a href={detailPath} onClick={navTo(detailPath)}>
          {selectedPaper.title}
        </a>
      </h1>
      <p className="paper-authors">{selectedPaper.authors}</p>
      <div className="paper-meta-row">
        <span>{selectedPaper.year}</span>
        <span>
          <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
          {selectedPaper.venue}
        </span>
      </div>

      <div className="paper-metric-grid">
        <div>
          <span>Node Relevance</span>
          <strong>{selectedPaper.similarity}</strong>
          <MiniIcon path="M12 5v14M5 12h14" />
        </div>
        <div>
          <span>Citations</span>
          <strong>{selectedPaper.citations}</strong>
          <em>99</em>
        </div>
      </div>

      <section className="paper-summary">
        <h2>Abstract Summary</h2>
        <p>{selectedPaper.abstract}</p>
        <a href={detailPath} onClick={navTo(detailPath)}>
          Read full abstract
        </a>
      </section>

      <div className="paper-save-actions">
        <button
          type="button"
          className={`save-full-text ${fullTextSaved ? "saved" : ""}`}
          onClick={() => saveSelectedPaper("full-text")}
        >
          <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
          {fullTextSaved ? "Saved Full Text" : "Save Full Text"}
        </button>
        <button
          type="button"
          className={`save-link-only ${linkOnlySaved ? "saved" : ""}`}
          onClick={() => saveSelectedPaper("link-only")}
        >
          <MiniIcon path="M10 13a5 5 0 0 1 7.1 0l.9.9a5 5 0 0 1-7.1 7.1l-.9-.9M14 11a5 5 0 0 1-7.1 0L6 10.1A5 5 0 0 1 13.1 3l.9.9" />
          {linkOnlySaved ? "Saved Link" : "Save Link Only"}
        </button>
      </div>
      {bookmarkMessage ? (
        <p className="paper-save-status" role="status">
          {bookmarkMessage}{" "}
          <a href={bookmarksPath} onClick={navTo(bookmarksPath)}>
            Open bookmarks
          </a>
        </p>
      ) : null}

      <section className="paper-access-points">
        <h2>Access Points</h2>
        {selectedPaper.accessPoints.map((point, index) => (
          <a
            href={point.href}
            target="_blank"
            rel="noreferrer"
            key={point.href}
          >
            <MiniIcon
              path={
                index === 0
                  ? "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3"
                  : "M12 4 5 19h14L12 4ZM12 9v4M12 16h.01"
              }
            />
            {point.label}
          </a>
        ))}
      </section>
      <PublicationReviewPanel publication={selectedPaper} />
    </aside>
  );
}

const listViewPapers = [
  {
    id: "deepfruits",
    title: "DeepFruits: A Fruit Detection System Using Deep Neural Networks",
    authors: "Inkyu Sa, ZongYuan Ge, Feras Dayoub, B. Upcroft, Tristan Perez",
    year: 2016,
    citations: 986,
    references: 38,
    similarity: 100,
  },
  {
    id: "bell-pepper",
    title: "Automated Bell Pepper Harvesting using Robotic Vision System",
    authors: "Silpa Ajith Kumar, J. S. Kumar",
    year: 2019,
    citations: 0,
    references: 23,
    similarity: 43.5,
    summary:
      "The automation technology used in harvesting the yellow bell pepper makes use of open source computer vision platform to detect the crop amidst the foliage using various image processing techniques and send appropriate signals to move the robot to harvest the crop.",
    tags: ["Computer Vision", "Robotic Harvesting", "Agricultural Automation"],
  },
  {
    id: "fruit-classification",
    title:
      "Automatic Fruits Classification System Based on Deep Neural Networks",
    authors: "Khadija Munir, A. I. Umar, Waqas Yousaf",
    year: 2020,
    citations: 7,
    references: 27,
    similarity: 42,
  },
  {
    id: "cnn-fruit",
    title:
      "Convolutional Neural Networks (CNN) for Detecting Fruit in Orchards",
    authors: "Fouzia Risdin, P. Mondal, Kazi Mahmudul Hassan",
    year: 2020,
    citations: 21,
    references: 28,
    similarity: 41,
  },
  {
    id: "orchard-detection",
    title: "Deep fruit detection in orchards",
    authors: "Suchet Bargoti, J. Underwood",
    year: 2016,
    citations: 494,
    references: 24,
    similarity: 40.1,
  },
  {
    id: "detsseg",
    title: "DetSSeg: A Selective On-Field Pomegranate Segmentation Method",
    authors: "Shubham S. Mane, Prashant Bartakke, Tulshidas S.",
    year: 2023,
    citations: 2,
    references: 25,
    similarity: 39.3,
  },
  {
    id: "occluded-crop",
    title: "Visual detection of occluded crop: For automated harvesting",
    authors: "C. McCool, Inkyu Sa, Feras Dayoub, Christopher Lehnert",
    year: 2016,
    citations: 77,
    references: 17,
    similarity: 29.2,
  },
  {
    id: "image-segmentation",
    title: "Image Segmentation for Fruit Detection and Yield Estimation",
    authors: "Suchet Bargoti, J. Underwood",
    year: 2016,
    citations: 444,
    references: 56,
    similarity: 26.6,
  },
];

function ResearcherListTopbar({ onMenuClick, onOpenSettings }) {
  const [queryValue, setQueryValue] = React.useState(getSearchParam("q") || "");
  React.useEffect(() => {
    const syncQuery = () => setQueryValue(getSearchParam("q") || "");
    window.addEventListener("scholartrend:navigate", syncQuery);
    window.addEventListener("popstate", syncQuery);
    syncQuery();
    return () => {
      window.removeEventListener("scholartrend:navigate", syncQuery);
      window.removeEventListener("popstate", syncQuery);
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = queryValue.trim();
    const targetPath = query
      ? `/researcher-search?view=list&q=${encodeURIComponent(query)}`
      : "/researcher-search?view=list";
    window.history.pushState({}, "", getAcademicPath(targetPath));
    window.dispatchEvent(new Event("scholartrend:navigate"));
  };

  return (
    <header className="researcher-list-topbar">
      <button
        type="button"
        className="researcher-menu-button researcher-list-menu"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <form className="researcher-list-search" onSubmit={handleSubmit}>
        <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
        <input
          type="search"
          placeholder="Search for a paper, author or concept..."
          aria-label="Search list results"
          value={queryValue}
          onChange={(event) => setQueryValue(event.target.value)}
        />
      </form>

      <nav className="researcher-list-relations" aria-label="Paper relations">
        <button type="button">Prior works</button>
        <button type="button">Derivative works</button>
      </nav>

      <div className="researcher-list-view-toggle" aria-label="Result view">
        <button type="button" className="active">
          <MiniIcon path="M7 7h12M7 12h12M7 17h12M4 7h.01M4 12h.01M4 17h.01" />
          List view
        </button>
        <button
          type="button"
          onClick={navTo(
            queryValue.trim()
              ? `/researcher-search?q=${encodeURIComponent(queryValue.trim())}`
              : "/researcher-search",
          )}
        >
          <MiniIcon path="M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10" />
          Graph view
        </button>
      </div>

      <span className="researcher-list-divider" aria-hidden="true"></span>
      <div className="researcher-list-utilities">
        <button type="button" aria-label="Filter results">
          <MiniIcon path="M5 7h14M8 12h8M10 17h4" />
        </button>
        <button type="button" aria-label="Settings" onClick={onOpenSettings}>
          <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
        </button>
        <button type="button" aria-label="Help">
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </button>
      </div>
    </header>
  );
}

function ResearcherListDetail({ paper, onDownloadPaper }) {
  const [originAdded, setOriginAdded] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const detailPath = `/researcher-publication${paper.id ? `?id=${encodeURIComponent(paper.id)}` : ""}`;
  const summary =
    paper.summary ||
    `This publication explores ${paper.title.toLowerCase()} through a practical computer vision workflow, connecting detection accuracy with reliable deployment in field conditions.`;
  const tags = paper.tags || [
    "Computer Vision",
    "Deep Learning",
    "Fruit Detection",
  ];

  React.useEffect(() => {
    setOriginAdded(false);
    setSaved(false);
  }, [paper.id]);

  return (
    <aside
      className="researcher-list-detail"
      aria-label="Selected paper details"
    >
      <div className="researcher-list-detail-flags">
        <span>Top Similarity</span>
        <span>Highly Cited</span>
        <button type="button" aria-label="More paper actions">
          <MiniIcon path="M12 5.5h.01M12 12h.01M12 18.5h.01" />
        </button>
      </div>

      <h2>{paper.title}</h2>
      <p className="researcher-list-detail-authors">{paper.authors}</p>
      <div className="researcher-list-detail-meta">
        <span>{paper.year}</span>
        <span>|</span>
        <span>{paper.citations} Citations</span>
      </div>

      <div className="researcher-list-primary-actions">
        <button
          type="button"
          onClick={navTo(
            `/researcher-search?q=${encodeURIComponent(paper.title)}`,
          )}
        >
          <MiniIcon path="M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10" />
          Open graph
        </button>
        <button type="button" onClick={navTo(detailPath)}>
          <MiniIcon path="M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4" />
          Open detail
        </button>
        <button type="button" onClick={() => onDownloadPaper?.(paper)}>
          <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
          Download DOCX
        </button>
      </div>

      <button
        type="button"
        className={`researcher-list-save ${saved ? "saved" : ""}`}
        onClick={() => setSaved((value) => !value)}
      >
        <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
        {saved ? "Saved to collection" : "Save to collection"}
      </button>

      <section className="researcher-list-open-in">
        <h3>Open in</h3>
        <div>
          <a
            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`}
            target="_blank"
            rel="noreferrer"
          >
            Google Scholar
          </a>
          <a
            href={
              paper.doi
                ? `https://doi.org/${encodeURIComponent(paper.doi)}`
                : `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`
            }
            target="_blank"
            rel="noreferrer"
          >
            <MiniIcon path="M7 4h8l3 3v13H7zM15 4v4h3M10 12h5M10 15h4" />
            DOI.org
          </a>
        </div>
      </section>

      <section className="researcher-list-tldr">
        <h3>
          <MiniIcon path="M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5" />
          S2 TL;DR
        </h3>
        <p>"{summary}"</p>
      </section>

      <section className="researcher-list-tags">
        <h3>Key metaphors &amp; trends</h3>
        <div>
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <div
        className="researcher-vision-preview"
        aria-label="Vision processing simulation preview"
      >
        <div className="researcher-vision-arm">
          <i></i>
          <i></i>
          <i></i>
        </div>
        <span>Vision Processing Simulation</span>
      </div>
      <PublicationReviewPanel publication={paper} />
    </aside>
  );
}

function ResearcherListViewPage() {
  const [selectedPaperId, setSelectedPaperId] = React.useState("bell-pepper");
  const [query, setQuery] = React.useState(getSearchParam("q") || "");
  const [sortBy, setSortBy] = React.useState("year");
  React.useEffect(() => {
    const syncUrlQuery = () => {
      const urlKeyword = getSearchParam("q") || "";
      setQuery((current) => (current === urlKeyword ? current : urlKeyword));
      setSelectedPaperId("");
    };
    window.addEventListener("scholartrend:navigate", syncUrlQuery);
    window.addEventListener("popstate", syncUrlQuery);
    syncUrlQuery();
    return () => {
      window.removeEventListener("scholartrend:navigate", syncUrlQuery);
      window.removeEventListener("popstate", syncUrlQuery);
    };
  }, []);

  const { data: listSuggestions } = useSearchSuggestions(query, 8);
  const accountPlan = getCurrentAccountPlan();
  const listApiPath = React.useMemo(() => {
    const params = new URLSearchParams({
      page: "1",
      pageSize: "10",
      sortBy,
    });
    if (query.trim()) params.set("keyword", query.trim());
    return `/api/publications/search?${params.toString()}`;
  }, [query, sortBy]);
  const { data: backendPapers, status: listStatus } = useApiResource(
    listApiPath,
    [],
    {
      auth: true,
      clearOnLoad: false,
      select: (payload) =>
        unwrapList(payload).map((paper) =>
          mapPublicationForResearcherList(
            paper,
            accountPlan.searchAccuracy,
            query,
          ),
        ),
    },
  );
  const publishedListPapers = React.useMemo(
    () =>
      getPublishedPublications().map((paper) =>
        mapPublicationForResearcherList(
          paper,
          accountPlan.searchAccuracy,
          query,
        ),
      ),
    [accountPlan.searchAccuracy, query],
  );
  const filteredPublishedListPapers = React.useMemo(() => {
    const keywordTerms = getSearchTerms(query);
    return publishedListPapers.filter((paper) =>
      matchesSearchTerms(
        `${paper.title} ${paper.authors} ${paper.summary} ${paper.tags?.join(" ")}`,
        keywordTerms,
      ),
    );
  }, [publishedListPapers, query]);
  const papersForUi = React.useMemo(() => {
    return mergePublicationsByIdOrTitle(
      filteredPublishedListPapers,
      backendPapers,
    ).sort((left, right) => {
      if (sortBy === "title") return left.title.localeCompare(right.title);
      if (sortBy === "citations") return right.citations - left.citations;
      return Number(right.year || 0) - Number(left.year || 0);
    });
  }, [filteredPublishedListPapers, backendPapers, sortBy]);
  React.useEffect(() => {
    if (papersForUi.length) {
      setSelectedPaperId(papersForUi[0].id);
    }
  }, [papersForUi]);
  const selectedPaper =
    papersForUi.find((paper) => paper.id === selectedPaperId) ||
    papersForUi[0] ||
    null;

  const downloadResults = () => {
    downloadDocxFile(
      query.trim()
        ? `${slugifyFilename(query, "scholartrend-search")}-papers.docx`
        : "scholartrend-search-papers.docx",
      buildSearchResultsDocxData(papersForUi, query),
    );
  };
  const downloadPaper = (paper) => {
    if (!paper) return;
    downloadDocxFile(
      `${slugifyFilename(paper.title)}.docx`,
      buildPaperDocxData(paper, query),
    );
  };
  const exportReferences = (format) =>
    downloadReferenceExport({
      format,
      ids: papersForUi.map((paper) => paper.id),
      query,
    }).catch(() => {});

  return (
    <ResearcherShell
      activeRoute="/researcher-search"
      topbar="list"
      pageClassName="researcher-list-view-page"
      mainClassName="researcher-list-shell-main"
    >
      <div className="researcher-list-workspace">
        <section className="researcher-list-results">
          <header className="researcher-list-heading">
            <div>
              <h1>
                {query.trim()
                  ? listStatus === "loading"
                    ? `Searching "${query.trim()}"...`
                    : `Search results for "${query.trim()}"`
                  : "DeepFruits: A Fruit Detection System"}
              </h1>
              <p>
                Knowledge Graph <span>&gt;</span> <strong>List View</strong>
              </p>
            </div>
            <div>
              <button type="button" onClick={downloadResults}>
                <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
                Download Papers
              </button>
              <button type="button" onClick={() => exportReferences("bibtex")}>
                <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
                BibTeX
              </button>
              <button type="button" onClick={() => exportReferences("ris")}>
                <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
                RIS
              </button>
              <label className="researcher-list-inline-filter">
                <span>Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Keyword, title, author..."
                  list="researcher-list-search-suggestions"
                />
                <datalist id="researcher-list-search-suggestions">
                  {listSuggestions.map((suggestion) => (
                    <option value={suggestion} key={suggestion} />
                  ))}
                </datalist>
              </label>
              <label className="researcher-list-inline-filter">
                <span>Sort</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="year">Year</option>
                  <option value="citations">Citations</option>
                  <option value="title">Title</option>
                </select>
              </label>
              <button
                type="button"
                aria-label="Close list view"
                onClick={navTo("/researcher-search")}
              >
                <MiniIcon path="M6 6l12 12M18 6 6 18" />
              </button>
            </div>
          </header>

          <div className="researcher-list-table-wrap">
            <table className="researcher-list-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Authors</th>
                  <th>Year</th>
                  <th>Citations</th>
                  <th>References</th>
                  <th>Similarity</th>
                </tr>
              </thead>
              <tbody>
                {listStatus === "loading" ? (
                  <tr>
                    <td colSpan="6">Loading publications...</td>
                  </tr>
                ) : papersForUi.length ? (
                  papersForUi.map((paper) => (
                    <tr
                      className={paper.id === selectedPaperId ? "selected" : ""}
                      key={paper.id}
                      onClick={() => setSelectedPaperId(paper.id)}
                    >
                      <td>
                        <button type="button">{paper.title}</button>
                      </td>
                      <td>{paper.authors}</td>
                      <td>{paper.year}</td>
                      <td>{paper.citations}</td>
                      <td>{paper.references}</td>
                      <td>
                        <span className="researcher-list-similarity">
                          <i style={{ width: `${paper.similarity}%` }}></i>
                        </span>
                        <strong>{paper.similarity.toFixed(1)}</strong>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No publications matched this search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedPaper ? (
          <ResearcherListDetail
            paper={selectedPaper}
            onDownloadPaper={downloadPaper}
          />
        ) : (
          <aside
            className="researcher-list-detail"
            aria-label="Selected paper details"
          >
            <h2>
              {listStatus === "loading"
                ? "Loading selected paper..."
                : "No paper selected"}
            </h2>
            <p className="researcher-list-detail-authors">
              {listStatus === "loading"
                ? "Fetching real publication data from connected sources."
                : "Try another keyword or switch back to All Sources."}
            </p>
          </aside>
        )}
      </div>
    </ResearcherShell>
  );
}

function ResearcherSearchPage() {
  const view = new URLSearchParams(window.location.search).get("view");
  const [graphQuery, setGraphQuery] = React.useState(
    () => getSearchParam("q") || "",
  );
  React.useEffect(() => {
    const syncQuery = () => setGraphQuery(getSearchParam("q") || "");
    window.addEventListener("scholartrend:navigate", syncQuery);
    window.addEventListener("popstate", syncQuery);
    return () => {
      window.removeEventListener("scholartrend:navigate", syncQuery);
      window.removeEventListener("popstate", syncQuery);
    };
  }, []);
  const accountPlan = getCurrentAccountPlan();
  const graphApiPath = React.useMemo(() => {
    const params = new URLSearchParams({
      page: "1",
      pageSize: String(graph3DNodes.length),
      sortBy: "citations",
    });
    if (graphQuery.trim()) params.set("keyword", graphQuery.trim());
    return `/api/publications/search?${params.toString()}`;
  }, [graphQuery]);
  const { data: backendGraphPublications } = useApiResource(
    graphApiPath,
    [],
    {
      auth: true,
      select: (payload) => unwrapList(payload),
    },
  );
  const localPublishedPublications = React.useMemo(
    () => getPublishedPublications(),
    [],
  );
  const graphNodesForUi = React.useMemo(() => {
    const realPublications = mergePublicationsByIdOrTitle(
      backendGraphPublications,
      localPublishedPublications,
    );
    return createApiBackedGraphNodes(
      realPublications,
      accountPlan.searchAccuracy,
    );
  }, [
    backendGraphPublications,
    localPublishedPublications,
    accountPlan.searchAccuracy,
  ]);
  const [selectedNodeId, setSelectedNodeId] = React.useState(
    graphNodesForUi[0]?.id || "deepfruits",
  );
  const selectedNode = React.useMemo(
    () =>
      graphNodesForUi.find((node) => node.id === selectedNodeId) ||
      graphNodesForUi[0] || null,
    [selectedNodeId, graphNodesForUi],
  );

  if (view === "list") return <ResearcherListViewPage />;

  return (
    <ResearcherShell
      activeRoute="/researcher-search"
      topbar="graph"
      pageClassName="researcher-search-page"
      mainClassName="researcher-graph-main"
    >
      <div className="researcher-graph-layout">
        {selectedNode ? (
          <>
            <KnowledgeGraphCanvas
              nodes={graphNodesForUi}
              selectedNodeId={selectedNode.id}
              onSelectNode={setSelectedNodeId}
            />
            <ResearcherPaperPanel selectedNode={selectedNode} />
          </>
        ) : (
          <section className="knowledge-graph-panel researcher-graph-empty">
            <h2>No real publications found</h2>
            <p>Try another title, author, keyword, or DOI.</p>
          </section>
        )}
      </div>
    </ResearcherShell>
  );
}

function SearchFilterPanel({ filters, onChangeFilters, onClearFilters }) {
  const { data: filterSuggestions } = useSearchSuggestions(filters.keyword, 8);
  const keywordChips = filters.keyword
    ? filters.keyword
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : ["Machine Learning", "Neural Networks"];

  return (
    <aside className="search-filter-panel" aria-label="Search filters">
      <div className="search-filter-heading">
        <h2>
          <MiniIcon path="M5 7h14M8 12h8M10 17h4" />
          Filters
        </h2>
        <button type="button" onClick={onClearFilters}>
          Clear All
        </button>
      </div>

      <section className="filter-card">
        <h3>
          <MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />
          Publication Year
        </h3>
        <div className="year-range">
          <input
            type="number"
            value={filters.yearFrom}
            onChange={(event) =>
              onChangeFilters({ yearFrom: event.target.value })
            }
            aria-label="From year"
          />
          <span>-</span>
          <input
            type="number"
            value={filters.yearTo}
            onChange={(event) =>
              onChangeFilters({ yearTo: event.target.value })
            }
            aria-label="To year"
          />
        </div>
      </section>

      <section className="filter-card">
        <h3>
          <MiniIcon path="M5 7c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3ZM5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
          Data Source
        </h3>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "All Sources"}
            onChange={() => onChangeFilters({ source: "All Sources" })}
          />{" "}
          All Sources
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "Google Scholar"}
            onChange={() => onChangeFilters({ source: "Google Scholar" })}
          />{" "}
          Google Scholar
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "Semantic Scholar"}
            onChange={() => onChangeFilters({ source: "Semantic Scholar" })}
          />{" "}
          Semantic Scholar
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "OpenAlex"}
            onChange={() => onChangeFilters({ source: "OpenAlex" })}
          />{" "}
          OpenAlex
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "ResearchGate"}
            onChange={() => onChangeFilters({ source: "ResearchGate" })}
          />{" "}
          ResearchGate
        </label>
      </section>

      <section className="filter-card keyword-filter-card">
        <h3>
          <MiniIcon path="M20 13.5 13.5 20 4 10.5V4h6.5l9.5 9.5ZM8 8h.01" />
          Keywords
        </h3>
        <div className="keyword-chips">
          {keywordChips.map((keyword) => (
            <span key={keyword}>
              {keyword}{" "}
              <button
                type="button"
                aria-label={`Remove ${keyword}`}
                onClick={() =>
                  onChangeFilters({
                    keyword: keywordChips
                      .filter((item) => item !== keyword)
                      .join(", "),
                  })
                }
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="keyword-entry">
          <MiniIcon path="M11 4a7 7 0 1 0 4.9 12l4.1 4" />
          <input
            type="search"
            value={filters.keyword}
            onChange={(event) =>
              onChangeFilters({ keyword: event.target.value })
            }
            placeholder="Keyword..."
            aria-label="Search keyword filter"
            list="student-search-keyword-suggestions"
          />
          <button
            type="button"
            onClick={() =>
              onChangeFilters({
                keyword: filters.keyword || "Machine Learning",
              })
            }
          >
            <MiniIcon path="M12 5v14M5 12h14" />
            Add
          </button>
          <datalist id="student-search-keyword-suggestions">
            {filterSuggestions.map((suggestion) => (
              <option value={suggestion} key={suggestion} />
            ))}
          </datalist>
        </div>
      </section>
    </aside>
  );
}

function SearchResultCard({ result, onToggleSave, onDownloadPaper }) {
  const detailPath = `/student-publication${result.id ? `?id=${encodeURIComponent(result.id)}` : ""}`;
  const sourceLink = result.externalLinks?.[0];
  return (
    <article className="search-result-card">
      <button
        className={`result-save ${result.saved ? "saved" : ""}`}
        type="button"
        aria-label={
          result.saved ? "Remove saved publication" : "Save publication"
        }
        onClick={() => onToggleSave?.(result)}
      >
        <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
      </button>
      <a
        className="result-title-link"
        href={detailPath}
        onClick={navTo(detailPath)}
      >
        <h2>{result.title}</h2>
      </a>
      <p className="result-authors">{result.authors}</p>
      <p className="result-abstract">{result.abstract}</p>
      {result.externalLinks?.length ? (
        <div className="result-source-links" aria-label="External sources">
          {result.externalLinks.map((link) => (
            <a
              href={link.href}
              key={link.label}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
      <div className="result-meta-row">
        <div className="result-meta">
          <span>
            <MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />
            {result.year}
          </span>
          <span>
            <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
            {result.source}
          </span>
          <strong>{result.citations} Citations</strong>
        </div>
        <div className="result-actions">
          <button type="button" onClick={() => onDownloadPaper?.(result)}>
            <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
            Download DOCX
          </button>
          {sourceLink ? (
            <a href={sourceLink.href} target="_blank" rel="noreferrer">
              Open Paper <span aria-hidden="true">-&gt;</span>
            </a>
          ) : (
            <a href={detailPath} onClick={navTo(detailPath)}>
              View Detail <span aria-hidden="true">-&gt;</span>
            </a>
          )}
        </div>
      </div>
      <PublicationReviewPanel publication={result} />
    </article>
  );
}

function PublicationReviewPanel({ publication }) {
  const publicationKey = String(
    publication.doi || publication.id || publication.title,
  ).trim();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [data, setData] = React.useState({
    averageCredibility: 0,
    reviewCount: 0,
    reviews: [],
  });
  const [status, setStatus] = React.useState("idle");
  const [message, setMessage] = React.useState("");
  const [reviewReactions, setReviewReactions] = React.useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("scholartrend.reviewReactions") || "{}");
    } catch {
      return {};
    }
  });

  const loadReviews = React.useCallback(async () => {
    if (!publicationKey) return;
    if (!getStoredAuth().accessToken) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const payload = await apiFetch(
        `/api/publication-reviews?publicationKey=${encodeURIComponent(publicationKey)}`,
        { auth: true, __skipClientAlert: true },
      );
      setData(payload);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [publicationKey]);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!getStoredAuth().accessToken) {
      setMessage("Please sign in to publish a review.");
      return;
    }
    if (!rating) {
      setMessage("Choose a credibility score from 1 to 5.");
      return;
    }
    if (comment.trim().length < 3) {
      setMessage("Write a comment with at least 3 characters.");
      return;
    }
    setStatus("saving");
    try {
      await apiFetch("/api/publication-reviews", {
        method: "POST",
        auth: true,
        body: {
          publicationKey,
          publicationTitle: publication.title,
          publicationAuthors:
            typeof publication.authors === "string"
              ? publication.authors
              : (publication.authors || [])
                  .map((author) => author.name || author.fullName || author)
                  .join(", "),
          publicationAbstract:
            publication.abstract || publication.summary || "",
          publicationSource:
            publication.source ||
            publication.venue ||
            publication.journalName ||
            "",
          publicationYear: Number(publication.year) || null,
          publicationDoi: publication.doi || "",
          publicationUrl:
            publication.externalLinks?.[0]?.href ||
            publication.accessPoints?.[0]?.href ||
            publication.sourceUrl ||
            "",
          credibilityRating: rating,
          comment: comment.trim(),
        },
      });
      setComment("");
      setMessage("Your review is now visible to other users.");
      await loadReviews();
    } catch (error) {
      setStatus("ready");
      setMessage(error.message);
    }
  };

  const reactToReview = (reviewId, reaction) => {
    setReviewReactions((current) => {
      const next = {
        ...current,
        [reviewId]: current[reviewId] === reaction ? null : reaction,
      };
      window.localStorage.setItem(
        "scholartrend.reviewReactions",
        JSON.stringify(next),
      );
      return next;
    });
  };

  return (
    <section className="publication-review-panel">
      <button
        type="button"
        className="review-summary-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="review-star" aria-hidden="true">★</span>
        <strong>
          {data.reviewCount
            ? `${Number(data.averageCredibility).toFixed(1)}/5 credibility`
            : "Not rated yet"}
        </strong>
        <span>
          {data.reviewCount} {data.reviewCount === 1 ? "review" : "reviews"}
        </span>
        <b>{open ? "Hide" : "View & review"}</b>
      </button>
      {open ? (
        <div className="review-panel-content">
          <form className="review-compose" onSubmit={submitReview}>
            <div>
              <strong>How credible is this paper?</strong>
              <span>Rate the source quality and research reliability.</span>
            </div>
            <div className="credibility-rating" aria-label="Credibility rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  className={value <= rating ? "active" : ""}
                  aria-label={`${value} out of 5`}
                  onClick={() => setRating(value)}
                  key={value}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              maxLength={2000}
              placeholder="Share why you consider this paper credible or what readers should verify..."
              onChange={(event) => setComment(event.target.value)}
            />
            <div className="review-compose-footer">
              <small>{comment.length}/2000</small>
              <button type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Publishing..." : "Publish Review"}
              </button>
            </div>
            {message ? <p>{message}</p> : null}
          </form>
          <div className="review-list">
            {status === "loading" ? <p>Loading reviews...</p> : null}
            {status !== "loading" && !data.reviews?.length ? (
              <p>No comments yet. Be the first reviewer.</p>
            ) : null}
            {(data.reviews || []).map((review) => (
              <article key={review.id}>
                <header>
                  <strong>{review.reviewerName}</strong>
                  <span>{review.reviewerRole}</span>
                  <b>{review.credibilityRating}/5 ★</b>
                </header>
                <p>{review.comment}</p>
                <time>{formatAdminDateTime(review.updatedAt, "")}</time>
                <div className="review-reaction-controls">
                  <button
                    type="button"
                    className={reviewReactions[review.id] === "like" ? "active like" : ""}
                    aria-pressed={reviewReactions[review.id] === "like"}
                    onClick={() => reactToReview(review.id, "like")}
                  >
                    <span aria-hidden="true">👍</span> Like
                  </button>
                  <button
                    type="button"
                    className={reviewReactions[review.id] === "dislike" ? "active dislike" : ""}
                    aria-pressed={reviewReactions[review.id] === "dislike"}
                    onClick={() => reactToReview(review.id, "dislike")}
                  >
                    <span aria-hidden="true">👎</span> Dislike
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StudentSearchPage() {
  const [localBookmarks, setLocalBookmarkState] = React.useState(() =>
    getLocalBookmarks(),
  );
  const [bookmarkMessage, setBookmarkMessage] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState(() => ({
    keyword: getSearchParam("q") || "",
    yearFrom: "2010",
    yearTo: "2026",
    source: "All Sources",
    sortBy: "relevance",
  }));
  const [debouncedFilters, setDebouncedFilters] = React.useState(filters);
  React.useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedFilters(filters),
      350,
    );
    return () => window.clearTimeout(timeoutId);
  }, [filters]);
  React.useEffect(() => {
    const syncUrlQuery = () => {
      const urlKeyword = getSearchParam("q") || "";
      setFilters((current) =>
        current.keyword === urlKeyword
          ? current
          : { ...current, keyword: urlKeyword },
      );
      setPage(1);
    };

    window.addEventListener("scholartrend:navigate", syncUrlQuery);
    window.addEventListener("popstate", syncUrlQuery);
    syncUrlQuery();
    return () => {
      window.removeEventListener("scholartrend:navigate", syncUrlQuery);
      window.removeEventListener("popstate", syncUrlQuery);
    };
  }, []);
  const accountPlan = getCurrentAccountPlan();
  const searchApiPath = React.useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "10",
      sortBy: debouncedFilters.sortBy || "relevance",
    });
    const keyword = debouncedFilters.keyword.trim();
    if (keyword) params.set("keyword", keyword);
    if (debouncedFilters.yearFrom)
      params.set("yearFrom", debouncedFilters.yearFrom);
    if (debouncedFilters.yearTo) params.set("yearTo", debouncedFilters.yearTo);
    if (debouncedFilters.source && debouncedFilters.source !== "All Sources") {
      params.set("source", debouncedFilters.source);
    }
    return `/api/publications/search?${params.toString()}`;
  }, [
    page,
    debouncedFilters.keyword,
    debouncedFilters.yearFrom,
    debouncedFilters.yearTo,
    debouncedFilters.source,
    debouncedFilters.sortBy,
  ]);
  const { data: searchPageData, status: searchStatus } = useApiResource(
    searchApiPath,
    { items: [], totalCount: 0, totalPages: 1, page: 1, pageSize: 10 },
    {
      auth: true,
      clearOnLoad: false,
      select: (payload) => ({
        items: unwrapList(payload).map(mapPublicationForCard),
        totalCount: Number(payload?.totalCount ?? payload?.TotalCount ?? 0),
        totalPages: Number(payload?.totalPages ?? payload?.TotalPages ?? 1),
        page: Number(payload?.page ?? payload?.Page ?? page),
        pageSize: Number(payload?.pageSize ?? payload?.PageSize ?? 10),
      }),
    },
  );
  const backendResults = searchPageData.items;
  const publishedSearchResults = React.useMemo(
    () => getPublishedPublications().map(mapPublishedPublicationForCard),
    [],
  );
  const filteredPublishedSearchResults = React.useMemo(() => {
    const keywordTerms = getSearchTerms(filters.keyword);
    const fromYear = Number(filters.yearFrom || 0);
    const toYear = Number(filters.yearTo || 0);
    return publishedSearchResults.filter((result) => {
      const searchableText = [
        result.title,
        result.authors,
        result.abstract,
        result.source,
        ...(Array.isArray(result.tags) ? result.tags : []),
      ].join(" ");
      const matchesKeyword = matchesSearchTerms(searchableText, keywordTerms);
      const year = Number(result.year || 0);
      const matchesYearFrom = !fromYear || !year || year >= fromYear;
      const matchesYearTo = !toYear || !year || year <= toYear;
      const matchesSource =
        !filters.source ||
        filters.source === "All Sources" ||
        result.source === filters.source ||
        result.sourceApi === filters.source ||
        result.journalName === filters.source;
      return (
        matchesKeyword && matchesYearFrom && matchesYearTo && matchesSource
      );
    });
  }, [
    publishedSearchResults,
    filters.keyword,
    filters.yearFrom,
    filters.yearTo,
    filters.source,
  ]);
  // Optimize: Only merge and map saved status, backend already filtered/sorted
  const searchResultsForUi = React.useMemo(() => {
    // Backend already handles filtering and sorting, just merge with published
    const merged = mergePublicationsByIdOrTitle(
      filteredPublishedSearchResults,
      backendResults,
    );

    // Only add UI-specific fields
    return merged.map((result) => ({
      ...result,
      saved: hasLocalBookmark(result, localBookmarks),
      plan: accountPlan.plan,
      searchAccuracy: accountPlan.searchAccuracy,
      displayAccuracy: getPolicyScopedSearchAccuracy(
        result,
        filters.keyword,
        accountPlan.searchAccuracy,
      ),
    }));
  }, [
    backendResults,
    filteredPublishedSearchResults,
    localBookmarks,
    filters.keyword,
    accountPlan.searchAccuracy,
  ]);

  const handleToggleSearchSave = async (result) => {
    const nextSaved = !hasLocalBookmark(result, localBookmarks);
    const nextLocalBookmarks = nextSaved
      ? upsertLocalBookmark(result)
      : removeLocalBookmark(result);
    setLocalBookmarkState(nextLocalBookmarks);
    setBookmarkMessage(
      nextSaved
        ? `Saved "${result.title}" to bookmarks.`
        : `Removed "${result.title}" from bookmarks.`,
    );

    if (isBackendNumericId(result.id) && getStoredAuth().accessToken) {
      apiFetch(`/api/bookmarks/${result.id}`, {
        method: nextSaved ? "POST" : "DELETE",
        auth: true,
      }).catch(() => {});
    }
  };
  const downloadStudentPaper = (result) => {
    if (!result) return;
    downloadDocxFile(
      `${slugifyFilename(result.title)}.docx`,
      buildPaperDocxData(result, filters.keyword),
    );
  };
  const handleChangeFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters({
      keyword: "",
      yearFrom: "2010",
      yearTo: "2026",
      source: "All Sources",
      sortBy: "relevance",
    });
    setPage(1);
  };
  const totalSearchPages = Math.max(1, searchPageData.totalPages || 1);
  const totalSearchCount =
    searchPageData.totalCount || searchResultsForUi.length;
  const emptySourceLinks = React.useMemo(() => {
    const query = filters.keyword.trim();
    if (!query) return [];
    const links = buildExternalSourceLinks({ title: query });
    if (!filters.source || filters.source === "All Sources") return links;
    return links.filter((link) => link.label === filters.source);
  }, [filters.keyword, filters.source]);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalSearchPages) },
    (_, index) => {
      const start = Math.max(1, Math.min(page - 2, totalSearchPages - 4));
      return start + index;
    },
  ).filter((number) => number <= totalSearchPages);

  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-search" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              <a
                href="/student-dashboard"
                onClick={navTo("/student-dashboard")}
              >
                Dashboard
              </a>
              <span>&gt;</span>
              <strong>Search Results</strong>
            </div>
          }
          searchValue={filters.keyword}
          wideSearch
        />

        <div className="student-content search-content">
          <h1 className="search-page-title">Publication Search</h1>
          <div className="search-layout">
            <SearchFilterPanel
              filters={filters}
              onChangeFilters={handleChangeFilters}
              onClearFilters={clearFilters}
            />

            <section
              className="search-results-area"
              aria-label="Publication search results"
            >
              {bookmarkMessage ? (
                <p className="bookmark-save-message" role="status">
                  {bookmarkMessage}{" "}
                  <a
                    href="/student-bookmarks"
                    onClick={navTo("/student-bookmarks")}
                  >
                    Open bookmarks
                  </a>
                </p>
              ) : null}
              <div className="search-results-toolbar">
                <p>
                  {searchStatus === "loading"
                    ? "Loading publications..."
                    : `Found ${formatCount(totalSearchCount)} publications`}
                </p>
                <label>
                  <span>Sort by:</span>
                  <select
                    value={filters.sortBy}
                    onChange={(event) =>
                      handleChangeFilters({ sortBy: event.target.value })
                    }
                  >
                    <option value="relevance">Relevance</option>
                    <option value="year">Publication Year</option>
                    <option value="citations">Citation Count</option>
                  </select>
                </label>
              </div>

              <div className="search-results-list">
                {searchResultsForUi.length ? (
                  searchResultsForUi.map((result) => (
                    <SearchResultCard
                      result={result}
                      onToggleSave={handleToggleSearchSave}
                      onDownloadPaper={downloadStudentPaper}
                      key={result.title}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <p>
                      {searchStatus === "loading"
                        ? "Loading publications..."
                        : "No publications matched your filters."}
                    </p>
                    {searchStatus !== "loading" && emptySourceLinks.length ? (
                      <div
                        className="result-source-links"
                        aria-label="Search external sources"
                      >
                        {emptySourceLinks.map((link) => (
                          <a
                            href={link.href}
                            key={link.label}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open {link.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="pagination-row">
                <p>
                  Showing{" "}
                  {searchResultsForUi.length
                    ? (page - 1) * searchPageData.pageSize + 1
                    : 0}
                  -
                  {(page - 1) * searchPageData.pageSize +
                    searchResultsForUi.length}{" "}
                  of {formatCount(totalSearchCount)} results
                </p>
                <nav className="pagination" aria-label="Search result pages">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    &lt;
                  </button>
                  {pageNumbers.map((number) => (
                    <button
                      className={number === page ? "active" : ""}
                      type="button"
                      onClick={() => setPage(number)}
                      key={number}
                    >
                      {number}
                    </button>
                  ))}
                  {totalSearchPages > pageNumbers[pageNumbers.length - 1] ? (
                    <span>...</span>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalSearchPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalSearchPages, current + 1),
                      )
                    }
                  >
                    &gt;
                  </button>
                </nav>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function BookmarkPaperCard({
  paper,
  detailPath = "/student-publication",
  onRemove,
}) {
  const paperDetailPath = getBookmarkDetailPath(detailPath, paper);
  return (
    <article className="bookmark-paper-card">
      <a
        className="bookmark-title-link"
        href={paperDetailPath}
        onClick={navTo(paperDetailPath)}
      >
        <h2>{paper.title}</h2>
      </a>
      <p>{paper.excerpt}</p>
      <div className="bookmark-paper-meta">
        <span>
          <MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />
          {paper.date}
        </span>
        <span>
          <MiniIcon path="M4 14.5 9 10l3.2 2.7L20 5.5M17 5.5h3v3" />
          {paper.citations} Citations
        </span>
        <span>
          <MiniIcon path="M4 15.5 9.2 10l3.4 3L20 6.5" />
          Impact: {paper.impact}
        </span>
      </div>
      <a
        className="bookmark-open"
        href={paperDetailPath}
        onClick={navTo(paperDetailPath)}
      >
        Open detail
        <MiniIcon path="M9 5l7 7-7 7" />
      </a>
      {onRemove ? (
        <button
          type="button"
          className="bookmark-remove"
          onClick={() => onRemove(paper)}
        >
          Remove
        </button>
      ) : null}
    </article>
  );
}

function FollowSuggestionsSection() {
  const [followedKeywordIds, setFollowedKeywordIds] = React.useState([]);
  const { data: suggestions } = useApiResource("/api/follows/suggestions", [], {
    auth: true,
    select: (payload) => (Array.isArray(payload) ? payload : []),
  });

  const followKeyword = (keyword) => {
    if (!isBackendNumericId(keyword.id)) return;
    setFollowedKeywordIds((current) => [...new Set([...current, keyword.id])]);
    apiFetch(`/api/follows/keyword/${keyword.id}`, {
      method: "POST",
      auth: true,
    }).catch(() => {
      setFollowedKeywordIds((current) =>
        current.filter((id) => id !== keyword.id),
      );
    });
  };

  if (!suggestions.length) return null;

  return (
    <div
      className="bookmark-keyword-suggestions"
      aria-label="Suggested keywords"
    >
      {suggestions.slice(0, 6).map((keyword) => {
        const followed = followedKeywordIds.includes(keyword.id);
        return (
          <article className="bookmark-keyword-card" key={keyword.id}>
            <div className="card-header">
              <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
              <h2>{keyword.term || keyword.Term}</h2>
            </div>
            <div className="card-body">
              <span>Suggested by backend</span>
              <span className="trend-badge positive">
                {followed ? "Following" : "New"}
              </span>
            </div>
            <button
              type="button"
              className="bookmark-remove"
              disabled={followed}
              onClick={() => followKeyword(keyword)}
            >
              {followed ? "Followed" : "Follow keyword"}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function FollowJournalSuggestionsSection({
  detailPath = "/student-publication",
}) {
  const { t } = useTranslation();
  const [followedJournalIds, setFollowedJournalIds] = React.useState([]);
  const { data: journals } = useApiResource("/api/journals", [], {
    select: unwrapList,
  });

  const followJournal = (journal) => {
    if (!isBackendNumericId(journal.id)) return;
    setFollowedJournalIds((current) => [...new Set([...current, journal.id])]);
    apiFetch(`/api/follows/journal/${journal.id}`, {
      method: "POST",
      auth: true,
    }).catch(() => {
      setFollowedJournalIds((current) =>
        current.filter((id) => id !== journal.id),
      );
    });
  };

  if (!journals.length) return null;

  return (
    <div
      className="bookmark-keyword-suggestions"
      aria-label="Suggested journals"
    >
      {journals.slice(0, 4).map((journal) => {
        const id = journal.id ?? journal.Id;
        const name = journal.name || journal.Name || "Indexed Journal";
        const followed = followedJournalIds.includes(id);
        return (
          <article className="bookmark-journal-card" key={id || name}>
            <div className="card-header">
              <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
              <h2>{name}</h2>
            </div>
            <div className="card-body">
              <span>Backend journal</span>
              <span className="status-badge">
                {followed ? "Following" : "Suggested"}
              </span>
            </div>
            <button
              type="button"
              className="bookmark-remove"
              disabled={followed}
              onClick={() => followJournal({ ...journal, id })}
            >
              {followed ? "Followed" : "Follow journal"}
            </button>
            <a href={detailPath} onClick={navTo(detailPath)}>
              {t("bookmarks.viewJournal")} -&gt;
            </a>
          </article>
        );
      })}
    </div>
  );
}

function BookmarksPage({ role = "student" }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("Publications");
  const [localBookmarks, setLocalBookmarkState] = React.useState(() =>
    getLocalBookmarks(),
  );
  const [removedBookmarkKeys, setRemovedBookmarkKeyState] = React.useState(() =>
    getRemovedBookmarkKeys(),
  );
  const { data: backendBookmarkedPapers } = useApiResource(
    "/api/bookmarks",
    [],
    {
      auth: true,
      select: (payload) =>
        unwrapList(payload).map((paper) => {
          const mapped = mapPublicationForCard(paper);
          return {
            id: mapped.id,
            title: mapped.title,
            excerpt: mapped.excerpt,
            date: String(mapped.year || "N/A"),
            citations: mapped.citations,
            impact: mapped.tags?.[0] || "Indexed",
          };
        }),
    },
  );
  const bookmarkPapersForUi = mergeBookmarkLists(
    backendBookmarkedPapers,
    localBookmarks,
  ).filter((paper) => !removedBookmarkKeys.includes(getBookmarkKey(paper)));
  const { data: followedItems } = useApiResource("/api/follows", [], {
    auth: true,
    select: unwrapList,
  });
  const followedKeywords = followedItems
    .filter((item) =>
      String(item.followType || item.FollowType).includes("Keyword"),
    )
    .map((item) => ({
      id: item.id || item.Id || item.followTargetId || item.FollowTargetId,
      name:
        item.followTargetName ||
        item.FollowTargetName ||
        `Keyword ${item.followTargetId || item.FollowTargetId || ""}`.trim(),
      count: "Followed keyword",
      trend: "Tracked",
    }));
  const followedJournals = followedItems
    .filter((item) =>
      String(item.followType || item.FollowType).includes("Journal"),
    )
    .map((item) => ({
      id: item.id || item.Id || item.followTargetId || item.FollowTargetId,
      name:
        item.followTargetName ||
        item.FollowTargetName ||
        `Journal ${item.followTargetId || item.FollowTargetId || ""}`.trim(),
      impactFactor: "N/A",
      status: "Active alerts",
    }));
  const bookmarkTopicsForUi = followedKeywords.map((keyword) => ({
    name: keyword.name,
    tracked: keyword.count,
    activity: keyword.trend,
  }));
  const handleRemoveBookmark = async (paper) => {
    setLocalBookmarkState(removeLocalBookmark(paper));
    setRemovedBookmarkKeyState(markBookmarkRemoved(paper));

    if (isBackendNumericId(paper.id) && getStoredAuth().accessToken) {
      apiFetch(`/api/bookmarks/${paper.id}`, {
        method: "DELETE",
        auth: true,
      }).catch(() => {});
    }
  };
  const isAcademic = role === "researcher" || role === "lecturer";
  const rolePrefix = role === "lecturer" ? "lecturer" : "researcher";
  const detailPath = isAcademic
    ? getAcademicPath("/researcher-publication", rolePrefix)
    : "/student-publication";
  const dashboardPath = isAcademic
    ? getAcademicPath("/researcher-dashboard", rolePrefix)
    : "/student-dashboard";

  if (isAcademic) {
    return (
      <ResearcherShell
        activeRoute={getAcademicPath("/researcher-bookmarks", rolePrefix)}
        current="Bookmarks"
        pageClassName="bookmarks-page researcher-bookmarks-page"
        mainClassName="researcher-bookmarks-main"
      >
        <div className="researcher-bookmarks-content bookmarks-content">
          <h1 className="bookmarks-title">Bookmarks &amp; Followed Items</h1>

          <nav className="bookmark-tabs" aria-label="Bookmark categories">
            {bookmarkTabs.map((tab) => (
              <button
                className={activeTab === tab ? "active" : ""}
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === "Publications" && (
            <section
              className="bookmark-paper-list"
              aria-label="Bookmarked publications"
            >
              {bookmarkPapersForUi.length ? (
                bookmarkPapersForUi.map((paper) => (
                  <BookmarkPaperCard
                    paper={paper}
                    detailPath={detailPath}
                    onRemove={handleRemoveBookmark}
                    key={paper.title}
                  />
                ))
              ) : (
                <p className="empty-state">No bookmarked publications yet.</p>
              )}
            </section>
          )}

          {activeTab === "Keywords" && (
            <section
              className="bookmark-keyword-list"
              aria-label="Bookmarked keywords"
            >
              <FollowSuggestionsSection />
              {followedKeywords.map((keyword) => (
                <article className="bookmark-keyword-card" key={keyword.name}>
                  <div className="card-header">
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <h2>{keyword.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>{keyword.count}</span>
                    <span className="trend-badge positive">
                      {keyword.trend}
                    </span>
                  </div>
                  <a href={dashboardPath} onClick={navTo(dashboardPath)}>
                    View Analytics -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Journals" && (
            <section
              className="bookmark-journal-list"
              aria-label="Bookmarked journals"
            >
              <FollowJournalSuggestionsSection detailPath={detailPath} />
              {followedJournals.map((journal) => (
                <article className="bookmark-journal-card" key={journal.name}>
                  <div className="card-header">
                    <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
                    <h2>{journal.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      {t("bookmarks.impactFactor")}:{" "}
                      <strong>{journal.impactFactor}</strong>
                    </span>
                    <span className="status-badge">{journal.status}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    {t("bookmarks.viewJournal")} -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Topics" && (
            <section
              className="bookmark-topic-list"
              aria-label="Bookmarked topics"
            >
              {bookmarkTopicsForUi.map((topic) => (
                <article className="bookmark-topic-card" key={topic.name}>
                  <div className="card-header">
                    <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                    <h2>{topic.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      {t("bookmarks.tracked")}: <strong>{topic.tracked}</strong>
                    </span>
                    <span
                      className={`activity-badge ${topic.activity.includes("High") ? "high" : topic.activity.includes("Medium") ? "medium" : "low"}`}
                    >
                      {topic.activity}
                    </span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    {t("bookmarks.viewTopic")} -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}
        </div>
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app bookmarks-page">
      <StudentSidebar activeRoute="/student-bookmarks" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              <a
                href="/student-dashboard"
                onClick={navTo("/student-dashboard")}
              >
                Dashboard
              </a>
              <span>&gt;</span>
              <strong>Bookmarks</strong>
            </div>
          }
          variant="utility"
          searchPlaceholder="Search..."
        />

        <div className="student-content bookmarks-content">
          <h1 className="bookmarks-title">Bookmarks &amp; Followed Items</h1>

          <nav className="bookmark-tabs" aria-label="Bookmark categories">
            {bookmarkTabs.map((tab) => (
              <button
                className={activeTab === tab ? "active" : ""}
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === "Publications" && (
            <section
              className="bookmark-paper-list"
              aria-label="Bookmarked publications"
            >
              {bookmarkPapersForUi.length ? (
                bookmarkPapersForUi.map((paper) => (
                  <BookmarkPaperCard
                    paper={paper}
                    detailPath={detailPath}
                    onRemove={handleRemoveBookmark}
                    key={paper.title}
                  />
                ))
              ) : (
                <p className="empty-state">No bookmarked publications yet.</p>
              )}
            </section>
          )}

          {activeTab === "Keywords" && (
            <section
              className="bookmark-keyword-list"
              aria-label="Bookmarked keywords"
            >
              <FollowSuggestionsSection />
              {followedKeywords.map((keyword) => (
                <article className="bookmark-keyword-card" key={keyword.name}>
                  <div className="card-header">
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <h2>{keyword.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>{keyword.count}</span>
                    <span className="trend-badge positive">
                      {keyword.trend}
                    </span>
                  </div>
                  <a href={dashboardPath} onClick={navTo(dashboardPath)}>
                    View Analytics -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Journals" && (
            <section
              className="bookmark-journal-list"
              aria-label="Bookmarked journals"
            >
              <FollowJournalSuggestionsSection detailPath={detailPath} />
              {followedJournals.map((journal) => (
                <article className="bookmark-journal-card" key={journal.name}>
                  <div className="card-header">
                    <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
                    <h2>{journal.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      {t("bookmarks.impactFactor")}:{" "}
                      <strong>{journal.impactFactor}</strong>
                    </span>
                    <span className="status-badge">{journal.status}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    {t("bookmarks.viewJournal")} -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Topics" && (
            <section
              className="bookmark-topic-list"
              aria-label="Bookmarked topics"
            >
              {bookmarkTopicsForUi.map((topic) => (
                <article className="bookmark-topic-card" key={topic.name}>
                  <div className="card-header">
                    <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                    <h2>{topic.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      {t("bookmarks.tracked")}: <strong>{topic.tracked}</strong>
                    </span>
                    <span
                      className={`activity-badge ${topic.activity.includes("High") ? "high" : topic.activity.includes("Medium") ? "medium" : "low"}`}
                    >
                      {topic.activity}
                    </span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    {t("bookmarks.viewTopic")} -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function NotificationFilterPanel({
  activeFilters,
  onChangeFilter,
  totalCount = 0,
  unreadCount = 0,
}) {
  return (
    <aside className="notification-filters" aria-label="Notification filters">
      {notificationFilters.map((group, groupIndex) => (
        <section
          className={groupIndex > 0 ? "separated" : ""}
          key={`${group.title}-${groupIndex}`}
        >
          {group.title ? <h2>{group.title}</h2> : null}
          <div className="notification-filter-options">
            {group.options.map((option) => (
              <button
                type="button"
                className={
                  activeFilters[groupIndex] === option.label ? "active" : ""
                }
                key={option.label}
                onClick={() => onChangeFilter(groupIndex, option.label)}
              >
                <i aria-hidden="true"></i>
                <span>{option.label}</span>
                {groupIndex === 0 ? (
                  <b>
                    {option.label === "Unread" ? unreadCount : totalCount}
                  </b>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}

function renderFormattedText(text) {
  if (!text) return "";
  const parts = text.split(/("[^"]*")/g);
  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return <i key={index}>{part}</i>;
    }
    const subParts = part.split(
      /(Deep Learning|Nature Physics|ArXiv|Semantic Scholar|OpenAlex)/g,
    );
    return subParts.map((subPart, subIndex) => {
      if (
        subPart === "Deep Learning" ||
        subPart === "Nature Physics" ||
        subPart === "ArXiv" ||
        subPart === "Semantic Scholar" ||
        subPart === "OpenAlex"
      ) {
        return (
          <span className="text-link" key={`${index}-${subIndex}`}>
            {subPart}
          </span>
        );
      }
      return subPart;
    });
  });
}

function NotificationCard({ item, onOpen, onToggleBookmark }) {
  const displayTitle = String(item.title || "Notification")
    .replace(/^(NOTICE|REJECTED|REVIEW|NEW RESEARCH|SYNC COMPLETE|TREND SPIKE):\s*/i, "")
    .trim();

  return (
    <article
      role="button"
      tabIndex={0}
      className={`notification-card ${item.tone} ${item.unread ? "unread" : ""}`}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
    >
      <div className={`notification-icon ${item.tone}`}>
        <MiniIcon path={item.icon} />
      </div>
      <div className="notification-body">
        <div className="notification-card-heading">
          <div className="notification-source">
            <span className={item.fromAdmin ? "admin" : ""}>
              {item.source || "ScholarTrend System"}
            </span>
            {item.unread ? <b>New</b> : null}
          </div>
          <time>{item.time}</time>
        </div>
        <div className="notification-meta">
          <span>{item.type}</span>
        </div>
        <h3>{displayTitle}</h3>
        <p>{renderFormattedText(item.text)}</p>
      </div>
      {item.bookmarked ? (
        <button
          type="button"
          className="notification-bookmark"
          aria-label="Save notification"
          onClick={(event) => {
            event.stopPropagation();
            onToggleBookmark(item.id);
          }}
        >
          <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
        </button>
      ) : (
        <span className="notification-open-indicator" aria-hidden="true">
          <MiniIcon path="M9 5l7 7-7 7" />
        </span>
      )}
    </article>
  );
}

function NotificationDetailPanel({ item, route, onClose }) {
  if (!item) return null;

  const canOpenRoute = Boolean(route);

  return (
    <div
      className="notification-detail-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-detail-title"
      onClick={onClose}
    >
      <section
        className={`notification-detail-panel ${item.tone || "gray"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="notification-detail-header">
          <div className={`notification-icon ${item.tone || "gray"}`}>
            <MiniIcon path={item.icon} />
          </div>
          <div>
            <div className="notification-detail-source">
              <span className={item.fromAdmin ? "admin" : ""}>
                {item.source || "ScholarTrend System"}
              </span>
              <b>{item.type}</b>
            </div>
            <h2 id="notification-detail-title">
              {item.title || "Notification"}
            </h2>
            <time>{item.time}</time>
          </div>
          <button
            type="button"
            className="notification-detail-close"
            aria-label="Close notification detail"
            onClick={onClose}
          >
            <MiniIcon path="M6 6l12 12M18 6 6 18" />
          </button>
        </header>

        <div className="notification-detail-body">
          <p>{item.text}</p>
        </div>

        <footer className="notification-detail-actions">
          {canOpenRoute ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                goToRoute(route);
              }}
            >
              Open related page
              <MiniIcon path="M9 5l7 7-7 7" />
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}

const extraNotificationItems = [
  {
    id: "new-research-regularization",
    type: "NEW PUBLICATION",
    time: "4 days ago",
    title: "NEW RESEARCH:",
    text: 'Dr. Elena Rostova published "Topological Regularization in Deep Autoencoders" in Nature Computational Science.',
    icon: "M7 4.5h8.5L19 8v12H7zM15.5 4.5V8H19M10 12h5M10 15h6M10 18h3M4 7.5v12h3",
    tone: "purple-soft",
    unread: false,
    route: "/researcher-search?view=list",
  },
  {
    id: "system-semantic-sync",
    type: "SYSTEM ALERT",
    time: "5 days ago",
    title: "SYNC COMPLETE:",
    text: "14,200 new publications were successfully synchronized from Semantic Scholar API.",
    icon: "M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8L20 6M17 16.5a6 6 0 0 1-10.2 2.8L4 18",
    tone: "gray",
    unread: false,
    route: "/researcher-sync-management",
  },
  {
    id: "trend-single-cell-rna",
    type: "TREND ALERT",
    time: "1 week ago",
    title: "TREND SPIKE:",
    text: 'Keyword "Single-cell RNA" citation velocity increased by 28% in computational biology journals.',
    icon: "M4 17.5 9 12l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14M7 16v4M12 14v6M17 11v9",
    tone: "green",
    unread: false,
    route: "/researcher-trend-tracking",
  },
];

const getNotificationTypeLabel = (type) => {
  const normalized = String(type || "SYSTEM").toUpperCase();
  if (normalized === "NEW_PUBLICATION") return "PUBLICATION NOTICE";
  if (normalized === "SYSTEM") return "SYSTEM ALERT";
  return normalized.replaceAll("_", " ");
};

const mapBackendNotificationForUi = (item, role) => ({
  id: item.id,
  type: getNotificationTypeLabel(item.notificationType),
  time: item.createdAt
    ? new Date(item.createdAt).toLocaleString()
    : "Just now",
  title: item.title || "NOTICE:",
  text: item.message || "",
  icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
  tone: item.isRead ? "gray" : "green",
  unread: !item.isRead,
  source: item.batchId ? "ScholarTrend Admin" : "ScholarTrend System",
  fromAdmin: Boolean(item.batchId),
  route:
    item.route ||
    `/${
      role === "lecturer"
        ? "lecturer"
        : role === "researcher"
          ? "researcher"
          : "student"
    }-search?view=list`,
});

function NotificationsPage({ role = "student" }) {
  const acknowledgedNotificationIds = React.useRef(new Set());
  const session = React.useMemo(() => {
    try {
      return JSON.parse(
        window.localStorage.getItem("scholartrend.session") || "{}",
      );
    } catch {
      return {};
    }
  }, []);
  const { data: loadedBackendNotifications } = useApiResource(
    "/api/notifications",
    [],
    {
      auth: true,
      select: (payload) =>
        unwrapList(payload).map((item) =>
          mapBackendNotificationForUi(item, role),
        ),
    },
  );
  const [backendNotifications, setBackendNotifications] = React.useState([]);
  React.useEffect(() => {
    setBackendNotifications(loadedBackendNotifications);
  }, [loadedBackendNotifications]);
  React.useEffect(() => {
    backendNotifications.forEach((item) => {
      const id = Number(item.id);
      if (!Number.isInteger(id) || acknowledgedNotificationIds.current.has(id)) return;
      acknowledgedNotificationIds.current.add(id);
      apiFetch(`/api/notifications/${id}/ack`, { method: "POST", auth: true }).catch(
        () => acknowledgedNotificationIds.current.delete(id),
      );
    });
  }, [backendNotifications]);
  const mapReviewNotifications = React.useCallback(() => {
    const sessionEmail = String(session.email || "").toLowerCase();
    return getPublicationReviewNotifications()
      .map(normalizeLocalNotification)
      .filter((item) => {
        return notificationMatchesRecipient(item, role, sessionEmail);
      })
      .map((item) => ({
        id: item.id,
        type: item.type,
        time: item.createdAt
          ? new Date(item.createdAt).toLocaleString()
          : "Just now",
        title: item.title,
        text: item.text,
        icon: "M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01",
        tone: "red",
        unread: item.unread,
        route: item.route,
        localReview: true,
        source: "ScholarTrend Editorial",
        fromAdmin: true,
      }));
  }, [role, session.email]);
  const [notifications, setNotifications] = React.useState(() => [
    ...mapReviewNotifications(),
  ]);
  const [hasMore, setHasMore] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState({
    0: "All Notifications",
    1: "Any Time",
  });
  const [selectedNotification, setSelectedNotification] = React.useState(null);
  const isResearcher = role === "researcher" || role === "lecturer";
  const isAcademic = isResearcher;
  const rolePrefix =
    role === "lecturer"
      ? "lecturer"
      : role === "researcher"
        ? "researcher"
        : "student";
  const roleNotificationsPath = `/${rolePrefix}-notifications`;

  React.useEffect(() => {
    let cancelled = false;
    const applyNotifications = (
      localItems = getPublicationReviewNotifications(),
    ) => {
      const scopedLocalItems = mergeNotificationsById(localItems).filter(
        (item) => notificationMatchesRecipient(item, role, session.email || ""),
      );
      const mappedLocalItems = scopedLocalItems.map((item) => ({
        id: item.id,
        type: item.type,
        time: item.createdAt
          ? new Date(item.createdAt).toLocaleString()
          : "Just now",
        title: item.title,
        text: item.text,
        icon: "M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01",
        tone: "red",
        unread: item.unread,
        route: item.route,
        localReview: true,
        source: "ScholarTrend Editorial",
        fromAdmin: true,
      }));
      setNotifications([...mappedLocalItems, ...backendNotifications]);
      setHasMore(false);
    };
    const loadHelperNotifications = () =>
      fetchLocalNotificationsFromAuthHelper({
        role,
        email: session.email || "",
      })
        .then((helperNotifications) => {
          if (cancelled) return;
          const mergedLocal = persistLocalNotifications([
            ...helperNotifications,
            ...getPublicationReviewNotifications(),
          ]);
          applyNotifications(mergedLocal);
        })
        .catch(() => {});
    const loadBackendNotifications = () =>
      apiFetch("/api/notifications", { auth: true })
        .then((payload) => {
          if (cancelled) return;
          setBackendNotifications(
            unwrapList(payload).map((item) =>
              mapBackendNotificationForUi(item, role),
            ),
          );
        })
        .catch(() => {});

    applyNotifications();
    loadHelperNotifications();

    const refreshLocalNotifications = () => applyNotifications();
    const refreshOnFocus = () => loadHelperNotifications();
    const refreshOnVisibility = () => {
      if (document.visibilityState === "visible") loadHelperNotifications();
    };
    const intervalId = window.setInterval(() => {
      loadHelperNotifications();
      loadBackendNotifications();
    }, 5000);
    window.addEventListener(
      "scholartrend:notifications",
      refreshLocalNotifications,
    );
    window.addEventListener("storage", refreshLocalNotifications);
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(
        "scholartrend:notifications",
        refreshLocalNotifications,
      );
      window.removeEventListener("storage", refreshLocalNotifications);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
    };
  }, [backendNotifications, role, session.email]);

  const handleLoadMore = () => {
    setHasMore(false);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, unread: false })),
    );
    setPublicationReviewNotifications(
      getPublicationReviewNotifications().map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
    markLocalNotificationsReadOnAuthHelper().catch(() => {});
    try {
      await apiFetch("/api/notifications/read-all", {
        method: "PUT",
        auth: true,
      });
    } catch {
      // Keep local read state when user is browsing without a backend token.
    }
  };

  const handleChangeFilter = (groupIndex, value) => {
    setActiveFilters((current) => ({
      ...current,
      [groupIndex]: value,
    }));
  };

  const resolveNotificationRoute = (item) => {
    if (item.route) {
      const recipientSafeRoute = getSafeRecipientRoute(item.route, rolePrefix);
      if (
        /^\/(student|lecturer|researcher)-notifications/.test(
          recipientSafeRoute,
        )
      ) {
        return roleNotificationsPath;
      }
      return getAcademicPath(recipientSafeRoute, rolePrefix);
    }
    if (rolePrefix === "student") {
      if (item.type.includes("SYSTEM")) return "/student-notifications";
      if (item.type.includes("TREND")) return "/student-search";
      return "/student-search";
    }

    return getAcademicPath(item.route || "/researcher-search", rolePrefix);
  };

  const handleOpenNotification = (item) => {
    const openedNotification = { ...item, unread: false };
    setSelectedNotification(openedNotification);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === item.id
          ? { ...notification, unread: false }
          : notification,
      ),
    );
    if (item.localReview) {
      const existingLocalNotifications = getPublicationReviewNotifications();
      const storedNotification = existingLocalNotifications.find(
        (notification) => notification.id === item.id,
      );
      const next = existingLocalNotifications.map((notification) =>
        notification.id === item.id
          ? { ...notification, unread: false }
          : notification,
      );
      setPublicationReviewNotifications(next);
      if (storedNotification) {
        mirrorLocalNotificationToAuthHelper({
          ...storedNotification,
          unread: false,
        }).catch(() => {});
      }
    }
    const backendNotificationId = Number(item.id);
    if (Number.isInteger(backendNotificationId)) {
      apiFetch(`/api/notifications/${backendNotificationId}/read`, {
        method: "PUT",
        auth: true,
      }).catch(() => {});
    }
  };

  const handleToggleBookmark = (itemId) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === itemId
          ? { ...notification, bookmarked: !notification.bookmarked }
          : notification,
      ),
    );
  };

  const filteredNotifications = notifications.filter((item) => {
    const readFilter = activeFilters[0];
    if (readFilter === "Unread" && !item.unread) return false;

    const timeFilter = activeFilters[1];
    if (timeFilter === "Today") {
      return (
        item.time === "Just now" ||
        item.time.includes("mins") ||
        item.time.includes("hours")
      );
    }
    if (timeFilter === "This Week") {
      return !item.time.includes("week");
    }

    return true;
  });
  const selectedRoute = selectedNotification
    ? resolveNotificationRoute(selectedNotification)
    : "";
  const detailRoute =
    selectedRoute && selectedRoute !== roleNotificationsPath
      ? selectedRoute
      : "";

  const pageContent = (
    <div
      className={
        isAcademic
          ? "researcher-notifications-content notifications-content"
          : "student-content notifications-content"
      }
    >
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Messages from ScholarTrend Admin, editorial reviews, and system updates.</p>
        </div>
        <div className="notifications-header-actions">
          <div className="notification-summary" aria-label="Notification summary">
            <span><b>{notifications.filter((item) => item.unread).length}</b> unread</span>
            <span><b>{notifications.length}</b> total</span>
          </div>
          <button
            type="button"
            className="mark-read-button"
            onClick={handleMarkAllRead}
            disabled={!notifications.some((item) => item.unread)}
          >
            <MiniIcon path="M5 12.5 9 16.5 19 6.5" />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="notifications-layout">
        <NotificationFilterPanel
          activeFilters={activeFilters}
          onChangeFilter={handleChangeFilter}
          totalCount={notifications.length}
          unreadCount={notifications.filter((item) => item.unread).length}
        />
        <section className="notification-list" aria-label="Notifications list">
          {filteredNotifications.length ? (
            filteredNotifications.map((item, index) => (
              <NotificationCard
                item={item}
                key={`${item.type}-${item.time}-${index}`}
                onOpen={handleOpenNotification}
                onToggleBookmark={handleToggleBookmark}
              />
            ))
          ) : (
            <div className="notification-empty-state">
              <div className="notification-icon gray">
                <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
              </div>
              <h2>No notifications found</h2>
              <p>Try another filter or check back later.</p>
            </div>
          )}
          {hasMore ? (
            <button
              type="button"
              className="load-more-button"
              onClick={handleLoadMore}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                cursor: "pointer",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  pointerEvents: "none",
                }}
              >
                Load More
              </span>
            </button>
          ) : (
            filteredNotifications.length ? (
              <div className="no-more-notifications">
                You are all caught up
              </div>
            ) : null
          )}
        </section>
      </div>
      <NotificationDetailPanel
        item={selectedNotification}
        route={detailRoute}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );

  if (isResearcher) {
    return (
      <ResearcherShell
        activeRoute={getAcademicPath("/researcher-notifications", rolePrefix)}
        current="Notifications"
        pageClassName="notifications-page researcher-notifications-page"
        mainClassName="researcher-notifications-main"
      >
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app notifications-page">
      <StudentSidebar activeRoute="/student-notifications" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              <a
                href="/student-dashboard"
                onClick={navTo("/student-dashboard")}
              >
                Dashboard
              </a>
              <span>&gt;</span>
              <strong>Notifications</strong>
            </div>
          }
          variant="utility"
          searchPlaceholder="Search ScholarTrend..."
        />
        {pageContent}
      </section>
    </main>
  );
}

function ProfileTabs({ activeTab, setActiveTab }) {
  return (
    <nav className="profile-tabs" aria-label="Profile settings">
      {profileTabs.map((tab) => (
        <button
          className={activeTab === tab.label ? "active" : ""}
          type="button"
          key={tab.label}
          onClick={() => setActiveTab(tab.label)}
        >
          <MiniIcon path={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  readOnly = false,
  locked = false,
  type = "text",
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <span className={`profile-input ${locked ? "locked" : ""}`}>
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
        {locked ? (
          <MiniIcon path="M6 10h12v9H6zM8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" />
        ) : null}
      </span>
    </label>
  );
}

function ProfilePage({ role = "student" }) {
  const accountSession = getStoredSession();
  const accountEmail = String(accountSession.email || "")
    .trim()
    .toLowerCase();
  const accountRole = normalizeRoleForUi(accountSession.role || role);
  const [activeTab, setActiveTab] = React.useState(() =>
    new URLSearchParams(window.location.search).get("tab") ===
    "academic-identity"
      ? "Academic Identity"
      : "Personal Info",
  );
  const [identityConnections, setIdentityConnections] = React.useState(() => {
    const saved = window.localStorage.getItem(
      `scholartrend.${role}.identityConnections`,
    );
    if (saved) {
      try {
        return {
          orcid: true,
          scholar: false,
          semantic: true,
          ...JSON.parse(saved),
        };
      } catch {
        return {
          orcid: true,
          scholar: false,
          semantic: true,
        };
      }
    }

    return {
      orcid: true,
      scholar: false,
      semantic: true,
    };
  });
  const [autoSync, setAutoSync] = React.useState(() => {
    const saved = window.localStorage.getItem(`scholartrend.${role}.autoSync`);
    return saved ? saved === "true" : true;
  });
  const [identityMessage, setIdentityMessage] = React.useState(
    "Academic profile synced 2 hours ago.",
  );
  const isAcademic = role === "researcher" || role === "lecturer";
  const academicRole = role === "lecturer" ? "lecturer" : "researcher";
  const avatarInputRef = React.useRef(null);
  const storageKey = `scholartrend.profile.${encodeURIComponent(
    accountEmail || role,
  )}`;
  const defaultProfileData = {
    personal: {
      fullName:
        accountSession.fullName ||
        accountSession.name ||
        accountEmail ||
        "ScholarTrend User",
      email: accountEmail,
      institution: accountSession.institution || "",
      department: accountSession.department || "",
      roleBadge: accountRole,
      avatarUrl: accountSession.avatarUrl || accountSession.picture || "",
    },
    academicIdentity: {
      institution: accountSession.institution || "",
      department: accountSession.department || "",
      institutionalEmail: "",
      identifier: "",
      programOrField: "",
      evidenceUrl: "",
      verificationStatus: "not_submitted",
      requestedRole: "",
    },
    interests: [
      "Deep Learning",
      "Computational Biology",
      "Quantum Computing",
      "Single-cell RNA",
    ],
    preferences: {
      realTimeAlerts: true,
      weeklyDigest: true,
      systemAlerts: false,
      semanticScholar: true,
      openAlex: true,
    },
    notifications: {
      publicationMatches: true,
      weeklyTrendingDigest: true,
      citationAlerts: false,
      collaborationInvites: true,
      realtimePublicationAlerts: true,
      syncStatusUpdates: true,
      systemAnnouncements: false,
      frequency: "Daily digest",
    },
    privacy: {
      visibility: "Public",
      sharePublicationData: true,
      externalIndexing: false,
      researchAnalytics: true,
      twoFactorEnabled: false,
      signedOutAllDevices: false,
    },
  };
  const loadProfileData = React.useCallback(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultProfileData;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaultProfileData,
        ...parsed,
        personal: {
          ...defaultProfileData.personal,
          ...(parsed.personal || {}),
          email: accountEmail,
          roleBadge: accountRole,
        },
        preferences: {
          ...defaultProfileData.preferences,
          ...(parsed.preferences || {}),
        },
        notifications: {
          ...defaultProfileData.notifications,
          ...(parsed.notifications || {}),
        },
        privacy: { ...defaultProfileData.privacy, ...(parsed.privacy || {}) },
        academicIdentity: {
          ...defaultProfileData.academicIdentity,
          ...(parsed.academicIdentity || {}),
        },
        interests: Array.isArray(parsed.interests)
          ? parsed.interests
          : defaultProfileData.interests,
      };
    } catch {
      return defaultProfileData;
    }
  }, [storageKey, accountEmail, accountRole]);
  const [profileData, setProfileData] = React.useState(loadProfileData);
  const [savedProfileData, setSavedProfileData] = React.useState(profileData);
  const [roleChangeDraft, setRoleChangeDraft] = React.useState(() => ({
    institution: "",
    department: "",
    institutionalEmail: "",
    identifier: "",
    programOrField: "",
    evidenceUrl: "",
    requestedRole: accountRole === "Researcher" ? "Lecturer" : "Researcher",
  }));

  React.useEffect(() => {
    const pendingRole = profileData.academicIdentity.requestedRole;
    if (!pendingRole) return;
    setRoleChangeDraft({
      institution: profileData.academicIdentity.institution || "",
      department: profileData.academicIdentity.department || "",
      institutionalEmail:
        profileData.academicIdentity.institutionalEmail || "",
      identifier: profileData.academicIdentity.identifier || "",
      programOrField: profileData.academicIdentity.programOrField || "",
      evidenceUrl: profileData.academicIdentity.evidenceUrl || "",
      requestedRole: pendingRole,
    });
  }, [
    profileData.academicIdentity.requestedRole,
    profileData.academicIdentity.institution,
    profileData.academicIdentity.department,
    profileData.academicIdentity.institutionalEmail,
    profileData.academicIdentity.identifier,
    profileData.academicIdentity.programOrField,
    profileData.academicIdentity.evidenceUrl,
  ]);
  const [newInterest, setNewInterest] = React.useState("");
  const [profileMessage, setProfileMessage] = React.useState("");
  const [institutionalEmailCode, setInstitutionalEmailCode] = React.useState("");
  const [passwords, setPasswords] = React.useState({
    current: "",
    next: "",
    confirm: "",
  });

  React.useEffect(() => {
    if (!getStoredAuth().accessToken) return undefined;

    let cancelled = false;
    const profileRequest = apiFetch("/api/auth/profile", { auth: true });

    profileRequest
      .then((backendProfile) => {
        if (cancelled) return;
        setProfileData((current) => {
          const next = {
            ...current,
            personal: {
              ...current.personal,
              fullName: backendProfile.fullName || current.personal.fullName,
              email: backendProfile.email || current.personal.email,
              institution:
                backendProfile.institution ?? current.personal.institution,
              department:
                backendProfile.department ?? current.personal.department,
              avatarUrl: backendProfile.avatarUrl ?? current.personal.avatarUrl,
              roleBadge: normalizeRoleForUi(backendProfile.role),
            },
            academicIdentity: {
              ...current.academicIdentity,
              ...(backendProfile.academicIdentity || {}),
              institution:
                backendProfile.academicIdentity?.institution ||
                backendProfile.institution ||
                current.academicIdentity.institution,
              department:
                backendProfile.academicIdentity?.department ||
                backendProfile.department ||
                current.academicIdentity.department,
              institutionalEmail:
                backendProfile.academicIdentity?.institutionalEmail ||
                backendProfile.institutionalEmail ||
                current.academicIdentity.institutionalEmail,
              identifier:
                backendProfile.academicIdentity?.identifier ||
                backendProfile.academicIdentifier ||
                current.academicIdentity.identifier,
              programOrField:
                backendProfile.academicIdentity?.programOrField ||
                backendProfile.programOrField ||
                current.academicIdentity.programOrField,
              evidenceUrl:
                backendProfile.academicIdentity?.evidenceUrl ||
                backendProfile.evidenceUrl ||
                current.academicIdentity.evidenceUrl,
              verificationStatus:
                backendProfile.verificationStatus ||
                current.academicIdentity.verificationStatus,
              requestedRole:
                backendProfile.requestedRole ??
                current.academicIdentity.requestedRole ??
                "",
            },
          };
          window.localStorage.setItem(storageKey, JSON.stringify(next));
          persistSession({
            ...getStoredSession(),
            fullName: next.personal.fullName,
            name: next.personal.fullName,
            role: next.personal.roleBadge,
            academicIdentity: next.academicIdentity,
            verificationStatus: next.academicIdentity.verificationStatus,
            requestedRole: next.academicIdentity.requestedRole || "",
          });
          setSavedProfileData(next);
          return next;
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const updatePersonalField = (field, value) => {
    setProfileData((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
    setProfileMessage("");
  };

  const updateNestedProfileField = (group, field, value) => {
    setProfileData((current) => ({
      ...current,
      [group]: { ...current[group], [field]: value },
    }));
    setProfileMessage("");
  };

  const handleRequestedRoleChange = (nextRole) => {
    setRoleChangeDraft((current) => ({
      ...current,
        requestedRole: nextRole === accountRole ? "" : nextRole,
      identifier: "",
      programOrField: "",
      evidenceUrl: "",
    }));
    setProfileMessage(
      nextRole === accountRole
        ? `The current ${accountRole} role will be kept.`
        : `Enter the ${nextRole} identifier, field, and verification evidence before saving.`,
    );
  };

  const handleProfileAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMessage("Please choose an image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 800 * 1024) {
      setProfileMessage("Avatar image must be 800K or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updatePersonalField("avatarUrl", reader.result);
      setProfileMessage("Avatar selected. Press Save Changes to keep it.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeProfileAvatar = () => {
    updatePersonalField("avatarUrl", "");
    setProfileMessage("Avatar removed. Press Save Changes to keep it.");
  };

  const addProfileInterest = (event) => {
    event.preventDefault();
    const value = newInterest.trim();
    if (!value) return;
    setProfileData((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests
        : [...current.interests, value],
    }));
    setNewInterest("");
    setProfileMessage("");
  };

  const removeProfileInterest = (interest) => {
    setProfileData((current) => ({
      ...current,
      interests: current.interests.filter((item) => item !== interest),
    }));
    setProfileMessage("");
  };

  const saveProfileChanges = async () => {
    if (passwords.next || passwords.confirm || passwords.current) {
      if (
        !passwords.current ||
        !passwords.next ||
        passwords.next !== passwords.confirm
      ) {
        setProfileMessage(
          "Check your current password and matching new password.",
        );
        return;
      }
    }

    const isRoleChangeRequest = activeTab === "Role Change Request";
    const isIdentitySubmission =
      activeTab === "Academic Identity" || isRoleChangeRequest;
    const identity = isRoleChangeRequest
      ? roleChangeDraft
      : profileData.academicIdentity;
    if (
      isIdentitySubmission &&
      (!identity.institution ||
        !identity.department ||
        !identity.institutionalEmail ||
        !identity.identifier ||
        !identity.programOrField ||
        !identity.evidenceUrl)
    ) {
      setProfileMessage(
        "Institution, department, official email, role identifier, program or field, and evidence URL are required for verification.",
      );
      return;
    }

    try {
      let nextProfileData = profileData;
      if (getStoredAuth().accessToken) {
        const backendProfile = await apiFetch("/api/auth/profile", {
          method: "PUT",
          auth: true,
          body: {
            fullName: profileData.personal.fullName,
            ...(isIdentitySubmission
              ? {
                  institution: identity.institution,
                  department: identity.department,
                  institutionalEmail: identity.institutionalEmail,
                  academicIdentifier: identity.identifier,
                  programOrField: identity.programOrField,
                  evidenceUrl: identity.evidenceUrl,
                  requestedRole: isRoleChangeRequest
                    ? identity.requestedRole
                    : accountRole,
                }
              : {}),
          },
        });
        if (passwords.current && passwords.next) {
          await apiFetch("/api/auth/change-password", {
            method: "POST",
            auth: true,
            body: {
              currentPassword: passwords.current,
              newPassword: passwords.next,
            },
          });
        }
        nextProfileData = {
          ...profileData,
          personal: {
            ...profileData.personal,
            fullName: backendProfile.fullName || profileData.personal.fullName,
            email: backendProfile.email || profileData.personal.email,
            roleBadge: normalizeRoleForUi(backendProfile.role),
          },
          academicIdentity: {
            ...(isRoleChangeRequest ? identity : profileData.academicIdentity),
            ...(backendProfile.academicIdentity || {}),
            institution:
              backendProfile.institution ??
              (isRoleChangeRequest
                ? identity.institution
                : profileData.academicIdentity.institution),
            department:
              backendProfile.department ??
              (isRoleChangeRequest
                ? identity.department
                : profileData.academicIdentity.department),
            institutionalEmail:
              backendProfile.institutionalEmail ??
              (isRoleChangeRequest
                ? identity.institutionalEmail
                : profileData.academicIdentity.institutionalEmail),
            identifier:
              backendProfile.academicIdentifier ??
              (isRoleChangeRequest
                ? identity.identifier
                : profileData.academicIdentity.identifier),
            programOrField:
              backendProfile.programOrField ??
              (isRoleChangeRequest
                ? identity.programOrField
                : profileData.academicIdentity.programOrField),
            evidenceUrl:
              backendProfile.evidenceUrl ??
              (isRoleChangeRequest
                ? identity.evidenceUrl
                : profileData.academicIdentity.evidenceUrl),
            verificationStatus:
              backendProfile.verificationStatus ||
              profileData.academicIdentity.verificationStatus,
            requestedRole: backendProfile.requestedRole || "",
          },
        };
      } else {
        const backendProfile = await authServerFetch("/api/auth/profile", {
          method: "PUT",
          body: {
            fullName: profileData.personal.fullName,
            institution: profileData.personal.institution,
            department: profileData.personal.department,
            avatarUrl: profileData.personal.avatarUrl,
            ...(isIdentitySubmission
              ? {
                  academicIdentity: {
                    ...identity,
                    requestedRole: isRoleChangeRequest
                      ? identity.requestedRole
                      : accountRole,
                  },
                }
              : {}),
          },
        });
        nextProfileData = {
          ...profileData,
          personal: {
            ...profileData.personal,
            fullName: backendProfile.fullName,
            email: backendProfile.email,
            institution: backendProfile.institution || "",
            department: backendProfile.department || "",
            avatarUrl: backendProfile.avatarUrl || "",
            roleBadge: normalizeRoleForUi(backendProfile.role),
          },
        };
      }

      if (!getStoredAuth().accessToken && isIdentitySubmission) {
        nextProfileData = {
          ...nextProfileData,
          academicIdentity: {
            ...nextProfileData.academicIdentity,
            ...(nextProfileData.academicIdentity || {}),
            verificationStatus: "pending",
          },
        };
      }

      window.localStorage.setItem(storageKey, JSON.stringify(nextProfileData));
      persistSession({
        ...getStoredSession(),
        fullName: nextProfileData.personal.fullName,
        name: nextProfileData.personal.fullName,
        picture: nextProfileData.personal.avatarUrl,
        avatarUrl: nextProfileData.personal.avatarUrl,
        institution: nextProfileData.personal.institution,
        department: nextProfileData.personal.department,
        academicIdentity: nextProfileData.academicIdentity,
        verificationStatus:
          nextProfileData.academicIdentity.verificationStatus,
        requestedRole: nextProfileData.academicIdentity.requestedRole || "",
        role: nextProfileData.personal.roleBadge,
      });
      setProfileData(nextProfileData);
      setSavedProfileData(nextProfileData);
      setPasswords({ current: "", next: "", confirm: "" });
      setProfileMessage(
        isRoleChangeRequest
          ? `Role change request to ${identity.requestedRole} was sent to Admin successfully.`
          : "Profile changes saved successfully.",
      );
    } catch (error) {
      setProfileMessage(error.message);
    }
  };

  const cancelProfileChanges = () => {
    setProfileData(savedProfileData);
    setRoleChangeDraft({
      institution: "",
      department: "",
      institutionalEmail: "",
      identifier: "",
      programOrField: "",
      evidenceUrl: "",
      requestedRole:
        accountRole === "Researcher" ? "Lecturer" : "Researcher",
    });
    setPasswords({ current: "", next: "", confirm: "" });
    setNewInterest("");
    setProfileMessage("Unsaved changes were discarded.");
  };

  const toggleIdentityConnection = (key, label) => {
    setIdentityConnections((current) => {
      const nextValue = !current[key];
      const nextConnections = { ...current, [key]: nextValue };
      setIdentityMessage(
        nextValue
          ? `${label} connected. ScholarTrend will include it in publication matching.`
          : `${label} disconnected from automatic publication matching.`,
      );
      window.localStorage.setItem(
        `scholartrend.${role}.identityConnections`,
        JSON.stringify(nextConnections),
      );
      return nextConnections;
    });
  };

  const runIdentitySync = () => {
    setIdentityMessage(
      "Sync queued: ScholarTrend is refreshing author IDs, citations, and topic fingerprints.",
    );
  };

  const verifyInstitutionalEmail = async () => {
    try {
      const backendProfile = await apiFetch(
        "/api/auth/verify-institutional-email",
        { method: "POST", auth: true, body: { token: institutionalEmailCode } },
      );
      setProfileData((current) => ({
        ...current,
        academicIdentity: {
          ...current.academicIdentity,
          verificationStatus: backendProfile.verificationStatus,
          isInstitutionalEmailVerified:
            backendProfile.isInstitutionalEmailVerified,
        },
      }));
      setInstitutionalEmailCode("");
      setProfileMessage("Institutional email verified. Your request is now pending Admin review.");
    } catch (error) {
      setProfileMessage(error.message);
    }
  };

  const identityRoleConfig = {
    Student: {
      institution: "University / College",
      identifier: "Student ID",
      program: "Program / Major",
      hint: "Use your official student ID and school email.",
    },
    Lecturer: {
      institution: "University / Institution",
      identifier: "Staff / Faculty ID",
      program: "Faculty / Teaching Department",
      hint: "Use your faculty ID and official institutional email.",
    },
    Researcher: {
      institution: "Research Institution / University",
      identifier: "ORCID or Researcher ID",
      program: "Research Field / Laboratory",
      hint: "Use an ORCID or researcher ID that Admin can verify.",
    },
  };
  const requestedIdentityRole =
    roleChangeDraft.requestedRole ||
    profileData.academicIdentity.requestedRole ||
    (accountRole === "Researcher" ? "Lecturer" : "Researcher");
  const identityConfig =
    identityRoleConfig[requestedIdentityRole] || identityRoleConfig.Student;
  const currentIdentityConfig =
    identityRoleConfig[accountRole] || identityRoleConfig.Student;

  const pageContent = (
    <div
      className={
        isAcademic
          ? "researcher-profile-content profile-content"
          : "student-content profile-content"
      }
    >
      <h1>User Profile</h1>
      <p className="profile-subtitle">
        Manage your personal information, security, and academic preferences.
      </p>

      <div className="profile-layout">
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "Personal Info" && (
          <section className="profile-card" aria-label="Personal information">
            <div className="profile-card-header">
              <h2>Personal Information</h2>
              <span>{profileData.personal.roleBadge}</span>
            </div>

            <div className="profile-photo-row">
              <button
                type="button"
                className="profile-photo"
                aria-label="Change profile photo"
                onClick={() => avatarInputRef.current?.click()}
              >
                {profileData.personal.avatarUrl ? (
                  <img
                    src={profileData.personal.avatarUrl}
                    alt={profileData.personal.fullName}
                  />
                ) : (
                  <span>
                    {profileData.personal.fullName.trim().charAt(0) || "A"}
                  </span>
                )}
              </button>
              <input
                ref={avatarInputRef}
                className="profile-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleProfileAvatarUpload}
              />
              <div className="profile-upload-actions">
                <div>
                  <button
                    type="button"
                    className="upload-button"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    Upload New
                  </button>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={removeProfileAvatar}
                    disabled={!profileData.personal.avatarUrl}
                  >
                    Remove
                  </button>
                </div>
                <p>JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div className="profile-form-grid">
              <ProfileField
                label="Full Name"
                value={profileData.personal.fullName}
                onChange={(value) => updatePersonalField("fullName", value)}
              />
              <ProfileField
                label="Email Address (Read-only)"
                value={profileData.personal.email}
                readOnly
                locked
              />
            </div>
          </section>
        )}

        {activeTab === "Academic Identity" && (
          <section
            className="profile-card academic-identity-card"
            aria-label="Academic identity"
          >
            <div className="profile-card-header">
              <h2>Academic Identity</h2>
              <span
                className={`identity-verification-status ${
                  profileData.academicIdentity.requestedRole
                    ? "verified"
                    : profileData.academicIdentity.verificationStatus
                }`}
              >
                {profileData.academicIdentity.requestedRole
                  ? "Current Role Active"
                  : profileData.academicIdentity.verificationStatus === "verified"
                  ? "Admin Verified"
                  : profileData.academicIdentity.verificationStatus ===
                      "pending"
                    ? "Pending Admin Review"
                    : profileData.academicIdentity.verificationStatus ===
                        "rejected"
                      ? "Verification Rejected"
                      : "Not Submitted"}
              </span>
            </div>

            <div className="academic-verification-intro">
              <strong>{accountRole} identity verification</strong>
              <p>
                {currentIdentityConfig.hint} This section belongs to your
                current role.
              </p>
            </div>

            <div className="profile-form-grid academic-verification-grid">
              <ProfileField
                label={currentIdentityConfig.institution}
                value={profileData.academicIdentity.institution}
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "institution",
                    value,
                  )
                }
              />
              <ProfileField
                label="Official Institutional Email"
                value={profileData.academicIdentity.institutionalEmail}
                type="email"
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "institutionalEmail",
                    value,
                  )
                }
              />
              <ProfileField
                label={currentIdentityConfig.identifier}
                value={profileData.academicIdentity.identifier}
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "identifier",
                    value,
                  )
                }
              />
              <ProfileField
                label={currentIdentityConfig.program}
                value={profileData.academicIdentity.programOrField}
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "programOrField",
                    value,
                  )
                }
              />
              <ProfileField
                label="Department / Unit"
                value={profileData.academicIdentity.department}
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "department",
                    value,
                  )
                }
              />
              <ProfileField
                label="Verification URL (institution profile, ORCID, or directory)"
                value={profileData.academicIdentity.evidenceUrl}
                type="url"
                onChange={(value) =>
                  updateNestedProfileField(
                    "academicIdentity",
                    "evidenceUrl",
                    value,
                  )
                }
              />
            </div>

            {accountRole !== "Student" ? (
              <>
            <div className="identity-summary-grid">
              <div>
                <span>Verified Author IDs</span>
                <strong>3</strong>
                <em>ORCID, Scholar, Semantic Scholar</em>
              </div>
              <div>
                <span>Matched Publications</span>
                <strong>128</strong>
                <em>+14 this month</em>
              </div>
              <div>
                <span>Citation Footprint</span>
                <strong>4,820</strong>
                <em>98.2% profile confidence</em>
              </div>
            </div>

            <div className="identity-sync-panel">
              <div>
                <h3>Auto-sync author profile</h3>
                <p>
                  Keep publications, citations, and followed research topics
                  aligned with connected academic data sources.
                </p>
              </div>
              <button
                type="button"
                className={
                  autoSync ? "identity-toggle active" : "identity-toggle"
                }
                aria-pressed={autoSync}
                onClick={() => {
                  setAutoSync((enabled) => {
                    window.localStorage.setItem(
                      `scholartrend.${role}.autoSync`,
                      String(!enabled),
                    );
                    return !enabled;
                  });
                  setIdentityMessage(
                    autoSync
                      ? "Auto-sync paused. Manual sync is still available."
                      : "Auto-sync enabled for publication and citation updates.",
                  );
                }}
              >
                <span></span>
                {autoSync ? "Enabled" : "Paused"}
              </button>
            </div>

            <div className="identity-source-list">
              {[
                {
                  key: "orcid",
                  name: "ORCID",
                  detail: "0000-0002-1825-0097",
                  icon: "iD",
                  tone: "green",
                },
                {
                  key: "scholar",
                  name: "Google Scholar",
                  detail: "Import public author profile and citation graph",
                  icon: "GS",
                  tone: "blue",
                },
                {
                  key: "semantic",
                  name: "Semantic Scholar",
                  detail:
                    "Match papers by author ID, DOI, and title similarity",
                  icon: "SS",
                  tone: "purple",
                },
              ].map((source) => (
                <article className="identity-source-card" key={source.key}>
                  <div className={`identity-source-icon ${source.tone}`}>
                    {source.icon}
                  </div>
                  <div>
                    <h3>{source.name}</h3>
                    <p>{source.detail}</p>
                  </div>
                  <button
                    type="button"
                    className={
                      identityConnections[source.key]
                        ? "identity-connect connected"
                        : "identity-connect"
                    }
                    onClick={() =>
                      toggleIdentityConnection(source.key, source.name)
                    }
                  >
                    {identityConnections[source.key] ? "Connected" : "Connect"}
                  </button>
                </article>
              ))}
            </div>

            <div className="identity-action-row">
              <p role="status">{identityMessage}</p>
              <button type="button" onClick={runIdentitySync}>
                <MiniIcon path="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 11.7 3.2M19 9A7 7 0 0 0 7.3 5.8" />
                Sync Now
              </button>
            </div>
              </>
            ) : null}
          </section>
        )}

        {activeTab === "Role Change Request" && (
          <section
            className="profile-card academic-identity-card role-change-request-card"
            aria-label="Role change request"
          >
            <div className="profile-card-header">
              <div>
                <h2>Role Change Request</h2>
                <p>
                  Current role: <strong>{accountRole}</strong>
                </p>
              </div>
              {profileData.academicIdentity.requestedRole ? (
                <span className="identity-verification-status pending">
                  {profileData.academicIdentity.requestedRole} pending
                </span>
              ) : null}
            </div>

            <div className="academic-verification-intro">
              <strong>Apply for another academic role</strong>
              <p>
                Select a new role and provide new evidence for that role. Your
                current {accountRole} access remains unchanged until Admin
                approves the request.
              </p>
            </div>

            <div className="profile-field role-change-field">
              <span>Choose the role you want to apply for</span>
              <div
                className="role-change-options"
                role="group"
                aria-label="Choose a new academic role"
              >
                {["Student", "Lecturer", "Researcher"]
                  .filter((option) => option !== accountRole)
                  .map((option) => (
                    <button
                      type="button"
                      className={
                        requestedIdentityRole === option ? "selected" : ""
                      }
                      aria-pressed={requestedIdentityRole === option}
                      onClick={() => handleRequestedRoleChange(option)}
                      key={option}
                    >
                      <strong>{option}</strong>
                      <small>Apply for {option}</small>
                    </button>
                  ))}
              </div>
            </div>

            <div className="profile-form-grid academic-verification-grid role-change-evidence-grid">
              <ProfileField
                label={identityConfig.institution}
                value={roleChangeDraft.institution}
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    institution: value,
                  }))
                }
              />
              <ProfileField
                label="Official Institutional Email"
                value={roleChangeDraft.institutionalEmail}
                type="email"
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    institutionalEmail: value,
                  }))
                }
              />
              <ProfileField
                label={identityConfig.identifier}
                value={roleChangeDraft.identifier}
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    identifier: value,
                  }))
                }
              />
              <ProfileField
                label={identityConfig.program}
                value={roleChangeDraft.programOrField}
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    programOrField: value,
                  }))
                }
              />
              <ProfileField
                label="Department / Unit"
                value={roleChangeDraft.department}
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    department: value,
                  }))
                }
              />
              <ProfileField
                label="Verification URL (institution profile, ORCID, or directory)"
                value={roleChangeDraft.evidenceUrl}
                type="url"
                onChange={(value) =>
                  setRoleChangeDraft((current) => ({
                    ...current,
                    evidenceUrl: value,
                  }))
                }
              />
            </div>
          </section>
        )}

        {activeTab === "Change Password" && (
          <section className="profile-card" aria-label="Change password">
            <div className="profile-card-header">
              <h2>Change Password</h2>
              <span>Security</span>
            </div>
            <div className="profile-form-grid">
              <label className="profile-field" style={{ gridColumn: "span 2" }}>
                <span>Current Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        current: event.target.value,
                      }))
                    }
                    placeholder="Current password"
                    style={{ maxWidth: "45%" }}
                  />
                </span>
              </label>
              <label className="profile-field">
                <span>New Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    value={passwords.next}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        next: event.target.value,
                      }))
                    }
                    placeholder="New password"
                  />
                </span>
              </label>
              <label className="profile-field">
                <span>Confirm New Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        confirm: event.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                  />
                </span>
              </label>
            </div>
          </section>
        )}

        {activeTab === "Research Interests" && (
          <section className="profile-card" aria-label="Research interests">
            <div className="profile-card-header">
              <h2>Research Interests</h2>
              <span>Academic Interests</span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#4b5563",
                marginBottom: "20px",
              }}
            >
              Manage the research keywords and topics you follow to customize
              your dashboard feeds and alert notifications.
            </p>
            <div className="keyword-chips" style={{ marginBottom: "20px" }}>
              {profileData.interests.map((interest) => (
                <span key={interest}>
                  {interest}{" "}
                  <button
                    type="button"
                    aria-label={`Remove ${interest}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => removeProfileInterest(interest)}
                  >
                    x
                  </button>
                </span>
              ))}
              <form
                className="profile-interest-form"
                onSubmit={addProfileInterest}
              >
                <input
                  value={newInterest}
                  onChange={(event) => setNewInterest(event.target.value)}
                  placeholder="Add keyword"
                  aria-label="Add research keyword"
                />
                <button
                  type="submit"
                  style={{ borderStyle: "dashed", cursor: "pointer" }}
                >
                  + Add Keyword
                </button>
              </form>
            </div>
          </section>
        )}

        {activeTab === "Preferences" && (
          <section className="profile-card" aria-label="Preferences">
            <div className="profile-card-header">
              <h2>System Preferences</h2>
              <span>Preferences</span>
            </div>
            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    marginBottom: "10px",
                    color: "#111827",
                  }}
                >
                  Notification Frequency
                </h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.realTimeAlerts}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "realTimeAlerts",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Real-time alerts for new publication matches
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.weeklyDigest}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "weeklyDigest",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Weekly summary email digest
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.systemAlerts}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "systemAlerts",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    System health & sync status alerts
                  </label>
                </div>
              </div>
              <div
                style={{ borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    marginBottom: "10px",
                    color: "#111827",
                  }}
                >
                  Default Search Sources
                </h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.semanticScholar}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "semanticScholar",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Semantic Scholar API
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.preferences.openAlex}
                      onChange={(event) =>
                        updateNestedProfileField(
                          "preferences",
                          "openAlex",
                          event.target.checked,
                        )
                      }
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    OpenAlex Database
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Notification Settings" && (
          <section className="profile-card" aria-label="Notification settings">
            <div className="profile-card-header">
              <h2>Notification Settings</h2>
              <span>Manage Alerts</span>
            </div>
            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  Email Notifications
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    {
                      key: "publicationMatches",
                      label: "New publications matching your interests",
                    },
                    {
                      key: "weeklyTrendingDigest",
                      label: "Weekly digest of trending papers",
                    },
                    {
                      key: "citationAlerts",
                      label: "Citation alerts for your publications",
                    },
                    {
                      key: "collaborationInvites",
                      label: "Collaboration invitations",
                    },
                  ].map((item, i) => (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={profileData.notifications[item.key]}
                        onChange={(event) =>
                          updateNestedProfileField(
                            "notifications",
                            item.key,
                            event.target.checked,
                          )
                        }
                        style={{
                          width: "18px",
                          height: "18px",
                          margin: 0,
                          cursor: "pointer",
                        }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  In-App Notifications
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    {
                      key: "realtimePublicationAlerts",
                      label: "Real-time publication alerts",
                    },
                    { key: "syncStatusUpdates", label: "Sync status updates" },
                    {
                      key: "systemAnnouncements",
                      label: "System announcements",
                    },
                  ].map((item, i) => (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={profileData.notifications[item.key]}
                        onChange={(event) =>
                          updateNestedProfileField(
                            "notifications",
                            item.key,
                            event.target.checked,
                          )
                        }
                        style={{
                          width: "18px",
                          height: "18px",
                          margin: 0,
                          cursor: "pointer",
                        }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#111827",
                  }}
                >
                  Notification Frequency
                </h3>
                <select
                  value={profileData.notifications.frequency}
                  onChange={(event) =>
                    updateNestedProfileField(
                      "notifications",
                      "frequency",
                      event.target.value,
                    )
                  }
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  <option>Real-time (as it happens)</option>
                  <option>Daily digest</option>
                  <option>Weekly summary</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Privacy & Security" && (
          <section className="profile-card" aria-label="Privacy and security">
            <div className="profile-card-header">
              <h2>Privacy & Security</h2>
              <span>Account Protection</span>
            </div>
            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  Profile Visibility
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    ["Public", "Public - Visible to all ScholarTrend users"],
                    [
                      "Institution Only",
                      "Institution Only - Visible to your institution",
                    ],
                    ["Private", "Private - Only you can see your profile"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        checked={profileData.privacy.visibility === value}
                        onChange={() =>
                          updateNestedProfileField(
                            "privacy",
                            "visibility",
                            value,
                          )
                        }
                        style={{ margin: 0, cursor: "pointer" }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  Data Sharing
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    {
                      key: "sharePublicationData",
                      label: "Share publication data with collaborators",
                    },
                    {
                      key: "externalIndexing",
                      label: "Allow indexing by external search engines",
                    },
                    {
                      key: "researchAnalytics",
                      label: "Participate in research analytics",
                    },
                  ].map((item, i) => (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={profileData.privacy[item.key]}
                        onChange={(event) =>
                          updateNestedProfileField(
                            "privacy",
                            item.key,
                            event.target.checked,
                          )
                        }
                        style={{
                          width: "18px",
                          height: "18px",
                          margin: 0,
                          cursor: "pointer",
                        }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "#111827",
                  }}
                >
                  Two-Factor Authentication
                </h3>
                <div
                  style={{
                    padding: "16px",
                    background: "#f1f5f9",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: "4px",
                        }}
                      >
                        2FA Status:{" "}
                        <span
                          style={{
                            color: profileData.privacy.twoFactorEnabled
                              ? "#059669"
                              : "#ef4444",
                          }}
                        >
                          {profileData.privacy.twoFactorEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateNestedProfileField(
                          "privacy",
                          "twoFactorEnabled",
                          !profileData.privacy.twoFactorEnabled,
                        )
                      }
                      style={{
                        padding: "8px 16px",
                        background: "#4f46e5",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {profileData.privacy.twoFactorEnabled
                        ? "Disable 2FA"
                        : "Enable 2FA"}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#111827",
                  }}
                >
                  Active Sessions
                </h3>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    marginBottom: "12px",
                  }}
                >
                  {profileData.privacy.signedOutAllDevices
                    ? "Other devices have been signed out"
                    : "You're currently logged in on 2 devices"}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateNestedProfileField(
                      "privacy",
                      "signedOutAllDevices",
                      true,
                    )
                  }
                  disabled={profileData.privacy.signedOutAllDevices}
                  style={{
                    padding: "8px 16px",
                    background: "white",
                    color: "#ef4444",
                    border: "1px solid #ef4444",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: profileData.privacy.signedOutAllDevices
                      ? "not-allowed"
                      : "pointer",
                    opacity: profileData.privacy.signedOutAllDevices ? 0.65 : 1,
                  }}
                >
                  {profileData.privacy.signedOutAllDevices
                    ? "Signed Out"
                    : "Sign Out All Devices"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {profileMessage && (
        <p className="profile-status-message">{profileMessage}</p>
      )}
      {profileData.academicIdentity.verificationStatus ===
      "email_verification_required" ? (
        <div className="profile-action-bar" role="group" aria-label="Verify institutional email">
          <label className="profile-field">
            <span>Institutional email verification code</span>
            <input
              value={institutionalEmailCode}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setInstitutionalEmailCode(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
            />
          </label>
          <button type="button" className="profile-save" onClick={verifyInstitutionalEmail}>
            Verify email
          </button>
        </div>
      ) : null}
      <div className="profile-action-bar">
        <button
          type="button"
          className="profile-cancel"
          onClick={cancelProfileChanges}
        >
          Cancel
        </button>
        <button
          type="button"
          className="profile-save"
          onClick={saveProfileChanges}
        >
          <MiniIcon path="M5 5h14v14H5zM8 5v5h8V5M8 19v-5h8v5" />
          {activeTab === "Role Change Request"
            ? "Submit Role Change"
            : "Save Changes"}
        </button>
      </div>
    </div>
  );

  if (isAcademic) {
    return (
      <ResearcherShell
        activeRoute={getAcademicPath("/researcher-profile", academicRole)}
        current="Profile"
        pageClassName="profile-page researcher-profile-page"
        mainClassName="researcher-profile-main"
        profileAvatarUrl={profileData.personal.avatarUrl}
      >
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app profile-page">
      <StudentSidebar activeRoute="/student-profile" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              Dashboard <span>&gt;</span> <strong>Profile</strong>
            </div>
          }
          variant="profile"
          searchPlaceholder="Search ScholarTrend..."
        />
        {pageContent}
      </section>
    </main>
  );
}

function ImpactAnalyticsCard({ topicId, topicName }) {
  const [trackedTopicId, setTrackedTopicId] = React.useState(null);
  const [trackStatus, setTrackStatus] = React.useState("idle");
  const [trackMessage, setTrackMessage] = React.useState("");
  const canTrack = isBackendNumericId(topicId);
  const isTracked = Number(trackedTopicId) === Number(topicId);

  React.useEffect(() => {
    let cancelled = false;
    setTrackedTopicId(null);
    setTrackMessage("");
    if (!canTrack) return () => {};

    apiFetch("/api/follows", { auth: true })
      .then((follows) => {
        if (cancelled || !Array.isArray(follows)) return;
        const matchingFollow = follows.find(
          (follow) =>
            String(follow.followType || "").toLowerCase() === "topic" &&
            Number(follow.followTargetId) === Number(topicId),
        );
        setTrackedTopicId(matchingFollow?.followTargetId || null);
      })
      .catch((error) => {
        if (!cancelled) setTrackMessage(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [canTrack, topicId]);

  const toggleTopicTracking = async () => {
    if (!canTrack || trackStatus === "saving") return;
    setTrackStatus("saving");
    setTrackMessage("");
    try {
      await apiFetch(`/api/follows/topic/${topicId}`, {
        method: isTracked ? "DELETE" : "POST",
        auth: true,
      });
      setTrackedTopicId(isTracked ? null : Number(topicId));
      setTrackMessage(
        isTracked
          ? `${topicName || "Topic"} is no longer tracked.`
          : `${topicName || "Topic"} is now being tracked.`,
      );
      setTrackStatus("success");
    } catch (error) {
      setTrackMessage(error.message);
      setTrackStatus("error");
    }
  };

  return (
    <aside className="impact-card">
      <h2>Impact Analytics</h2>
      <div className="analytics-block">
        <span>Citation Velocity</span>
        <div className="velocity-row">
          <strong>85</strong>
          <em>^ +12% / mo</em>
        </div>
      </div>
      <div className="analytics-block">
        <span>Field Percentile</span>
        <div className="percentile-bar">
          <i></i>
        </div>
        <strong className="percentile-label">
          Top 2% in Computational Biology
        </strong>
      </div>
      <button
        type="button"
        className={`track-topic${isTracked ? " is-tracked" : ""}`}
        onClick={toggleTopicTracking}
        disabled={!canTrack || trackStatus === "saving"}
        aria-pressed={isTracked}
        title={!canTrack ? "This publication does not have a trackable keyword." : undefined}
      >
        <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        {trackStatus === "saving"
          ? "Saving..."
          : isTracked
            ? "Topic Tracked"
            : "Track this Topic"}
      </button>
      {trackMessage ? (
        <p className={`track-topic-status ${trackStatus}`} role="status">
          {trackMessage}
        </p>
      ) : null}
      <div className="analytics-block similarity-match">
        <span>Similarity Match</span>
        <div>
          <strong>85%</strong>
          <p>match to original report</p>
        </div>
      </div>
    </aside>
  );
}

function ExtractedTopicsCard() {
  const topics = [
    "Deep Learning",
    "Single-cell RNA",
    "Manifold Learning",
    "Autoencoders",
    "Biological Trajectories",
  ];

  return (
    <aside className="topics-card">
      <h2>Extracted Topics</h2>
      <div>
        {topics.map((topic) => (
          <span key={topic}>{topic}</span>
        ))}
      </div>
    </aside>
  );
}

function StudentPublicationDetailPage({ role = "student" }) {
  const [activeTab, setActiveTab] = React.useState("Abstract");
  const isAcademic = role === "researcher" || role === "lecturer";
  const rolePrefix = role === "lecturer" ? "lecturer" : "researcher";
  const publicationId = getSearchParam("id");
  const localBookmarkDetail = React.useMemo(() => {
    if (!publicationId) return null;
    const normalizedPublicationId = String(publicationId).trim().toLowerCase();
    const bookmark = getLocalBookmarks().find(
      (paper) =>
        getBookmarkKey(paper) === normalizedPublicationId ||
        String(paper.detailId || "")
          .trim()
          .toLowerCase() === normalizedPublicationId ||
        String(paper.title || "")
          .trim()
          .toLowerCase() === normalizedPublicationId,
    );
    if (!bookmark) return null;

    const authorList = Array.isArray(bookmark.authors)
      ? bookmark.authors
      : String(bookmark.authors || "")
          .split(",")
          .map((author) => author.trim())
          .filter(Boolean);
    const citationCount =
      Number(
        String(bookmark.citationCount || bookmark.citations || 0).replaceAll(
          ",",
          "",
        ),
      ) || 0;

    return mapPublicationDetailForUi({
      id: bookmark.detailId || bookmark.id,
      title: bookmark.title,
      abstract: bookmark.abstract || bookmark.excerpt,
      authors: authorList.length ? authorList : ["Unknown author"],
      year: bookmark.year || bookmark.date,
      doi: bookmark.doi,
      journalName: bookmark.journalName || bookmark.source,
      sourceApi: bookmark.sourceApi,
      sourceUrl: bookmark.sourceUrl,
      citationCount,
      keywords: bookmark.keywords,
    });
  }, [publicationId]);
  const localPublishedDetail = React.useMemo(() => {
    if (!publicationId) return null;
    const published = getPublishedPublications().find(
      (paper) => String(paper.id) === String(publicationId),
    );
    return published ? mapPublicationDetailForUi(published) : null;
  }, [publicationId]);
  const publicationApiPath = publicationId
    ? `/api/publications/${encodeURIComponent(publicationId)}`
    : "/api/publications/search?page=1&pageSize=1";
  const { data: publicationDetail } = useApiResource(
    publicationApiPath,
    localBookmarkDetail ||
      localPublishedDetail ||
      mapPublicationDetailForUi({}),
    {
      select: (payload) =>
        publicationId
          ? mapPublicationDetailForUi(payload)
          : mapPublicationDetailForUi({ publication: unwrapList(payload)[0] }),
    },
  );
  const publicationBaseRoute = isAcademic
    ? getAcademicPath("/researcher-publication", rolePrefix)
    : "/student-publication";
  const publicationRoute = `${publicationBaseRoute}${
    publicationDetail.id
      ? `?id=${encodeURIComponent(publicationDetail.id)}`
      : ""
  }`;
  const publicationSourceUrl =
    publicationDetail.sourceUrl ||
    (publicationDetail.doi
      ? `https://doi.org/${encodeURIComponent(publicationDetail.doi)}`
      : "");
  const relatedForUi = publicationDetail.relatedPublications.length
    ? publicationDetail.relatedPublications.map((paper) => ({
        title: paper.title,
        authors: Array.isArray(paper.authors)
          ? paper.authors.join(", ")
          : "Related authors",
        meta: `${paper.year || "N/A"} - ${paper.journalName || "Scientific Journal"}`,
        stats: `${formatCount(paper.citationCount)} citations`,
      }))
    : relatedPublications;

  const pageContent = (
    <div
      className={`${isAcademic ? "researcher-detail-content" : "student-content"} detail-content`}
    >
      <div className="detail-layout">
        <section className="detail-main-column">
          <article className="publication-detail-hero">
            <div className="detail-hero-actions">
              <span className="article-type">Journal Article</span>
              <div>
                <button type="button" aria-label="Bookmark article">
                  <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
                </button>
                <button type="button" aria-label="Share article">
                  <MiniIcon path="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.3 6.8 8.7 15.2M8.7 8.8l6.6 3.7" />
                </button>
                <button type="button" className="cite-button">
                  {formatCount(publicationDetail.citationCount)} Cite
                </button>
              </div>
            </div>

            <h1>{publicationDetail.title}</h1>
            <p className="detail-authors">
              <strong>
                {publicationDetail.authors[0] || "Unknown author"}
              </strong>
              {publicationDetail.authors.length > 1
                ? `, ${publicationDetail.authors.slice(1).join(", ")}`
                : ""}
            </p>
            <p className="detail-journal">
              <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />{" "}
              {publicationDetail.journalName} ({publicationDetail.year})
            </p>

            <div className="detail-meta-strip">
              <span>
                <MiniIcon path="M4 14.5 9 10l3.2 2.7L20 5.5M17 5.5h3v3" />{" "}
                {formatCount(publicationDetail.citationCount)}
                Citations
              </span>
              {publicationSourceUrl ? (
                <a href={publicationSourceUrl} target="_blank" rel="noreferrer">
                  Source: {publicationDetail.sourceApi || "Original"} -&gt;
                </a>
              ) : (
                <span>Source: Not available</span>
              )}
            </div>
          </article>

          <article className="publication-tabs-card">
            <nav className="detail-tabs" aria-label="Publication metadata tabs">
              {["Abstract", "Keywords", "Authors", "Raw Metadata"].map(
                (tab) => (
                  <button
                    className={activeTab === tab ? "active" : ""}
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ),
              )}
            </nav>

            {activeTab === "Abstract" && (
              <div className="abstract-body">
                <h2>Abstract</h2>
                <p>{publicationDetail.abstract}</p>

                <h3>Key Findings</h3>
                <ul>
                  <li>Indexed in {publicationDetail.journalName}.</li>
                  <li>Published in {publicationDetail.year}.</li>
                  <li>
                    Cited {formatCount(publicationDetail.citationCount)} times.
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "Keywords" && (
              <div className="abstract-body keywords-tab-body">
                <h2>Keywords</h2>
                <p style={{ marginBottom: "24px" }}>
                  The following semantic concepts were extracted from this
                  publication and cross-referenced with your tracked items.
                </p>
                <div
                  className="keyword-chips-list"
                  style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}
                >
                  {(publicationDetail.keywords.length
                    ? publicationDetail.keywords
                    : ["Publication"]
                  ).map((keyword, index) => (
                    <span
                      className="keyword-chip-large"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                      }}
                      key={keyword}
                    >
                      <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                      <strong>{keyword}</strong>
                      {index < 2 ? (
                        <span
                          style={{
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: "12px",
                          }}
                        >
                          (Tracked)
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Authors" && (
              <div className="abstract-body authors-tab-body">
                <h2>Authors</h2>
                <div
                  style={{ display: "grid", gap: "20px", marginTop: "24px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      padding: "20px",
                      borderRadius: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "var(--brand)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#ffffff",
                      }}
                    >
                      ER
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#ffffff",
                        }}
                      >
                        Dr. Elena Rostova
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "14px",
                          color: "#94a3b8",
                        }}
                      >
                        Institute of Advanced Analytics - Computational Biology
                      </p>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6366f1",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "6px",
                        }}
                      >
                        ORCID: 0000-0002-1825-0097
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      padding: "20px",
                      borderRadius: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#4f46e5",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#ffffff",
                      }}
                    >
                      MT
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#ffffff",
                        }}
                      >
                        Marcus Thorne
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "14px",
                          color: "#94a3b8",
                        }}
                      >
                        University of Applied Sciences - Deep Learning Lab
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      padding: "20px",
                      borderRadius: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#06b6d4",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#ffffff",
                      }}
                    >
                      JP
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#ffffff",
                        }}
                      >
                        Jin-Soo Park
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "14px",
                          color: "#94a3b8",
                        }}
                      >
                        Seoul Institute of Technology - Bioinformatics Research
                        Division
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Raw Metadata" && (
              <div className="abstract-body metadata-tab-body">
                <h2>Raw Metadata</h2>
                <p style={{ marginBottom: "20px" }}>
                  API metadata payload returned from the indexing data source.
                </p>
                <pre
                  style={{
                    background: "#0b0f19",
                    border: "1px solid #1e293b",
                    padding: "20px",
                    borderRadius: "8px",
                    overflowX: "auto",
                    fontSize: "13px",
                    color: "#a5b4fc",
                    fontFamily: "monospace",
                    lineHeight: "1.5",
                  }}
                >
                  {JSON.stringify(
                    {
                      id: publicationDetail.id,
                      title: publicationDetail.title,
                      authors: publicationDetail.authors,
                      journal: publicationDetail.journalName,
                      year: publicationDetail.year,
                      doi: publicationDetail.doi,
                      citations: publicationDetail.citationCount,
                      keywords: publicationDetail.keywords,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
          </article>

          <section className="related-section">
            <h2>Related Publications</h2>
            <div className="related-list">
              {relatedForUi.map((paper) => (
                <article className="related-card" key={paper.title}>
                  <div className="related-icon">
                    <MiniIcon path="M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4" />
                  </div>
                  <div>
                    <h3>{paper.title}</h3>
                    <p>
                      {paper.authors} - {paper.meta}
                    </p>
                    <span>{paper.stats}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="detail-side-column">
          <ImpactAnalyticsCard
            topicId={publicationDetail.researchTopicIds[0]}
            topicName={publicationDetail.keywords[0]}
          />
          <ExtractedTopicsCard />
        </section>
      </div>
    </div>
  );

  if (isAcademic) {
    return (
      <ResearcherShell
        activeRoute={getAcademicPath("/researcher-search", rolePrefix)}
        topbar="publication"
        pageClassName="researcher-publication-page"
        mainClassName="researcher-publication-main"
      >
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-search" />
      <section className="student-main">
        <StudentTopbar
          crumb="Search  >  Results  >  Deep Learning for Advanced Pattern Recognition..."
          searchValue=""
        />
        {pageContent}
      </section>
    </main>
  );
}

const adminNavItems = [
  {
    label: "admin.dashboard",
    route: "/admin-dashboard",
    icon: "M4.5 11.2 12 5l7.5 6.2v8.3a1 1 0 0 1-1 1h-4.2v-5.2H9.7v5.2H5.5a1 1 0 0 1-1-1v-8.3ZM7.5 11.8v5.7M16.5 11.8v5.7",
  },
  {
    label: "admin.syncManagement",
    route: "/admin-sync-management",
    icon: "M5 7.5h9.5a4.5 4.5 0 0 1 4.2 6.1M18.8 7.5h-4.3V3.2M19 16.5H9.5a4.5 4.5 0 0 1-4.2-6.1M5.2 16.5h4.3v4.3M12 9.2v3.1l2.2 1.3",
  },
  {
    label: "admin.userManagement",
    route: "/admin-user-management",
    icon: "M8.8 11.4a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4ZM3.4 20a5.4 5.4 0 0 1 10.8 0M17 9.8a3 3 0 1 0 0-6M15.8 14.2a5.1 5.1 0 0 1 4.8 5.8",
  },
  {
    label: "admin.notificationManagement",
    route: "/admin-notifications",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M18.5 5.5l1.7-1.7",
  },
  {
    label: "admin.systemLogs",
    route: "/admin-system-logs",
    icon: "M6 4.5h12v15H6zM9 8h6M9 11.5h6M9 15h3.5M16.5 15h.01",
  },
];

const adminStats = [
  {
    label: "admin.totalUsers",
    value: "",
    note: "",
    tone: "users",
    icon: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M16 15a5 5 0 0 1 5 5",
  },
  {
    label: "admin.totalPublications",
    value: "",
    note: "",
    tone: "publications",
    icon: "M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4M4 7v14h11",
  },
  {
    label: "admin.lastSyncStatusLabel",
    value: "",
    note: "",
    tone: "sync",
    icon: "M20 12a8 8 0 1 1-2.34-5.66M8.5 12.5l2.3 2.3L16 9",
  },
  {
    label: "admin.apiHealth",
    tone: "api",
    icon: "M4 8h5l2 4 2-7 2 7 2-4h3M4 17h16",
    values: [],
  },
];

const mapAdminLogForUi = (log) => ({
  id: log.id || "",
  time: log.time ? new Date(log.time).toLocaleString() : "Just now",
  event: log.eventName || log.event || "System event",
  detail: log.detail || "",
  module: log.module || "System",
  severity: log.severity || "Info",
  actor: log.actor || "system",
  code: log.code || `LOG-${Date.now()}`,
  correlationId: log.correlationId || "",
  ipAddress: log.ipAddress || "",
  userId: log.userId || "",
  path: log.path || "",
  statusCode: log.statusCode || "",
});

const mapAdminUserForUi = (user) => ({
  name: user.name || user.fullName || "Unnamed user",
  email: user.email || "",
  role: normalizeRoleForUi(user.role),
  status: user.status || "Active",
  lastLogin: user.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString()
    : "Created",
  avatar:
    user.avatar ||
    String(user.name || user.fullName || "ST")
      .slice(0, 2)
      .toUpperCase(),
  avatarTone: user.role === "Admin" ? "blue" : "green",
});

function AdminSidebar({ activeRoute, mobileOpen, onClose, onOpenPanel }) {
  const { t } = useTranslation();
  return (
    <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div
        className="admin-sidebar-brand"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
            borderRadius: "8px",
            padding: "8px",
            boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 32 32"
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            <path
              d="M16 4 L10 8 L10 16 L16 20 L16 12 L16 4 Z"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M16 4 L22 8 L22 16 L16 20 L16 12 L16 4 Z"
              fill="white"
              opacity="0.75"
            />
            <path
              d="M16 4 L10 8 L16 10 L22 8 Z"
              fill="rgba(255, 255, 255, 0.95)"
            />
            <path
              d="M16 4 L16 28"
              stroke="rgba(2, 132, 199, 0.4)"
              strokeWidth="1.5"
            />
            <circle cx="16" cy="28" r="1.5" fill="white" />
          </svg>
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "9px",
            flex: 1,
            minWidth: 0,
            paddingTop: "2px",
          }}
        >
          <strong
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#cbd5e1",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              letterSpacing: "0.08em",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            <span style={{ color: "#cbd5e1", display: "inline", marginTop: 0 }}>
              Scholar
            </span>
            <span style={{ color: "#06b6d4", display: "inline", marginTop: 0 }}>
              Trend
            </span>
          </strong>
          <b
            style={{
              maxWidth: "116px",
              fontSize: "11px",
              color: "#7f8aa0",
              fontWeight: 700,
              letterSpacing: "0.06em",
              lineHeight: 1.2,
              textTransform: "uppercase",
            }}
          >
            Analytical
            <br />
            Intelligence
          </b>
        </div>
        <button
          type="button"
          aria-label="Close Admin navigation"
          onClick={onClose}
        >
          <MiniIcon path="M19 12H5M12 19l-7-7 7-7" />
        </button>
      </div>

      <nav className="admin-nav" aria-label="Administrator navigation">
        {adminNavItems.map((item) => (
          <a
            className={activeRoute === item.route ? "active" : ""}
            href={item.route}
            onClick={navTo(item.route)}
            key={item.route}
          >
            <MiniIcon path={item.icon} />
            <span>{t(item.label)}</span>
          </a>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button
          type="button"
          className="admin-status-button"
          onClick={() => onOpenPanel("status")}
        >
          <i></i> {t("admin.systemStatusHealthy")}
        </button>
        <button type="button" onClick={() => onOpenPanel("settings")}>
          <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
          Settings
        </button>
        <button type="button" onClick={() => onOpenPanel("support")}>
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          Support
        </button>
        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
        >
          <MiniIcon path="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function AdminTopbar({
  current = "Overview",
  onMenuClick,
  sectionPage = false,
  onOpenPanel,
}) {
  const { t } = useTranslation();
  return (
    <header
      className={`admin-topbar ${sectionPage ? "admin-section-topbar" : ""}`}
    >
      <button
        type="button"
        className="admin-menu-button"
        aria-label="Open Admin navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M4 6h16M4 12h16M4 18h16" />
      </button>
      <h1>
        {sectionPage ? (
          "ScholarTrend Admin"
        ) : (
          <>
            ScholarTrend
            <br />
            Admin
          </>
        )}
      </h1>
      {!sectionPage ? (
        <>
          <nav aria-label="Admin breadcrumb">
            <span>Dashboard</span>
            <b>/</b>
            <strong>{current}</strong>
          </nav>
          <form onSubmit={(event) => event.preventDefault()}>
            <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search Admin workspace"
            />
          </form>
        </>
      ) : null}
      <div className="admin-top-actions">
        <button
          type="button"
          className="alert"
          aria-label="Admin notifications"
          onClick={() => onOpenPanel("notifications")}
        >
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        </button>
        <button
          type="button"
          aria-label="Admin settings"
          onClick={() => onOpenPanel("settings")}
        >
          <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
        </button>
        <button
          type="button"
          className="admin-avatar"
          aria-label="Admin account"
          onClick={() => onOpenPanel("profile")}
        >
          <span>AD</span>
        </button>
      </div>
    </header>
  );
}

const normalizeUtilityNotification = (notification) => ({
  id: notification.id || `utility-${Date.now()}-${Math.random()}`,
  title: notification.title || "Notification",
  detail: notification.text || notification.message || "",
  time: notification.createdAt
    ? new Date(notification.createdAt).toLocaleString()
    : "Just now",
  route: notification.route || "/admin-notifications",
  icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
  unread: notification.unread !== false,
});

function AdminUtilityPanel({ panel, onClose }) {
  const { t } = useTranslation();
  const canUseAdminApi = hasAdminBackendAccess();
  const avatarInputRef = React.useRef(null);
  const defaultHealthRows = [
    {
      name: "API Gateway",
      state: "Operational",
      value: "34 ms",
      icon: "M4 8h16M4 16h16M7 5v14M17 5v14",
      tone: "emerald",
      route: "/admin-system-logs",
    },
    {
      name: "Auth Service",
      state: "Operational",
      value: "OAuth2 ready",
      icon: "M12 3.5 18.5 7v5c0 3.8-2.6 6.7-6.5 8-3.9-1.3-6.5-4.2-6.5-8V7L12 3.5ZM9.5 12l1.6 1.6 3.5-4",
      tone: "blue",
      route: "/admin-user-management",
    },
    {
      name: "Search Index",
      state: "Operational",
      value: "99.9% uptime",
      icon: "M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8 10.5h5M10.5 8v5",
      tone: "violet",
      route: "/admin-sync-management",
    },
    {
      name: "Sync Workers",
      state: "Monitoring",
      value: "Next run in 42 min",
      icon: "M20 12a8 8 0 1 1-2.34-5.66M20 5v5h-5",
      tone: "amber",
      route: "/admin-sync-management",
    },
  ];
  const defaultAdminSettings = {
    emailAlerts: true,
    autoSync: true,
    maintenanceMode: false,
    syncInterval: "Every 6 hours",
  };
  const [settings, setSettings] = React.useState(defaultAdminSettings);
  const [supportMessage, setSupportMessage] = React.useState("");
  const [supportTickets, setSupportTickets] = React.useState([]);
  const [editingTicketId, setEditingTicketId] = React.useState(null);
  const [editingTicketMessage, setEditingTicketMessage] = React.useState("");
  const [statusMessage, setStatusMessage] = React.useState("");
  const [healthRows, setHealthRows] = React.useState(defaultHealthRows);
  const [healthCheckedAt, setHealthCheckedAt] = React.useState("just now");
  const [checkingHealth, setCheckingHealth] = React.useState(false);
  const [ticketMessage, setTicketMessage] = React.useState("");
  const [readNotificationIds, setReadNotificationIds] = React.useState(() => {
    const saved = window.localStorage.getItem(
      "scholartrend.admin.readNotifications",
    );
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }

    return [];
  });
  const [utilityNotifications, setUtilityNotifications] = React.useState([]);
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [editingProfileField, setEditingProfileField] = React.useState(null);
  const [profileMessage, setProfileMessage] = React.useState("");
  const defaultAdminProfile = {
    name: "Admin User",
    email: "admin@university.edu",
    role: "Researcher",
    session: "Local development",
    phone: "+84 901 234 567",
    department: "System Administration",
    location: "Ho Chi Minh City",
    bio: "Manages ScholarTrend access, sync operations, and platform health.",
    avatarUrl: "",
  };
  const [adminProfile, setAdminProfile] = React.useState(() => {
    const session = getStoredSession();
    return {
      ...defaultAdminProfile,
      name: session.fullName || session.name || defaultAdminProfile.name,
      email: session.email || defaultAdminProfile.email,
      role: session.role || defaultAdminProfile.role,
    };
  });

  React.useEffect(() => {
    if (!panel) return;
    if (!canUseAdminApi) {
      const message =
        "Administrator backend access is required. Changes cannot be saved.";
      setStatusMessage(message);
      setProfileMessage(message);
      setTicketMessage(message);
      return;
    }

    if (panel === "settings") {
      apiFetch("/api/admin/settings", { auth: true })
        .then((payload) =>
          setSettings({ ...defaultAdminSettings, ...(payload.value || {}) }),
        )
        .catch((error) => setStatusMessage(error.message));
    }

    if (panel === "profile") {
      apiFetch("/api/admin/profile", { auth: true })
        .then((payload) =>
          setAdminProfile({
            ...defaultAdminProfile,
            ...(payload.value || {}),
          }),
        )
        .catch((error) => setProfileMessage(error.message));
    }

    if (panel === "status") {
      apiFetch("/api/admin/health", { auth: true })
        .then((payload) => {
          const services = Array.isArray(payload.services)
            ? payload.services
            : [];
          if (services.length) {
            setHealthRows((current) =>
              services.map((service, index) => ({
                ...current[index % current.length],
                name: service.name,
                state: service.state,
                value: service.value,
              })),
            );
          }
          if (payload.checkedAt) {
            setHealthCheckedAt(new Date(payload.checkedAt).toLocaleString());
          }
        })
        .catch((error) => setStatusMessage(error.message));
    }

    if (panel === "notifications") {
      apiFetch("/api/admin/notifications?page=1&pageSize=20", { auth: true })
        .then((payload) => {
          const items = Array.isArray(payload.items)
            ? payload.items
            : Array.isArray(payload)
              ? payload
              : [];
          setUtilityNotifications(items.map(normalizeUtilityNotification));
        })
        .catch(() => setUtilityNotifications([]));
    }

    if (panel === "support") {
      apiFetch("/api/admin/support-tickets", { auth: true })
        .then((payload) =>
          setSupportTickets(Array.isArray(payload.items) ? payload.items : []),
        )
        .catch((error) => setTicketMessage(error.message));
    }
  }, [panel, canUseAdminApi]);

  if (!panel) return null;

  const saveSettings = async () => {
    if (!canUseAdminApi) {
      setStatusMessage(
        "Administrator backend access is required to save settings.",
      );
      return;
    }

    try {
      const payload = await apiFetch("/api/admin/settings", {
        method: "PUT",
        auth: true,
        body: { value: settings },
      });
      setSettings({ ...defaultAdminSettings, ...(payload.value || settings) });
      setStatusMessage("Settings saved to backend.");
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    if (!supportMessage.trim()) {
      setTicketMessage("Please describe the issue before creating a ticket.");
      return;
    }

    if (!canUseAdminApi) {
      setTicketMessage("Support tickets require an Administrator session.");
      return;
    }

    try {
      const payload = await apiFetch("/api/admin/support-tickets", {
        method: "POST",
        auth: true,
        body: { message: supportMessage.trim() },
      });
      setTicketMessage("Support ticket created in backend.");
      setSupportMessage("");
      if (payload.ticket) {
        setSupportTickets((current) => [payload.ticket, ...current]);
      }
    } catch (error) {
      setTicketMessage(error.message);
    }
  };

  const updateSupportTicketStatus = async (ticket, status) => {
    try {
      const payload = await apiFetch(`/api/admin/support-tickets/${ticket.id}`, {
        method: "PUT",
        auth: true,
        body: { status },
      });
      setSupportTickets((current) =>
        current.map((item) =>
          item.id === ticket.id ? payload.ticket || { ...item, status } : item,
        ),
      );
      setTicketMessage(`Ticket ${ticket.ticketNumber} updated to ${status}.`);
    } catch (error) {
      setTicketMessage(error.message);
    }
  };

  const deleteSupportTicket = async (ticket) => {
    try {
      await apiFetch(`/api/admin/support-tickets/${ticket.id}`, {
        method: "DELETE",
        auth: true,
      });
      setSupportTickets((current) =>
        current.filter((item) => item.id !== ticket.id),
      );
      setTicketMessage(`Ticket ${ticket.ticketNumber} deleted.`);
    } catch (error) {
      setTicketMessage(error.message);
    }
  };

  const editSupportTicket = (ticket) => {
    setEditingTicketId(ticket.id);
    setEditingTicketMessage(ticket.message || "");
  };

  const saveSupportTicketEdit = async (ticket) => {
    if (!editingTicketMessage.trim()) return;
    try {
      const payload = await apiFetch(`/api/admin/support-tickets/${ticket.id}`, {
        method: "PUT",
        auth: true,
        body: { message: editingTicketMessage.trim(), status: ticket.status },
      });
      setSupportTickets((current) =>
        current.map((item) =>
          item.id === ticket.id ? payload.ticket || item : item,
        ),
      );
      setEditingTicketId(null);
      setEditingTicketMessage("");
      setTicketMessage(`Ticket ${ticket.ticketNumber} updated.`);
    } catch (error) {
      setTicketMessage(error.message);
    }
  };

  const saveAdminProfile = async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminProfile.email || "")) {
      setProfileMessage("Please enter a valid email address.");
      return;
    }

    if (!canUseAdminApi) {
      setProfileMessage(
        "Administrator backend access is required to save the profile.",
      );
      return;
    }

    try {
      const payload = await apiFetch("/api/admin/profile", {
        method: "PUT",
        auth: true,
        body: { value: adminProfile },
      });
      setAdminProfile({
        ...defaultAdminProfile,
        ...(payload.value || adminProfile),
      });
      setIsEditingProfile(false);
      setEditingProfileField(null);
      setProfileMessage("Admin account saved to backend.");
    } catch (error) {
      setProfileMessage(error.message);
    }
  };

  const updateAdminProfile = (field, value) => {
    setAdminProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const beginProfileFieldEdit = (field) => {
    setIsEditingProfile(true);
    setEditingProfileField(field);
    setProfileMessage("Press Save Account to keep changes.");
  };

  const copyAdminEmail = async () => {
    try {
      await navigator.clipboard.writeText(adminProfile.email);
      setProfileMessage("Email copied to clipboard.");
    } catch {
      setProfileMessage("Email ready to copy: " + adminProfile.email);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setProfileMessage("Please choose a PNG, JPG, WebP, or GIF avatar.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setProfileMessage("Avatar must be 1 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAdminProfile((current) => ({
        ...current,
        avatarUrl: reader.result,
      }));
      setProfileMessage("Avatar selected. Press Save Account to keep it.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const viewAdminAvatar = () => {
    if (!adminProfile.avatarUrl) {
      setProfileMessage("No custom avatar uploaded yet.");
      return;
    }

    window.open(adminProfile.avatarUrl, "_blank", "noopener,noreferrer");
  };

  const removeAdminAvatar = () => {
    setAdminProfile((current) => ({
      ...current,
      avatarUrl: "",
    }));
    setProfileMessage(
      "Avatar removed. Press Save Account to keep this change.",
    );
  };

  const openAdminRoute = (route) => {
    onClose();
    goToRoute(route);
  };

  const runHealthCheck = async () => {
    if (!canUseAdminApi) {
      setStatusMessage(
        "Backend health checks require an Administrator session.",
      );
      return;
    }

    setCheckingHealth(true);
    setStatusMessage("Running service checks...");
    try {
      const payload = await apiFetch("/api/admin/health", { auth: true });
      const checkedAt = payload.checkedAt
        ? new Date(payload.checkedAt).toLocaleString()
        : new Date().toLocaleString();
      const services = Array.isArray(payload.services) ? payload.services : [];
      if (services.length) {
        setHealthRows((current) =>
          services.map((service, index) => ({
            ...current[index % current.length],
            name: service.name,
            state: service.state,
            value: service.value,
          })),
        );
      }
      setHealthCheckedAt(checkedAt);
      setStatusMessage(`Health check completed at ${checkedAt}.`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setCheckingHealth(false);
    }
  };

  const saveReadNotifications = (ids) => {
    setReadNotificationIds(ids);
    window.localStorage.setItem(
      "scholartrend.admin.readNotifications",
      JSON.stringify(ids),
    );
  };

  const markAllNotificationsRead = () => {
    saveReadNotifications(utilityNotifications.map((item) => item.id));
  };

  const openNotification = (item) => {
    const nextReadIds = readNotificationIds.includes(item.id)
      ? readNotificationIds
      : [...readNotificationIds, item.id];
    saveReadNotifications(nextReadIds);
    openAdminRoute(item.route);
  };

  const unreadNotificationCount = utilityNotifications.filter(
    (item) => !readNotificationIds.includes(item.id),
  ).length;

  const renderEditableProfileValue = ({
    label,
    field,
    type = "text",
    multiline = false,
    className = "",
  }) => {
    const isActive = isEditingProfile && editingProfileField === field;
    const value = adminProfile[field] || "";

    if (isActive) {
      const inputProps = {
        value,
        onChange: (event) => updateAdminProfile(field, event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Escape") {
            setEditingProfileField(null);
          }
        },
        autoFocus: true,
      };

      return (
        <label className={`admin-profile-inline-field ${className}`}>
          <span>{label}</span>
          {multiline ? (
            <textarea {...inputProps}></textarea>
          ) : (
            <input type={type} {...inputProps} />
          )}
        </label>
      );
    }

    return (
      <button
        type="button"
        className={`admin-profile-editable-value ${className}`}
        onClick={() => beginProfileFieldEdit(field)}
      >
        <span>{label}</span>
        <strong>{value}</strong>
      </button>
    );
  };

  const panelTitles = {
    status: t("admin.systemStatus"),
    settings: t("admin.adminSettings"),
    support: t("admin.supportCenter"),
    notifications: t("admin.notifications"),
    profile: t("admin.adminAccount"),
  };
  const panelMeta = {
    status: {
      tone: "emerald",
      icon: "M4 12.5 9.2 18 20 6.5M4 6h5l2 4 2-7 2 7 2-4h3",
    },
    settings: {
      tone: "indigo",
      icon: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z",
    },
    support: {
      tone: "blue",
      icon: "M8.5 18.5h7M9 9a3 3 0 1 1 5 2.2c-1 .8-1.7 1.5-1.7 3.1M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
    notifications: {
      tone: "rose",
      icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
    },
    profile: {
      tone: "slate",
      icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
    },
  };

  return (
    <div
      className={`admin-utility-layer ${panel}-utility-layer`}
      role="presentation"
    >
      <button
        type="button"
        className="admin-utility-backdrop"
        aria-label="Close Admin panel"
        onClick={onClose}
      ></button>
      <aside
        className={`admin-utility-panel ${panel}-utility-panel`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-utility-title"
      >
        <header className="admin-utility-header">
          <div className="admin-utility-title-row">
            <span
              className={`admin-utility-title-icon ${panelMeta[panel].tone}`}
            >
              <MiniIcon path={panelMeta[panel].icon} />
            </span>
            <div>
              <span>Administrator</span>
              <h2 id="admin-utility-title">{panelTitles[panel]}</h2>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}>
            <MiniIcon path="M6 6l12 12M18 6 6 18" />
          </button>
        </header>

        {panel === "status" && (
          <div className="admin-utility-body">
            <div className="admin-health-summary">
              <i></i>
              <div>
                <strong>All core services are healthy</strong>
                <span>Last check completed {healthCheckedAt}</span>
              </div>
            </div>
            {healthRows.map(({ name, state, value, icon, tone, route }) => (
              <button
                type="button"
                className="admin-health-row"
                key={name}
                onClick={() => openAdminRoute(route)}
              >
                <i className={`admin-health-icon ${tone}`}>
                  <MiniIcon path={icon} />
                </i>
                <span>{name}</span>
                <strong>{state}</strong>
                <em>{value}</em>
              </button>
            ))}
            <button
              type="button"
              className="admin-panel-primary"
              disabled={checkingHealth}
              onClick={runHealthCheck}
            >
              {checkingHealth ? "Checking..." : "Run Health Check"}
            </button>
            {statusMessage && (
              <p className="admin-panel-note">{statusMessage}</p>
            )}
          </div>
        )}

        {panel === "settings" && (
          <div className="admin-utility-body">
            {[
              [
                "emailAlerts",
                "Email alerts",
                "Send critical system alerts to admins.",
                "M4 6.5h16v11H4zM5.2 7.8l6.8 5 6.8-5",
              ],
              [
                "autoSync",
                "Auto sync",
                "Refresh external publication indexes automatically.",
                "M20 12a8 8 0 1 1-2.34-5.66M20 5v5h-5",
              ],
              [
                "maintenanceMode",
                "Maintenance mode",
                "Limit access while admin changes are applied.",
                "M14.7 6.3 17.7 3.3 20.7 6.3 17.7 9.3 14.7 6.3ZM4 15.5l5.5-5.5 4.5 4.5L8.5 20H4v-4.5Z",
              ],
            ].map(([key, label, description, icon]) => (
              <label className="admin-setting-row" key={key}>
                <i className="admin-setting-icon">
                  <MiniIcon path={icon} />
                </i>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <input
                  className="admin-switch-input"
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                />
                <b className="admin-switch-track" aria-hidden="true"></b>
              </label>
            ))}
            <label className="admin-setting-field">
              <span>Sync interval</span>
              <select
                value={settings.syncInterval}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    syncInterval: event.target.value,
                  }))
                }
              >
                <option>Every 2 hours</option>
                <option>Every 6 hours</option>
                <option>Every 12 hours</option>
                <option>Daily</option>
              </select>
            </label>
            <button
              type="button"
              className="admin-panel-primary"
              onClick={saveSettings}
            >
              Save Settings
            </button>
            {statusMessage && (
              <p className="admin-panel-note">{statusMessage}</p>
            )}
          </div>
        )}

        {panel === "support" && (
          <form className="admin-utility-body" onSubmit={submitTicket}>
            <div className="admin-support-intro">
              <i>
                <MiniIcon path="M8.5 18.5h7M9 9a3 3 0 1 1 5 2.2c-1 .8-1.7 1.5-1.7 3.1M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </i>
              <p className="admin-support-copy">
                Send an internal support note with current workspace context.
              </p>
            </div>
            <label className="admin-setting-field">
              <span>Issue summary</span>
              <textarea
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                placeholder="Describe the admin issue..."
                required
              ></textarea>
            </label>
            <button type="submit" className="admin-panel-primary">
              Create Support Ticket
            </button>
            <div className="admin-support-ticket-list">
              {supportTickets.map((ticket) => (
                <article key={ticket.id} className="admin-support-ticket-item">
                  <div>
                    <strong>{ticket.ticketNumber}</strong>
                    <span>{ticket.status}</span>
                  </div>
                  {editingTicketId === ticket.id ? (
                    <label className="admin-support-inline-editor">
                      <span>Edit ticket content</span>
                      <textarea value={editingTicketMessage} onChange={(event) => setEditingTicketMessage(event.target.value)} rows={4} />
                      <span className="admin-notification-actions">
                        <button type="button" onClick={() => saveSupportTicketEdit(ticket)}>Save</button>
                        <button type="button" onClick={() => { setEditingTicketId(null); setEditingTicketMessage(""); }}>Cancel</button>
                      </span>
                    </label>
                  ) : <p>{ticket.message}</p>}
                  <small>
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleString()
                      : ""}
                  </small>
                  <div className="admin-notification-actions">
                    <button
                      type="button"
                      onClick={() => editSupportTicket(ticket)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSupportTicketStatus(
                          ticket,
                          ticket.status === "Resolved" ? "Open" : "Resolved",
                        )
                      }
                    >
                      {ticket.status === "Resolved" ? "Reopen" : "Resolve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSupportTicket(ticket)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!supportTickets.length ? <p>No support tickets yet.</p> : null}
            </div>
            {ticketMessage && (
              <p className="admin-panel-note">{ticketMessage}</p>
            )}
          </form>
        )}

        {panel === "notifications" && (
          <div className="admin-utility-body">
            <div className="admin-notification-actions">
              <span>{unreadNotificationCount} unread</span>
              <button type="button" onClick={markAllNotificationsRead}>
                Mark All Read
              </button>
            </div>
            {utilityNotifications.map((item) => (
              <button
                type="button"
                className={`admin-notification-item ${
                  readNotificationIds.includes(item.id) ? "" : "unread"
                }`}
                key={item.title}
                onClick={() => openNotification(item)}
              >
                <i className="admin-notification-icon">
                  <MiniIcon path={item.icon} />
                </i>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <span>{item.time}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {panel === "profile" && (
          <form className="admin-utility-body" onSubmit={saveAdminProfile}>
            <div className="admin-profile-card">
              <button
                type="button"
                className="admin-profile-avatar"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Change admin avatar"
              >
                {adminProfile.avatarUrl ? (
                  <img src={adminProfile.avatarUrl} alt={adminProfile.name} />
                ) : (
                  <span>AD</span>
                )}
              </button>
              <input
                ref={avatarInputRef}
                className="admin-profile-avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <div className="admin-profile-card-details">
                {renderEditableProfileValue({
                  label: "Name",
                  field: "name",
                  className: "compact",
                })}
                {renderEditableProfileValue({
                  label: "Email",
                  field: "email",
                  type: "email",
                  className: "compact muted",
                })}
                <small>Administrator access</small>
              </div>
            </div>
            <div className="admin-avatar-actions">
              <button type="button" onClick={viewAdminAvatar}>
                View Avatar
              </button>
              <label>
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </label>
              <button
                type="button"
                onClick={removeAdminAvatar}
                disabled={!adminProfile.avatarUrl}
              >
                Remove
              </button>
            </div>
            {renderEditableProfileValue({
              label: "Role",
              field: "role",
              className: "admin-profile-row",
            })}
            {renderEditableProfileValue({
              label: "Session",
              field: "session",
              className: "admin-profile-row",
            })}
            <div className="admin-profile-info-grid">
              {renderEditableProfileValue({
                label: "Phone",
                field: "phone",
                type: "tel",
              })}
              {renderEditableProfileValue({
                label: "Department",
                field: "department",
              })}
              {renderEditableProfileValue({
                label: "Location",
                field: "location",
              })}
              {renderEditableProfileValue({
                label: "Bio",
                field: "bio",
                multiline: true,
                className: "wide",
              })}
            </div>
            <div className="admin-profile-actions">
              <button
                type={isEditingProfile ? "submit" : "button"}
                className="admin-panel-primary"
                onClick={() => {
                  if (!isEditingProfile) {
                    setIsEditingProfile(true);
                    setEditingProfileField("name");
                    setProfileMessage("");
                  }
                }}
              >
                {isEditingProfile ? "Save Account" : "Edit Account"}
              </button>
              <button
                type="button"
                className="admin-panel-secondary"
                onClick={copyAdminEmail}
              >
                Copy Email
              </button>
            </div>
            {profileMessage && (
              <p className="admin-panel-note">{profileMessage}</p>
            )}
            <button
              type="button"
              className="admin-profile-signout"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}

function AdminShell({
  activeRoute = "/admin-dashboard",
  current,
  sectionPage = false,
  children,
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activePanel, setActivePanel] = React.useState(null);
  const routeClass = activeRoute.replace(/^\//, "").replaceAll("-", "-");

  return (
    <main
      className={`admin-app ${routeClass}-app ${mobileOpen ? "sidebar-mobile-open" : ""}`}
    >
      <button
        type="button"
        className="admin-sidebar-backdrop"
        aria-label="Close Admin navigation"
        onClick={() => setMobileOpen(false)}
      ></button>
      <AdminSidebar
        activeRoute={activeRoute}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenPanel={setActivePanel}
      />
      <section className="admin-main">
        <AdminTopbar
          current={current}
          sectionPage={sectionPage}
          onMenuClick={() => setMobileOpen(true)}
          onOpenPanel={setActivePanel}
        />
        {children}
      </section>
      <AdminUtilityPanel
        panel={activePanel}
        onClose={() => setActivePanel(null)}
      />
    </main>
  );
}

function AdminStatCard({ stat }) {
  const { t } = useTranslation();

  return (
    <article className={`admin-stat-card ${stat.tone}`}>
      <div className="admin-stat-heading">
        <span>{t(stat.label)}</span>
        <MiniIcon path={stat.icon} />
      </div>
      {stat.values ? (
        <div className="admin-api-values">
          {stat.values.map(([label, value]) => (
            <p key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </p>
          ))}
        </div>
      ) : (
        <>
          <strong className="admin-stat-value">{stat.value}</strong>
          <p className="admin-stat-note">{stat.note}</p>
          {stat.tone !== "sync" ? <i className="admin-stat-line"></i> : null}
        </>
      )}
    </article>
  );
}

function AdminUserGrowthChart({ rows = [] }) {
  const canvasRef = React.useRef(null);
  const chartRows =
    Array.isArray(rows) && rows.length
      ? rows
      : [{ label: "No data", count: 0 }];
  const labels = chartRows.map((row) => {
    if (row.label) return row.label;
    const month = Number(row.month || row.Month || 1);
    const year = Number(row.year || row.Year || new Date().getFullYear());
    return new Date(year, month - 1, 1).toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });
  });
  const values = chartRows.map((row) => Number(row.count ?? row.Count ?? 0));
  const suggestedMax = Math.max(4, Math.ceil(Math.max(...values, 1) * 1.2));

  React.useEffect(() => {
    if (!canvasRef.current) return undefined;
    const context = canvasRef.current.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(79, 70, 229, 0.76)");
    gradient.addColorStop(1, "rgba(139, 131, 232, 0.24)");

    const chart = new Chart(context, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Users",
            data: values,
            backgroundColor: gradient,
            borderColor: "#6c63e7",
            borderWidth: 1,
            borderRadius: 2,
            borderSkipped: false,
            barPercentage: 0.83,
            categoryPercentage: 0.92,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700 },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#111827",
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (item) =>
                `${new Intl.NumberFormat("en-US").format(item.raw)} users`,
            },
          },
        },
        scales: {
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: "#667085", font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            suggestedMax,
            border: { display: false },
            grid: { color: "rgba(148, 163, 184, 0.2)" },
            ticks: {
              stepSize: Math.max(1, Math.ceil(suggestedMax / 5)),
              color: "#667085",
              font: { size: 10 },
              callback: (value) => (value >= 1000 ? `${value / 1000}k` : value),
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [labels.join("|"), suggestedMax, values.join("|")]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="User growth over six months"
      role="img"
    ></canvas>
  );
}

function AdminRoleDistributionChart({ rows = [], totalUsers = 0 }) {
  const canvasRef = React.useRef(null);
  const chartRows =
    Array.isArray(rows) && rows.length
      ? rows
      : [{ role: "No users", count: 0 }];
  const labels = chartRows.map((row) => row.role || row.Role || "Unknown");
  const values = chartRows.map((row) => Number(row.count ?? row.Count ?? 0));
  const total = totalUsers || values.reduce((sum, value) => sum + value, 0);

  React.useEffect(() => {
    if (!canvasRef.current) return undefined;
    const centerLabel = {
      id: "adminRoleCenterLabel",
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#172033";
        ctx.font = "700 17px Inter, sans-serif";
        ctx.fillText("Total", centerX, centerY - 8);
        ctx.font = "800 13px Inter, sans-serif";
        ctx.fillText(formatCount(total), centerX, centerY + 14);
        ctx.restore();
      },
    };

    const chart = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ["#5145e5", "#45d6aa", "#cfe1fb", "#101827"],
            borderColor: "#ffffff",
            borderWidth: 3,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        rotation: -88,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (item) => `${item.label}: ${item.raw}` },
          },
        },
      },
      plugins: [centerLabel],
    });

    return () => chart.destroy();
  }, [labels.join("|"), total, values.join("|")]);

  return (
    <canvas ref={canvasRef} aria-label="Role distribution" role="img"></canvas>
  );
}

function AdminActivityPanel({ rows = [] }) {
  return (
    <section className="admin-activity-card">
      <h2>Recent System Activity</h2>
      <div>
        {rows.map((activity, index) => (
          <article key={activity.id || `${activity.text}-${activity.time}-${index}`}>
            <span className={activity.severity === "Error" ? "red" : "green"}>
              <MiniIcon path="M20 12a8 8 0 1 1-2.34-5.66M8.5 12.5l2.3 2.3L16 9" />
            </span>
            <p>
              <strong>{activity.text}</strong>
              <small>{new Date(activity.time).toLocaleString()}</small>
            </p>
          </article>
        ))}
        {!rows.length ? <p>No recent backend activity.</p> : null}
      </div>
      <button type="button" onClick={navTo("/admin-system-logs")}>
        View All Logs
      </button>
    </section>
  );
}

const ADMIN_SYNC_CONFIG_KEY = "scholartrend.adminSyncConfig";

const isLegacyOpenAlexSeedHistoryRow = (row = {}) => {
  const source = String(row.source || row.sourceApi || row.SourceApi || "");
  const status = String(row.status || row.Status || "");
  const records = String(
    row.records ?? row.recordsSynced ?? row.RecordsSynced ?? "0",
  ).replace(/,/g, "");
  const time = String(row.time || row.startedAt || row.StartedAt || "");
  return (
    source === "OpenAlex" &&
    status === "Failed" &&
    Number(records || 0) === 0 &&
    !row.error &&
    !row.errorMessage &&
    !row.ErrorMessage &&
    (time.includes("12/2/2024") || time.includes("2024-12-02"))
  );
};

const sanitizeAdminSyncHistory = (history = []) =>
  history.filter((row) => !isLegacyOpenAlexSeedHistoryRow(row));

const getAdminSyncConfig = () => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(ADMIN_SYNC_CONFIG_KEY) || "null",
    );
    return {
      sources: {
        semantic: false,
        openAlex: true,
        googleScholar: true,
        researchGate: true,
        ...(saved?.sources || {}),
      },
      keywords: Array.isArray(saved?.keywords)
        ? saved.keywords
        : ["Machine Learning", "NLP"],
      cron: saved?.cron || "0 0 * * *",
      rateLimit: Number(saved?.rateLimit || 120),
    };
  } catch {
    return {
      sources: {
        semantic: false,
        openAlex: true,
        googleScholar: true,
        researchGate: true,
      },
      keywords: ["Machine Learning", "NLP"],
      cron: "0 0 * * *",
      rateLimit: 120,
    };
  }
};

const getAdminSyncHistory = () => {
  return [];
};

const setAdminSyncConfig = (config) => {
  window.localStorage.setItem(ADMIN_SYNC_CONFIG_KEY, JSON.stringify(config));
};

const setAdminSyncHistory = () => {};

const normalizeSyncLogForUi = (log) => ({
  source: log.sourceApi || log.SourceApi || log.source || "Unknown source",
  status: log.status || log.Status || "Unknown",
  records: formatCount(log.recordsSynced ?? log.RecordsSynced ?? 0),
  time:
    log.finishedAt || log.FinishedAt || log.startedAt || log.StartedAt
      ? new Date(
          log.finishedAt || log.FinishedAt || log.startedAt || log.StartedAt,
        ).toLocaleString()
      : "N/A",
  timestamp:
    log.finishedAt || log.FinishedAt || log.startedAt || log.StartedAt || null,
  error: log.errorMessage || log.ErrorMessage || "",
  detail:
    log.errorMessage ||
    log.ErrorMessage ||
    `${log.status || log.Status || "Sync"} run from backend log.`,
});

const isRealSyncLog = (log) => {
  const source = log.sourceApi || log.SourceApi || log.source || "";
  return (
    !String(source).startsWith("Admin Audit:") &&
    !isLegacyOpenAlexSeedHistoryRow(log)
  );
};

function AdminSourceToggle({ enabled, onToggle, label, detail }) {
  return (
    <div className="admin-source-toggle">
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <button
        type="button"
        className={enabled ? "enabled" : ""}
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
        onClick={onToggle}
      >
        <i></i>
      </button>
    </div>
  );
}

function AdminSyncConfiguration({ config, onChange }) {
  const [sources, setSources] = React.useState(config.sources);
  const [keywords, setKeywords] = React.useState(config.keywords);
  const [addingKeyword, setAddingKeyword] = React.useState(false);
  const [newKeyword, setNewKeyword] = React.useState("");
  const [cron, setCron] = React.useState(config.cron);
  const [rateLimit, setRateLimit] = React.useState(config.rateLimit);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setSources(config.sources);
    setKeywords(config.keywords);
    setCron(config.cron);
    setRateLimit(config.rateLimit);
  }, [config]);

  const emitConfig = (next = {}) => {
    const merged = {
      sources,
      keywords,
      cron,
      rateLimit,
      ...next,
    };
    onChange(merged);
    setSaved(false);
  };

  const addKeyword = (event) => {
    event.preventDefault();
    const value = newKeyword.trim();
    if (value && !keywords.includes(value)) {
      const nextKeywords = [...keywords, value];
      setKeywords(nextKeywords);
      emitConfig({ keywords: nextKeywords });
    }
    setNewKeyword("");
    setAddingKeyword(false);
  };

  return (
    <section className="admin-sync-config-card">
      <h2>
        <MiniIcon path="M6.5 4v5M6.5 13v7M12 4v8M12 16v4M17.5 4v3M17.5 11v9M4.2 9h4.6M9.8 12h4.4M15.2 7h4.6M15.2 11h4.6" />
        Configuration
      </h2>
      <div className="admin-config-body">
        <AdminSourceToggle
          enabled={sources.openAlex}
          onToggle={() => {
            const nextSources = { ...sources, openAlex: !sources.openAlex };
            setSources(nextSources);
            emitConfig({ sources: nextSources });
          }}
          label="OpenAlex"
          detail="Open scholarly metadata API"
        />
        <AdminSourceToggle
          enabled={sources.googleScholar}
          onToggle={() => {
            const nextSources = {
              ...sources,
              googleScholar: !sources.googleScholar,
            };
            setSources(nextSources);
            emitConfig({ sources: nextSources });
          }}
          label="Google Scholar"
          detail="Scholar results through SerpApi"
        />
        <AdminSourceToggle
          enabled={sources.researchGate}
          onToggle={() => {
            const nextSources = {
              ...sources,
              researchGate: !sources.researchGate,
            };
            setSources(nextSources);
            emitConfig({ sources: nextSources });
          }}
          label="ResearchGate"
          detail="ResearchGate publication pages via Scholar lookup"
        />
        <AdminSourceToggle
          enabled={sources.semantic}
          onToggle={() => {
            const nextSources = { ...sources, semantic: !sources.semantic };
            setSources(nextSources);
            emitConfig({ sources: nextSources });
          }}
          label="Semantic Scholar"
          detail="Optional Graph API source"
        />

        <div className="admin-config-field admin-keyword-field">
          <label>Keyword Filters</label>
          <div>
            {keywords.map((keyword) => (
              <span key={keyword}>
                {keyword}
                <button
                  type="button"
                  aria-label={`Remove ${keyword}`}
                  onClick={() => {
                    const nextKeywords = keywords.filter(
                      (item) => item !== keyword,
                    );
                    setKeywords(nextKeywords);
                    emitConfig({ keywords: nextKeywords });
                  }}
                >
                  <MiniIcon path="M6 6l12 12M18 6 6 18" />
                </button>
              </span>
            ))}
            {addingKeyword ? (
              <form onSubmit={addKeyword}>
                <input
                  autoFocus
                  value={newKeyword}
                  onChange={(event) => setNewKeyword(event.target.value)}
                  onBlur={() => !newKeyword && setAddingKeyword(false)}
                  aria-label="New keyword"
                />
              </form>
            ) : (
              <button
                type="button"
                className="admin-add-keyword"
                aria-label="Add keyword"
                onClick={() => setAddingKeyword(true)}
              >
                +
              </button>
            )}
          </div>
        </div>

        <div className="admin-config-field admin-cron-field">
          <label htmlFor="admin-cron">Cron Schedule</label>
          <div>
            <input
              id="admin-cron"
              value={cron}
              onChange={(event) => {
                const nextCron = event.target.value;
                setCron(nextCron);
                emitConfig({ cron: nextCron });
              }}
            />
            <span>Daily at midnight</span>
          </div>
        </div>

        <div className="admin-config-field admin-rate-field">
          <label htmlFor="admin-rate">
            Rate Limit (req/min)<strong>{rateLimit}</strong>
          </label>
          <input
            id="admin-rate"
            type="range"
            min="10"
            max="500"
            value={rateLimit}
            onChange={(event) => {
              const nextRateLimit = Number(event.target.value);
              setRateLimit(nextRateLimit);
              emitConfig({ rateLimit: nextRateLimit });
            }}
          />
          <div>
            <span>10</span>
            <span>500</span>
          </div>
        </div>
      </div>
      <div className="admin-config-save">
        <button
          type="button"
          onClick={() => {
            const nextConfig = { sources, keywords, cron, rateLimit };
            onChange(nextConfig);
            setAdminSyncConfig(nextConfig);
            setSaved(true);
          }}
        >
          {saved ? "Configuration Saved" : "Save Configuration"}
        </button>
      </div>
    </section>
  );
}

function AdminSyncHistory({ history }) {
  const [failedOnly, setFailedOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 4;
  const rows = failedOnly
    ? history.filter((item) => item.status === "Failed")
    : history;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const downloadLogs = () => {
    const header = "Source API,Status,Records Synced,Start Time";
    const body = history
      .map(
        (row) =>
          `${row.source},${row.status},${row.records.replace(",", "")},${row.time}`,
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`${header}\n${body}`], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scholartrend-sync-history.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-sync-history-card" id="admin-sync-history">
      <div className="admin-sync-history-heading">
        <h2>
          <MiniIcon path="M4 12a8 8 0 1 0 2.35-5.65M4.2 5.2v5h5M12 7.7v4.7l3.2 1.9M8.2 18.2h7.6" />
          Sync History / Logs
        </h2>
        <div>
          <button
            type="button"
            className={failedOnly ? "active" : ""}
            aria-label="Filter failed logs"
            onClick={() => setFailedOnly((value) => !value)}
          >
            <MiniIcon path="M4.5 6.5h15M7.5 11.8h9M10 17h4M8.5 6.5l2.5 5.3v3.8M15.5 6.5 13 11.8v3.8" />
          </button>
          <button
            type="button"
            aria-label="Download sync logs"
            onClick={downloadLogs}
          >
            <MiniIcon path="M12 4v9M8.5 9.5 12 13l3.5-3.5M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16M7.5 16h9" />
          </button>
        </div>
      </div>
      <div className="admin-sync-table-wrap">
        <table className="admin-sync-table">
          <thead>
            <tr>
              <th>Source API</th>
              <th>Status</th>
              <th>Records Synced</th>
              <th>Start Time</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, rowIndex) => (
              <React.Fragment key={`${row.source}-${row.time}-${rowIndex}`}>
                <tr className={row.status.toLowerCase()}>
                  <td>
                    <i></i>
                    {row.source}
                  </td>
                  <td>
                    <span className="admin-sync-status-pill">{row.status}</span>
                  </td>
                  <td>{row.records}</td>
                  <td>{row.time}</td>
                </tr>
                {row.error ? (
                  <tr className="admin-sync-error-row">
                    <td colSpan="4">
                      <div>
                        <MiniIcon path="M8.2 3.8h7.6l4.4 4.4v7.6l-4.4 4.4H8.2l-4.4-4.4V8.2l4.4-4.4ZM12 8.2v5.2M12 16.5h.01" />
                        <p>
                          <strong>{row.error}</strong>
                          <span>{row.detail}</span>
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!row.error && row.detail ? (
                  <tr className="admin-sync-detail-row">
                    <td colSpan="4">
                      <span>API response</span>
                      <strong>{row.detail}</strong>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="admin-sync-pagination">
        <span>
          Showing {pagedRows.length} of {rows.length} runs
        </span>
        <div>
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            <MiniIcon path="M15 18l-6-6 6-6" />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (number) => (
              <button
                type="button"
                className={safePage === number ? "active" : ""}
                onClick={() => setPage(number)}
                key={number}
              >
                {number}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            <MiniIcon path="M9 18l6-6-6-6" />
          </button>
        </div>
      </footer>
    </section>
  );
}

function AdminSyncManagementPage() {
  const canUseAdminApi = hasAdminBackendAccess();
  const [config, setConfig] = React.useState(getAdminSyncConfig);
  const [history, setHistory] = React.useState(getAdminSyncHistory);
  const [running, setRunning] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState("");

  React.useEffect(() => {
    if (!canUseAdminApi) {
      setSyncMessage(
        "Admin backend access required. Log out, choose Administrator, then sign in with an admin account.",
      );
      return;
    }

    apiFetch("/api/admin/sync-config", { auth: true })
      .then((payload) => {
        if (payload.value) {
          setConfig({
            sources: {
              openAlex: true,
              googleScholar: true,
              researchGate: true,
              semantic: false,
              ...(payload.value.sources || {}),
            },
            keywords: Array.isArray(payload.value.keywords)
              ? payload.value.keywords
              : ["Machine Learning", "NLP"],
            cron: payload.value.cron || "0 0 * * *",
            rateLimit: Number(payload.value.rateLimit || 120),
          });
        }
      })
      .catch((error) => {
        setSyncMessage(error.message);
      });

    apiFetch("/api/admin/sync-logs?page=1&pageSize=20", { auth: true })
      .then((payload) => {
        const rows = unwrapList(payload)
          .filter(isRealSyncLog)
          .map(normalizeSyncLogForUi);
        setHistory(rows);
      })
      .catch((error) => {
        setSyncMessage(error.message);
      });
  }, [canUseAdminApi]);

  const persistHistory = (nextHistory) => {
    setHistory(nextHistory);
    setAdminSyncHistory(nextHistory);
  };

  const saveConfig = (nextConfig) => {
    if (!canUseAdminApi) {
      setSyncMessage("Administrator backend access is required to save sync configuration.");
      return;
    }

    const previousConfig = config;
    setConfig(nextConfig);
    apiFetch("/api/admin/sync-config", {
      method: "PUT",
      auth: true,
      body: { value: nextConfig },
    })
      .then(() => setSyncMessage("Sync configuration saved to backend."))
      .catch((error) => {
        setConfig(previousConfig);
        setSyncMessage(`Could not save sync configuration: ${error.message}`);
      });
  };

  const formatSyncRunTime = () =>
    new Date().toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleManualSync = async () => {
    if (running) return;
    if (!canUseAdminApi) {
      setSyncMessage("Manual sync requires an Administrator session.");
      return;
    }

    setRunning(true);
    setSyncMessage("Manual sync is running...");

    const runTime = formatSyncRunTime();
    try {
      const payload = await apiFetch("/api/admin/sync/manual", {
        method: "POST",
        auth: true,
        body: {
          sources: {
            semantic: Boolean(config.sources.semantic),
            openAlex: Boolean(config.sources.openAlex),
            googleScholar: Boolean(config.sources.googleScholar),
            researchGate: Boolean(config.sources.researchGate),
          },
          keywords: config.keywords,
          maxResults: 20,
        },
      });

      const nextRows = Array.isArray(payload.results)
        ? payload.results.map((result) => ({
            source: result.source || "Manual Sync",
            status: result.status || "Completed",
            records: formatCount(result.recordsSynced ?? 0),
            time: runTime,
            error: result.error || "",
            detail:
              result.error ||
              payload.message ||
              `Imported abstract metadata for ${config.keywords.join(", ") || "all keywords"}.`,
          }))
        : [
            {
              source: "Manual Sync",
              status: "Completed",
              records: formatCount(payload.recordsSynced ?? 0),
              time: runTime,
              detail: payload.message || "Manual sync completed.",
            },
          ];

      persistHistory([...nextRows, ...history]);
      apiFetch("/api/admin/sync-logs?page=1&pageSize=20", { auth: true })
        .then((latestLogs) => {
          const rows = unwrapList(latestLogs)
            .filter(isRealSyncLog)
            .map(normalizeSyncLogForUi);
          setHistory(rows);
          setAdminSyncHistory(rows);
        })
        .catch(() => {});
      setSyncMessage(
        payload.message || "Manual sync completed and added to history.",
      );
    } catch (error) {
      const failedRow = {
        source: "Manual Sync",
        status: "Failed",
        records: "0",
        time: runTime,
        error: "Sync request failed",
        detail: error.message || "Backend sync endpoint did not complete.",
      };
      persistHistory([failedRow, ...history]);
      setSyncMessage(error.message);
    } finally {
      setRunning(false);
    }
  };

  const lastSuccess = history.find((row) => row.status === "Completed");
  const failedCount = history.filter((row) => {
    if (row.status !== "Failed") return false;
    const timestamp = new Date(row.timestamp || row.time).getTime();
    if (
      !Number.isFinite(timestamp) ||
      timestamp < Date.now() - 24 * 60 * 60 * 1000
    ) {
      return false;
    }

    // A later successful run for the same source resolves the earlier failure.
    return !history.some((later) => {
      if (later.status !== "Completed" || later.source !== row.source) {
        return false;
      }
      const laterTimestamp = new Date(
        later.timestamp || later.time,
      ).getTime();
      return Number.isFinite(laterTimestamp) && laterTimestamp > timestamp;
    });
  }).length;

  const reviewLogs = () =>
    document
      .getElementById("admin-sync-history")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <AdminShell
      activeRoute="/admin-sync-management"
      current="Sync Management"
      sectionPage
    >
      <div className="admin-sync-content">
        <header className="admin-sync-page-heading">
          <div>
            <p>
              Dashboard <span>/</span> <strong>Sync Management</strong>
            </p>
            <h1>Sync Management</h1>
          </div>
          <button
            type="button"
            className={running ? "running" : ""}
            onClick={handleManualSync}
            disabled={running}
          >
            <MiniIcon path="M5 12a7 7 0 0 1 11.9-5M17 4.5v4h-4M19 12a7 7 0 0 1-11.9 5M7 19.5v-4h4M12 9v3l2 1.2" />
            {running ? "Manual Sync Running" : "Trigger Manual Sync"}
          </button>
        </header>

        <section className="admin-sync-status-grid" aria-label="Sync status">
          <article className="running-card">
            <div>
              <span>Currently Running</span>
              <MiniIcon path="M5 12a7 7 0 0 1 11.9-5M17 4.5v4h-4M19 12a7 7 0 0 1-11.9 5M7 19.5v-4h4M10 10h4v4h-4z" />
            </div>
            <strong>
              {running ? "1" : "0"}
              <small>jobs</small>
            </strong>
            <p>
              <i className={running ? "active" : ""}></i>
              {running ? "Manual Sync Active" : "System Idle"}
            </p>
          </article>
          <article className="success-card">
            <div>
              <span>Last Successful Sync</span>
              <MiniIcon path="M12 3.5 19 6.4v5.4c0 4.2-2.8 7.3-7 8.7-4.2-1.4-7-4.5-7-8.7V6.4l7-2.9ZM8.7 12.2l2.2 2.2 4.6-5" />
            </div>
            <strong>{lastSuccess?.time || "No sync yet"}</strong>
            <p>{lastSuccess?.records || "0"} records</p>
            <i className="database-shape"></i>
          </article>
          <article className="failed-card">
            <div>
              <span>Failed in Last 24h</span>
              <MiniIcon path="M8.2 3.8h7.6l4.4 4.4v7.6l-4.4 4.4H8.2l-4.4-4.4V8.2l4.4-4.4ZM12 8.2v5.2M12 16.5h.01" />
            </div>
            <strong>
              {failedCount}
              <small>events</small>
            </strong>
            <button type="button" onClick={reviewLogs}>
              Review Logs
            </button>
          </article>
        </section>
        {syncMessage ? (
          <p className="admin-sync-message">{syncMessage}</p>
        ) : null}

        <div className="admin-sync-layout">
          <AdminSyncConfiguration config={config} onChange={saveConfig} />
          <AdminSyncHistory history={history} />
        </div>
      </div>
    </AdminShell>
  );
}

function AdminDashboard() {
  const { t } = useTranslation();
  const canUseAdminApi = hasAdminBackendAccess();
  const {
    data: adminOverview,
    status: overviewStatus,
    error: overviewError,
  } = useApiResource(canUseAdminApi ? "/api/admin/overview" : null, null, {
    auth: true,
  });
  const overviewStats = React.useMemo(() => {
    if (!adminOverview) {
      const note = !canUseAdminApi
        ? "Admin backend access required"
        : overviewStatus === "error"
          ? `Backend unavailable: ${overviewError?.message || "unknown error"}`
          : "Loading from backend...";
      return adminStats.map((stat) => ({
        ...stat,
        value: stat.value ? "\u26A0" : stat.value,
        note,
        values: stat.values?.map(([label]) => [label, "\u26A0"]),
      }));
    }
    return adminStats.map((stat) => {
      if (stat.label === "admin.totalUsers") {
        return {
          ...stat,
          value: formatCount(adminOverview.totalUsers),
          note: "Registered backend users",
        };
      }
      if (stat.label === "admin.totalPublications") {
        return {
          ...stat,
          value: formatCount(adminOverview.totalPublications),
          note: `${formatCount(adminOverview.totalKeywords)} tracked keywords`,
        };
      }
      if (stat.label === "admin.lastSyncStatusLabel") {
        return {
          ...stat,
          value: adminOverview.lastSync?.status || "Idle",
          note: adminOverview.lastSync?.finishedAt
            ? new Date(adminOverview.lastSync.finishedAt).toLocaleString()
            : "No completed sync yet",
        };
      }
      if (stat.label === "admin.apiHealth") {
        return {
          ...stat,
          values: (adminOverview.apiHealth || stat.values).map((item) => [
            item.label,
            item.value,
          ]),
        };
      }
      return stat;
    });
  }, [adminOverview]);

  const exportUserData = () => {
    const rows = adminOverview?.userGrowth || [];
    const csv = [
      "Month,Users",
      ...rows.map((row) => {
        const month = Number(row.month || row.Month || 1);
        const year = Number(row.year || row.Year || new Date().getFullYear());
        const label = new Date(year, month - 1, 1).toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });
        return `${label},${Number(row.count ?? row.Count ?? 0)}`;
      }),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scholartrend-admin-user-growth.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const managedUserCount = Number(adminOverview?.totalUsers || 0);
  const pendingPublicationCount = Number(
    adminOverview?.pendingPublicationCount || 0,
  );
  const blockedPublicationCount = Number(
    adminOverview?.blockedPublicationCount || 0,
  );
  const managedRoleDistribution = (adminOverview?.roleDistribution || []).filter(
    (row) => normalizeRoleForUi(row.role || row.Role) !== "Administrator",
  );
  const managedRoleTotal = managedRoleDistribution.reduce(
    (total, row) => total + Number(row.count ?? row.Count ?? 0),
    0,
  );
  const roleLegend = managedRoleDistribution.map(
    (row, index) => {
      const count = Number(row.count ?? row.Count ?? 0);
      return [
        row.role || row.Role || "Unknown",
        managedRoleTotal
          ? `${Math.round((count / managedRoleTotal) * 100)}%`
          : "0%",
        ["#5145e5", "#45d6aa", "#cfe1fb", "#101827"][index % 4],
      ];
    },
  );
  const adminControlCards = [
    {
      title: "Users & Roles",
      detail: "Create, edit, deactivate, delete, and assign roles.",
      value: `${managedUserCount} accounts`,
      route: "/admin-user-management",
      icon: "M8.8 11.4a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4ZM3.4 20a5.4 5.4 0 0 1 10.8 0M17 9.8a3 3 0 1 0 0-6M15.8 14.2a5.1 5.1 0 0 1 4.8 5.8",
    },
    {
      title: "Notifications",
      detail:
        "Publish system notices for students, lecturers, and researchers.",
      value: `${Number(adminOverview?.unreadNotificationCount || 0)} unread`,
      route: "/admin-notifications",
      icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
    },
    {
      title: "Sync & Logs",
      detail: "Run Scholar sync, monitor API health, and audit events.",
      value: adminOverview?.lastSync?.status || "Idle",
      route: "/admin-sync-management",
      icon: "M5 7.5h9.5a4.5 4.5 0 0 1 4.2 6.1M18.8 7.5h-4.3V3.2M19 16.5H9.5a4.5 4.5 0 0 1-4.2-6.1M5.2 16.5h4.3v4.3",
    },
  ];

  return (
    <AdminShell activeRoute="/admin-dashboard" current="Overview">
      <div className="admin-dashboard-content">
        {!canUseAdminApi ? (
          <p
            className="admin-sync-message"
            style={{
              background: "#fef3c7",
              color: "#92400e",
              borderColor: "#fcd34d",
            }}
          >
            Admin backend access required. Log out, choose Administrator, then
            sign in with an admin account.
          </p>
        ) : overviewStatus === "error" ? (
          <p
            className="admin-sync-message"
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              borderColor: "#fca5a5",
            }}
          >
            Could not load dashboard data from backend:{" "}
            {overviewError?.message || "Server connection failed"}. The stats
            shown below are placeholder values. Check that the .NET backend is
            running.
          </p>
        ) : null}

        <section className="admin-stat-grid" aria-label="Administrator metrics">
          {overviewStats.map((stat) => (
            <AdminStatCard stat={stat} key={stat.label} />
          ))}
        </section>

        <section
          className="admin-control-center"
          aria-label="Admin control center"
        >
          <div className="admin-control-heading">
            <div>
              <span>Full Access</span>
              <h2>Admin Control Center</h2>
            </div>
            <p>
              Administrator has full control over accounts, publication review,
              similarity policy, sync jobs, logs, and system panels.
            </p>
          </div>
          <div className="admin-control-grid">
            {adminControlCards.map((item) => (
              <button
                type="button"
                key={item.title}
                onClick={navTo(item.route)}
              >
                <i>
                  <MiniIcon path={item.icon} />
                </i>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <b>{item.value}</b>
              </button>
            ))}
          </div>
        </section>

        <div className="admin-dashboard-grid">
          <div className="admin-dashboard-left">
            <section className="admin-chart-card admin-growth-card">
              <div className="admin-card-heading">
                <h2>User Growth (6 Months)</h2>
                <button type="button" onClick={exportUserData}>
                  Export Data
                </button>
              </div>
              <div className="admin-growth-chart">
                <AdminUserGrowthChart rows={adminOverview?.userGrowth || []} />
              </div>
            </section>

            <section className="admin-chart-card admin-role-card">
              <div className="admin-card-heading">
                <h2>Role Distribution</h2>
              </div>
              <div className="admin-role-layout">
                <div className="admin-role-chart">
                  <AdminRoleDistributionChart
                    rows={managedRoleDistribution}
                    totalUsers={managedRoleTotal}
                  />
                </div>
                <div className="admin-role-legend">
                  {roleLegend.map(([label, value, color]) => (
                    <p key={label}>
                      <span>
                        <i style={{ background: color }}></i>
                        {label}
                      </span>
                      <strong>{value}</strong>
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="admin-dashboard-right">
            <section className="admin-sync-alert">
              <MiniIcon path="M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01" />
              <div>
                <h2>Failed Syncs Alert</h2>
                <p>
                  {Number(adminOverview?.failedSyncsLast24Hours || 0)} failed
                  syncs during the last 24 hours.
                </p>
                <button type="button" onClick={navTo("/admin-system-logs")}>
                  Review Logs
                </button>
              </div>
            </section>
            <AdminActivityPanel rows={adminOverview?.recentActivity || []} />
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

const adminRoleOptions = ["Researcher", "Lecturer", "Student"];
const adminStatusOptions = ["Active", "Inactive"];

const getAdminUserInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "ST";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const formatAdminDateTime = (value, fallback = "N/A") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeAdminManagedUser = (user) => {
  const normalizedRole = normalizeRoleForUi(user.role || "Student");
  const isSystemAdministrator = normalizedRole === "Administrator";
  const managedRole = isSystemAdministrator
    ? "Administrator"
    : adminRoleOptions.includes(normalizedRole)
      ? normalizedRole
      : "Student";

  return {
  id:
    user.id ||
    `admin-user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  backendId: user.backendId || "",
  provider: user.provider || "",
  academicIdentity: user.academicIdentity || {},
  requestedRole:
    user.requestedRole || user.academicIdentity?.requestedRole || "",
  verificationStatus: user.verificationStatus || "not_submitted",
  verificationSubmittedAt: user.verificationSubmittedAt || "",
  verificationReviewedAt: user.verificationReviewedAt || "",
  name: user.name || user.fullName || "Unnamed User",
  email: user.email || "",
  role: managedRole,
  isSystemAdministrator,
  status: user.status || (user.isActive === false ? "Inactive" : "Active"),
  createdAt: user.createdAt || user.createdOn || "",
  lastLoginAt: user.lastLoginAt || user.lastLogin || "",
  lastLogin: formatAdminDateTime(
    user.lastLoginAt || user.lastLogin,
    "Never signed in",
  ),
  createdLabel: formatAdminDateTime(
    user.createdAt || user.createdOn,
    "Created date unavailable",
  ),
  searchAccuracy: 100,
  avatar: user.avatar || getAdminUserInitials(user.name || user.fullName),
  avatarTone:
    user.avatarTone ||
    (managedRole === "Lecturer"
        ? "green"
        : managedRole === "Student"
          ? "muted"
          : "photo"),
  // Track when this user record was last updated (for merge logic)
  updatedAt:
    user.updatedAt ||
    user.lastLoginAt ||
    user.createdAt ||
    new Date().toISOString(),
  };
};

const getAdminManagedUsers = () => [];
const setAdminManagedUsers = () => {};

const fetchAdminUsersFromAuthHelper = async () => {
  if (!GOOGLE_AUTH_BASE_URL) return [];
  const token = getStoredAuth().accessToken;
  if (!token) return [];
  const response = await fetch(`${GOOGLE_AUTH_BASE_URL}/api/admin/users`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Could not load users from the authentication helper.",
    );
  }
  return Array.isArray(payload.items)
    ? payload.items.map(normalizeAdminManagedUser)
    : [];
};

const upsertAdminManagedUserFromAccount = (account) => {
  if (!account?.email) return;
  const users = getAdminManagedUsers();
  const normalizedEmail = account.email.toLowerCase();
  const existingIndex = users.findIndex(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );
  const nextUser = normalizeAdminManagedUser({
    ...(existingIndex >= 0 ? users[existingIndex] : {}),
    id: account.id || users[existingIndex]?.id,
    name: account.name || account.fullName || users[existingIndex]?.name,
    email: normalizedEmail,
    role: normalizeRoleForUi(account.role),
    status: "Active",
    searchAccuracy: account.searchAccuracy,
    lastLogin: account.lastLoginAt || account.signedInAt || "Just now",
    lastLoginAt:
      account.lastLoginAt || account.signedInAt || new Date().toISOString(),
    createdAt: account.createdAt,
  });
  const nextUsers =
    existingIndex >= 0
      ? users.map((user, index) => (index === existingIndex ? nextUser : user))
      : [nextUser, ...users];
  setAdminManagedUsers(nextUsers);
};

function AdminPublicationManagementPage() {
  const canUseAdminApi = hasAdminBackendAccess();

  return (
    <AdminShell
      activeRoute="/admin-publications"
      current="Publication Management"
    >
      <div className="admin-publications-content">
        <header className="admin-users-heading">
          <div>
            <p>
              Dashboard <span>/</span> <strong>Publication Management</strong>
            </p>
            <h1>Publication Management</h1>
            <small>
              Manage submitted papers, AI similarity results, approval
              decisions, and rejection notices
            </small>
          </div>
        </header>
        {!canUseAdminApi ? (
          <p className="admin-users-message" role="status">
            Admin backend access required. Log out, choose Administrator, then
            sign in with an admin account.
          </p>
        ) : null}

      </div>
    </AdminShell>
  );
}

function AdminUserManagementPage() {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState("All Roles");
  const [status, setStatus] = React.useState("All Statuses");
  const [page, setPage] = React.useState(1);
  const [users, setUsers] = React.useState(getAdminManagedUsers);
  const [editor, setEditor] = React.useState(null);
  const [pendingAction, setPendingAction] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [saveConfirmation, setSaveConfirmation] = React.useState(null);
  const pageSize = 5;
  const adminAccessMessage =
    "Admin backend access required. Log out, choose Administrator, then sign in with admin.dev@scholartrend.test.";

  const persistUsers = (nextUsers) => {
    setUsers(nextUsers);
    setAdminManagedUsers(nextUsers);
  };

  const visibleUsers = users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesRole = role === "All Roles" || user.role === role;
    const matchesStatus = status === "All Statuses" || user.status === status;
    return matchesQuery && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedUsers = visibleUsers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const activeCount = users.filter((user) => {
    if (user.lastLoginAt) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return new Date(user.lastLoginAt).getTime() >= thirtyDaysAgo;
    }
    return user.status === "Active";
  }).length;
  const roleCounts = adminRoleOptions.reduce(
    (acc, option) => ({
      ...acc,
      [option]: users.filter((user) => user.role === option).length,
    }),
    {},
  );
  const summaryCards = [
    {
      label: "admin.totalUsers",
      value: formatCount(users.length),
      note: `${formatCount(activeCount)} active accounts`,
      icon: "M8.8 11.4a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4ZM3.4 20a5.4 5.4 0 0 1 10.8 0M17 9.8a3 3 0 1 0 0-6M15.8 14.2a5.1 5.1 0 0 1 4.8 5.8",
    },
    {
      label: "Active Users (30d)",
      value: formatCount(activeCount),
      note: `${formatCount(users.length - activeCount)} inactive accounts`,
      icon: "M12 3.5 19 6.5v5.2c0 4.2-2.8 7.3-7 8.8-4.2-1.5-7-4.6-7-8.8V6.5l7-3ZM9 12.2l2 2 4.2-4.6",
    },
  ];

  React.useEffect(() => {
    setPage(1);
  }, [query, role, status]);

  const loadBackendUsers = React.useCallback(async (options = {}) => {
    if (!hasAdminBackendAccess()) {
      setMessage(adminAccessMessage);
      return [];
    }

    const backendPageSize = 100;
    const backendUsers = [];
    let backendPage = 1;
    let totalBackendUsers = null;

    while (
      totalBackendUsers === null ||
      backendUsers.length < totalBackendUsers
    ) {
      const payload = await apiFetch(
        `/api/admin/users?page=${backendPage}&pageSize=${backendPageSize}`,
        { auth: true },
      );
      const pageUsers = Array.isArray(payload?.items)
        ? payload.items.map((user) =>
            normalizeAdminManagedUser({
              ...user,
              backendId: String(user.id),
            }),
          )
        : [];

      backendUsers.push(...pageUsers);
      totalBackendUsers = Number.isFinite(Number(payload?.totalCount))
        ? Number(payload.totalCount)
        : backendUsers.length;

      if (!pageUsers.length || pageUsers.length < backendPageSize) break;
      backendPage += 1;
    }

    const helperUsers = await fetchAdminUsersFromAuthHelper().catch(() => []);
    const helperByEmail = new Map(
      helperUsers.map((user) => [String(user.email).toLowerCase(), user]),
    );
    const mergedUsers = backendUsers.map((user) => {
      const helperUser = helperByEmail.get(String(user.email).toLowerCase());
      const sqlHasIdentity = Object.values(user.academicIdentity || {}).some(
        (value) => String(value || "").trim(),
      );
      const helperHasIdentity = Boolean(
        helperUser &&
          Object.values(helperUser.academicIdentity || {}).some((value) =>
            String(value || "").trim(),
          ),
      );
      return helperUser
        ? normalizeAdminManagedUser({
            ...user,
            academicIdentity: !sqlHasIdentity && helperHasIdentity
              ? helperUser.academicIdentity
              : user.academicIdentity,
            verificationStatus: user.verificationStatus,
            verificationSubmittedAt: user.verificationSubmittedAt,
            verificationReviewedAt: user.verificationReviewedAt,
          })
        : user;
    });
    persistUsers(mergedUsers);
    if (!options.silent) setMessage("Users loaded from SQL Server.");
    return mergedUsers;
  }, []);

  React.useEffect(() => {
    if (!saveConfirmation) return undefined;
    const timeoutId = window.setTimeout(() => setSaveConfirmation(null), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [saveConfirmation]);

  React.useEffect(() => {
    let cancelled = false;
    loadBackendUsers()
      .then((backendUsers) => {
        if (cancelled || backendUsers.length) return;
        persistUsers([]);
      })
      .catch((error) => {
        if (!cancelled) {
          persistUsers([]);
          setMessage(`Could not load users from SQL Server: ${error.message}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadBackendUsers]);

  const openInviteUser = () => {
    setMessage("");
    setEditor({
      mode: "invite",
      id: null,
      name: "",
      email: "",
      role: "Student",
      status: "Active",
      createdAt: new Date().toISOString(),
      lastLoginAt: "",
      password: "",
    });
  };

  const openEditUser = (user) => {
    setMessage("");
    setEditor({
      mode: "edit",
      ...user,
      password: "",
    });
  };

  const closeEditor = () => {
    if (pendingAction) return;
    setEditor(null);
  };

  const saveEditor = async (event) => {
    event.preventDefault();
    if (!editor) return;

    const normalizedEmail = editor.email.trim().toLowerCase();
    const trimmedName = editor.name.trim();
    if (!trimmedName || !normalizedEmail) {
      setMessage("Name and email are required.");
      return;
    }

    const emailExists = users.some(
      (user) =>
        user.email.toLowerCase() === normalizedEmail && user.id !== editor.id,
    );
    if (emailExists) {
      setMessage("This email already exists.");
      return;
    }

    if (editor.mode === "edit") {
      if (!editor.backendId) {
        const response = await fetch(
          `${GOOGLE_AUTH_BASE_URL}/api/admin/users/${encodeURIComponent(editor.email || editor.id)}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: trimmedName,
              email: normalizedEmail,
              role: editor.role,
              isActive: editor.status === "Active",
              verificationStatus: editor.verificationStatus,
            }),
          },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setMessage(payload.error || "Could not update this user.");
          return;
        }
        const nextUser = normalizeAdminManagedUser({
          ...payload.user,
          academicIdentity: editor.academicIdentity,
          verificationStatus: editor.verificationStatus,
        });
        persistUsers(
          users.map((user) => (user.id === editor.id ? nextUser : user)),
        );
        setMessage("User updated successfully.");
        closeEditor();
        return;
      }

      if (!hasAdminBackendAccess()) {
        const nextUser = normalizeAdminManagedUser({
          ...editor,
          name: trimmedName,
          email: normalizedEmail,
          status: editor.status,
        });
        persistUsers(
          users.map((user) => (user.id === editor.id ? nextUser : user)),
        );
        setMessage(
          "User updated locally. Sign in as Administrator to sync SQL Server.",
        );
        setEditor(null);
        return;
      }

      try {
        setPendingAction(`edit:${editor.id}`);
        const payload = await apiFetch(`/api/admin/users/${editor.id}`, {
          method: "PUT",
          auth: true,
          body: {
            fullName: trimmedName,
            email: normalizedEmail,
            role: normalizeRoleForApi(editor.role),
            status: editor.status,
            isActive: editor.status === "Active",
            verificationStatus: editor.verificationStatus,
          },
        });
        if (editor.password?.trim()) {
          await apiFetch(`/api/admin/users/${editor.id}/reset-password`, {
            method: "POST",
            auth: true,
            body: { newPassword: editor.password },
          });
        }
        const nextUser = normalizeAdminManagedUser({
          ...payload.user,
          academicIdentity: editor.academicIdentity,
          verificationStatus: editor.verificationStatus,
        });
        persistUsers(
          users.map((user) => (user.id === editor.id ? nextUser : user)),
        );
        const verificationLabel =
          editor.verificationStatus === "verified"
            ? "Verified"
            : editor.verificationStatus === "rejected"
              ? "Rejected"
              : editor.verificationStatus === "pending"
                ? "Pending review"
                : "Not submitted";
        const confirmationText =
          editor.verificationStatus === "verified"
            ? `${trimmedName} (${normalizedEmail}) was verified as ${editor.role}. The account can use the ${editor.role} workspace.`
            : `${trimmedName} (${normalizedEmail}) was saved with verification status: ${verificationLabel}.`;
        setMessage(confirmationText);
        setSaveConfirmation({
          title:
            editor.verificationStatus === "verified"
              ? "Account verification successful"
              : "Account changes saved",
          text: confirmationText,
          tone:
            editor.verificationStatus === "rejected" ? "rejected" : "success",
        });
        if (GOOGLE_AUTH_BASE_URL && editor.academicIdentity) {
          try {
            await fetch(
              `${GOOGLE_AUTH_BASE_URL}/api/admin/users/${encodeURIComponent(editor.email)}`,
              {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: trimmedName,
                  email: normalizedEmail,
                  role: editor.role,
                  isActive: editor.status === "Active",
                  verificationStatus: editor.verificationStatus,
                }),
              },
            );
          } catch {
            // best-effort identity decision sync
          }
        }
        setEditor(null);
        loadBackendUsers({ silent: true }).catch(() => {});
      } catch (error) {
        setMessage(error.message);
      } finally {
        setPendingAction("");
      }
      return;
    }

    if (!hasAdminBackendAccess()) {
      setMessage("Administrator SQL Server access is required. No local user record was created.");
      return;
    }

    try {
      setPendingAction("create");
      const payload = await apiFetch("/api/admin/users", {
        method: "POST",
        auth: true,
        body: {
          fullName: trimmedName,
          email: normalizedEmail,
          role: normalizeRoleForApi(editor.role),
          status: editor.status,
          isActive: editor.status === "Active",
          ...(editor.password?.trim()
            ? { password: editor.password }
            : {}),
        },
      });
      const nextUser = normalizeAdminManagedUser(payload.user);
      persistUsers([nextUser, ...users]);
      const initialPwd = payload.initialPassword;
      setMessage(
        initialPwd
          ? `User created in SQL Server for ${normalizedEmail}. Initial password: ${initialPwd} — share this securely and ask the user to change it on first login.`
          : `User created in SQL Server for ${normalizedEmail}.`,
      );
      setEditor(null);
      loadBackendUsers().catch(() => {});
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPendingAction("");
    }
  };

  const updateUser = async (id, patch) => {
    const prevUsers = [...users];
    const targetUser = users.find((user) => user.id === id);

    // Add timestamp to track this update
    const patchWithTimestamp = {
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    if (!targetUser?.backendId) {
      setMessage("This account is not present in SQL Server. Refresh User Management before editing it.");
      return;
    }

    if (!hasAdminBackendAccess()) {
      setMessage("Administrator SQL Server access is required. No local changes were saved.");
      return;
    }

    // Reflect table controls immediately while the database and audit log are
    // being updated. The previous snapshot is restored if the request fails.
    const optimisticUser = normalizeAdminManagedUser({
      ...targetUser,
      ...patchWithTimestamp,
    });
    persistUsers(
      prevUsers.map((user) => (user.id === id ? optimisticUser : user)),
    );

    try {
      setPendingAction(`update:${id}`);
      let payload = null;
      if (Object.prototype.hasOwnProperty.call(patch, "role")) {
        if (patch.role === "Administrator") {
          if (!window.confirm("Grant this account full Administrator access? This action is audited.")) return;
          payload = await apiFetch(`/api/admin/users/${id}/grant-admin`, {
            method: "POST", auth: true, body: { confirmation: "GRANT ADMIN" },
          });
        } else {
          payload = await apiFetch(`/api/admin/users/${id}/role`, {
            method: "PUT", auth: true, body: { role: normalizeRoleForApi(patch.role) },
          });
        }
      } else if (Object.prototype.hasOwnProperty.call(patch, "status")) {
        payload = await apiFetch(`/api/admin/users/${id}/toggle-active`, {
          method: "PUT",
          auth: true,
        });
      }
      if (payload?.user) {
        const syncedUser = normalizeAdminManagedUser({
          ...optimisticUser,
          ...payload.user,
          updatedAt: patchWithTimestamp.updatedAt,
        });
        persistUsers(
          prevUsers.map((user) => (user.id === id ? syncedUser : user)),
        );
        setMessage("✅ User updated successfully in database!");
      } else {
        // Backend confirmed but returned no user — apply patch locally
        const nextUsers = prevUsers.map((user) =>
          user.id === id
            ? normalizeAdminManagedUser({ ...user, ...patchWithTimestamp })
            : user,
        );
        persistUsers(nextUsers);
        setMessage("✅ User updated successfully!");
      }
    } catch (error) {
      // Revert to previous state on error
      persistUsers(prevUsers);
      setMessage(`❌ Update failed, changes reverted: ${error.message}`);
    } finally {
      setPendingAction("");
    }
  };


  const refreshUsers = () => {
    loadBackendUsers()
      .then(() =>
        setMessage(
          hasAdminBackendAccess()
            ? "User list refreshed from SQL Server."
            : "Administrator SQL Server access is required.",
        ),
      )
      .catch((error) => setMessage(error.message));
  };

  const downloadUsers = () => {
    const header = "Name,Email,Role,Status,Created At,Last Login";
    const csvEscape = (value) =>
      `"${String(value || "").replaceAll('"', '""')}"`;
    const body = visibleUsers
      .map((user) =>
        [
          user.name,
          user.email,
          user.role,
          user.status,
          user.createdLabel,
          user.lastLogin,
        ]
          .map(csvEscape)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`${header}\n${body}`], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scholartrend-users.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell activeRoute="/admin-user-management" current="User Management">
      <div className="admin-users-content">
        {saveConfirmation ? (
          <aside
            className={`admin-save-confirmation ${saveConfirmation.tone}`}
            role="status"
            aria-live="polite"
          >
            <div>
              <strong>{saveConfirmation.title}</strong>
              <span>{saveConfirmation.text}</span>
            </div>
            <button
              type="button"
              aria-label="Close confirmation"
              onClick={() => setSaveConfirmation(null)}
            >
              <MiniIcon path="M6 6l12 12M18 6 6 18" />
            </button>
          </aside>
        ) : null}
        <header className="admin-users-heading">
          <div>
            <p>
              Dashboard <span>/</span> <strong>User Management</strong>
            </p>
            <h1>User Management</h1>
            <small>Manage system access, roles, and user statuses</small>
          </div>
          <button
            type="button"
            className="admin-invite-button"
            onClick={openInviteUser}
          >
            <MiniIcon path="M8.8 11.4a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4ZM3.4 20a5.4 5.4 0 0 1 10.8 0M18.5 7v6M15.5 10h6" />
            Create User
          </button>
        </header>

        {message ? (
          <p className="admin-users-message" role="status">
            {message}
          </p>
        ) : null}

        <section
          className="admin-users-summary-grid"
          aria-label="User management metrics"
        >
          {summaryCards.map((item) => (
            <article className="admin-user-summary-card" key={item.label}>
              <div>
                <span>{t(item.label)}</span>
                <MiniIcon path={item.icon} />
              </div>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </article>
          ))}
          <article className="admin-user-summary-card admin-key-roles-card">
            <div>
              <span>Key Roles</span>
              <MiniIcon path="M5.5 5h13M7.5 9h9M6.5 13.2h11M8.5 17.5h7M4.5 5v13.5h15V5M9.5 13.2l1.8 1.8 3.4-4.1" />
            </div>
            {adminRoleOptions.map(
              (roleName) => (
                <React.Fragment key={roleName}>
                  <p>
                    <span>{roleName}</span>
                    <strong>{roleCounts[roleName] || 0}</strong>
                  </p>
                  <i
                    className={`admin-role-bar admin-role-bar-${roleName.toLowerCase()}`}
                    style={{
                      width: `${users.length ? Math.max(8, ((roleCounts[roleName] || 0) / users.length) * 100) : 0}%`,
                    }}
                  ></i>
                </React.Fragment>
              ),
            )}
          </article>
        </section>

        <section className="admin-users-panel">
          <div className="admin-users-toolbar">
            <label className="admin-users-search">
              <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Search name or email..."
                aria-label="Search users by name or email"
              />
            </label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-label="Filter users by role"
            >
              <option>All Roles</option>
              <option>Researcher</option>
              <option>Lecturer</option>
              <option>Student</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter users by status"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <div className="admin-users-toolbar-actions">
              <button
                type="button"
                aria-label="Download users"
                onClick={downloadUsers}
                title="Download CSV"
              >
                <MiniIcon path="M12 4v9M8.5 9.5 12 13l3.5-3.5M5.5 17.5v2h13v-2M7.5 20h9" />
              </button>
              <button
                type="button"
                aria-label="Refresh users"
                onClick={refreshUsers}
                title="Refresh"
              >
                <MiniIcon path="M19 8v5h-5M5 16v-5h5M17.2 10A5.8 5.8 0 0 0 7.1 6.7L5 9M6.8 14a5.8 5.8 0 0 0 10.1 3.3L19 15" />
              </button>
            </div>
          </div>

          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Account Timeline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((user) => (
                  <tr key={user.email}>
                    <td>
                      <span className={`admin-user-avatar ${user.avatarTone}`}>
                        {user.avatar}
                      </span>
                      <span>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </span>
                    </td>
                    <td>
                      {user.isSystemAdministrator ? (
                        <span className="admin-user-role-select">
                          System Administrator
                        </span>
                      ) : (
                        <select
                          className="admin-user-role-select"
                          value={user.role}
                          disabled={pendingAction === `update:${user.id}`}
                          onChange={(event) =>
                            updateUser(user.id, {
                              role: event.target.value,
                              searchAccuracy: 100,
                              updatedAt: new Date().toISOString(),
                            })
                          }
                          aria-label={`Change role for ${user.name}`}
                        >
                          {adminRoleOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <label
                        className={`admin-user-status-toggle ${user.status.toLowerCase()}`}
                      >
                        <input
                          type="checkbox"
                          checked={user.status === "Active"}
                          disabled={pendingAction === `update:${user.id}`}
                          onChange={(event) =>
                            updateUser(user.id, {
                              status: event.target.checked
                                ? "Active"
                                : "Inactive",
                            })
                          }
                          aria-label={`Toggle status for ${user.name}`}
                        />
                        <span aria-hidden="true"></span>
                        <strong>{user.status}</strong>
                      </label>
                    </td>
                    <td>
                      <span className="admin-user-timeline">
                        <strong>{user.lastLogin}</strong>
                        <small>Created {user.createdLabel}</small>
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-user-action edit"
                        aria-label={`Edit ${user.name}`}
                        onClick={() => openEditUser(user)}
                        disabled={Boolean(pendingAction) || user.isSystemAdministrator}
                        title={user.isSystemAdministrator ? "System administrator accounts are managed outside User Management" : "Edit account"}
                      >
                        <MiniIcon path="M4.5 19.5h4L18.2 9.8a2 2 0 0 0-2.8-2.8L5.7 16.7l-1.2 2.8ZM14.4 8l2.6 2.6M12 19.5h7.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!pagedUsers.length ? (
                  <tr>
                    <td colSpan="5" className="admin-users-empty">
                      No users on this page yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <footer className="admin-users-pagination">
            <span>
              Showing {pagedUsers.length ? (safePage - 1) * pageSize + 1 : 0} to{" "}
              {pagedUsers.length
                ? (safePage - 1) * pageSize + pagedUsers.length
                : 0}{" "}
              of {visibleUsers.length} entries
            </span>
            <div>
              <button
                type="button"
                aria-label="Previous user page"
                disabled={safePage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <MiniIcon path="M15 18l-6-6 6-6" />
              </button>
              <span className="admin-pagination-current">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                aria-label="Next user page"
                disabled={safePage === totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                <MiniIcon path="M9 18l6-6-6-6" />
              </button>
            </div>
          </footer>
        </section>

        {editor ? (
          <div
            className="admin-user-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeEditor();
            }}
          >
            <form className="admin-user-modal" onSubmit={saveEditor}>
              <button
                type="button"
                className="admin-user-modal-close"
                aria-label="Close user editor"
                onClick={closeEditor}
              >
                <MiniIcon path="M6 6l12 12M18 6 6 18" />
              </button>
              <header>
                <span>
                  {editor.mode === "edit" ? "Edit Account" : "Create User"}
                </span>
                <h2>
                  {editor.mode === "edit"
                    ? `Manage ${editor.name}`
                    : "Create a new account"}
                </h2>
                <p>
                  Admin can set role, access status, account identity, and reset
                  the password for an existing account here.
                </p>
              </header>
              <label>
                <span>Full name</span>
                <input
                  value={editor.name}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  placeholder="Dr. Jane Doe"
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={editor.email}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                  placeholder="name@university.edu"
                />
              </label>
              <label>
                <span>
                  {editor.mode === "edit" ? "Set new password" : "Password"}
                </span>
                <input
                  type="password"
                  value={editor.password || ""}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  minLength={8}
                  placeholder={
                    editor.mode === "edit"
                      ? "Leave blank to keep current password"
                      : "Optional; otherwise generated automatically"
                  }
                />
              </label>
              {editor.mode === "edit" ? (
                <section className="admin-academic-identity-review">
                  <header>
                    <span>Academic identity evidence</span>
                    <strong>
                      {editor.requestedRole && editor.requestedRole !== editor.role
                        ? `${editor.role} → ${editor.requestedRole}`
                        : `${editor.role} verification`}
                    </strong>
                  </header>
                  {editor.requestedRole && editor.requestedRole !== editor.role ? (
                    <p className="admin-role-change-notice">
                      Role change requested. Selecting Verified will change this
                      account to {editor.requestedRole}.
                    </p>
                  ) : null}
                  <dl>
                    <div>
                      <dt>Institution</dt>
                      <dd>{editor.academicIdentity?.institution || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Official email</dt>
                      <dd>{editor.academicIdentity?.institutionalEmail || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Role identifier</dt>
                      <dd>{editor.academicIdentity?.identifier || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Program / field</dt>
                      <dd>{editor.academicIdentity?.programOrField || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Department / unit</dt>
                      <dd>{editor.academicIdentity?.department || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Evidence</dt>
                      <dd>
                        {editor.academicIdentity?.evidenceUrl ? (
                          <a
                            href={editor.academicIdentity.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open verification source
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </dd>
                    </div>
                  </dl>
                  <label>
                    <span>Admin verification decision</span>
                    <select
                      value={editor.verificationStatus || "not_submitted"}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          verificationStatus: event.target.value,
                        }))
                      }
                    >
                      <option value="not_submitted">Not submitted</option>
                      <option value="pending">Pending review</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </label>
                </section>
              ) : null}
              <div className="admin-user-modal-grid">
                <label>
                  <span>Role</span>
                  {editor.isSystemAdministrator ? (
                    <input value="System Administrator" readOnly />
                  ) : (
                    <select
                      value={editor.role}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          role: event.target.value,
                        }))
                      }
                    >
                      {adminRoleOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={editor.status}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    {adminStatusOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <footer>
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={Boolean(pendingAction)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={Boolean(pendingAction)}>
                  {pendingAction
                    ? "Saving..."
                    : editor.mode === "edit"
                      ? "Save Changes"
                      : "Create User"}
                </button>
              </footer>
            </form>
          </div>
        ) : null}

      </div>
    </AdminShell>
  );
}

const normalizeAdminNotification = (notification) =>
  normalizeAdminNotificationBase(notification, getNotificationRecipientRole);

function AdminNotificationManagementPage() {
  const canUseAdminApi = hasAdminBackendAccess();
  const [notifications, setNotifications] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [roleFilter, setRoleFilter] = React.useState("All");
  const [page, setPage] = React.useState(1);
  const [message, setMessage] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);
  const [actionInProgressId, setActionInProgressId] = React.useState(null);
  const notificationFormRef = React.useRef(null);
  const [analytics, setAnalytics] = React.useState({ total: 0, delivered: 0, failed: 0, pending: 0, read: 0, readRate: 0 });
  const [previewRole, setPreviewRole] = React.useState("Student");
  const [form, setForm] = React.useState({
    type: "SYSTEM ALERT",
    title: "NOTICE:",
    text: "",
    recipientRole: "All",
    recipientEmail: "",
    route: "/student-notifications",
    scheduledAt: "",
  });

  const loadBackendNotifications = React.useCallback(async () => {
    if (!canUseAdminApi) return [];
    const payload = await apiFetch(
      "/api/admin/notifications?page=1&pageSize=200",
      { auth: true },
    );
    const items = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];
    return items.map(normalizeAdminNotification);
  }, [canUseAdminApi]);

  const loadAnalytics = React.useCallback(async () => {
    if (!canUseAdminApi) return null;
    return apiFetch("/api/admin/notifications/analytics?days=30", { auth: true });
  }, [canUseAdminApi]);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      if (canUseAdminApi) {
        try {
          const [backendNotifications, analyticsPayload] = await Promise.all([
            loadBackendNotifications(),
            loadAnalytics(),
          ]);
          if (cancelled) return;
          setNotifications(backendNotifications);
          if (analyticsPayload) setAnalytics(analyticsPayload);
          setMessage("");
          setIsLoading(false);
          return;
        } catch (error) {
          if (cancelled) return;
          setNotifications([]);
          setMessage(`Could not load backend notifications: ${error.message}`);
          setIsLoading(false);
          return;
        }
      }

      setNotifications([]);
      setMessage("Administrator backend access is required to load notifications.");
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [canUseAdminApi, loadBackendNotifications, loadAnalytics]);

  const persistNotifications = (nextNotifications) => {
    const normalizedNotifications = mergeNotificationsById(
      nextNotifications,
    ).map(normalizeAdminNotification);
    setNotifications(normalizedNotifications);
    return normalizedNotifications;
  };

  const visibleNotifications = notifications.filter(
    (notification) =>
      roleFilter === "All" ||
      notification.recipientRole === "All" ||
      notification.recipientRole === roleFilter,
  );
  const notificationPageSize = 10;
  const notificationTotalPages = Math.max(
    1,
    Math.ceil(visibleNotifications.length / notificationPageSize),
  );
  const safeNotificationPage = Math.min(page, notificationTotalPages);
  const pagedNotifications = visibleNotifications.slice(
    (safeNotificationPage - 1) * notificationPageSize,
    safeNotificationPage * notificationPageSize,
  );

  React.useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  const createNotification = async (event) => {
    event.preventDefault();
    if (!form.text.trim()) {
      setMessage("Notification content is required.");
      return;
    }

    if (!canUseAdminApi) {
      setMessage(
        "An Administrator session is required to publish notifications.",
      );
      return;
    }

    try {
      if (editingId !== null) {
        await apiFetch(`/api/admin/notifications/${editingId}`, {
          method: "PUT",
          auth: true,
          body: {
            notificationType: form.type,
            title: form.title,
            message: form.text.trim(),
            route: form.route,
          },
        });
        const refreshed = await loadBackendNotifications();
        setNotifications(refreshed);
        setEditingId(null);
        setForm((current) => ({ ...current, text: "" }));
        setMessage("Notification updated in the database.");
        return;
      }

      const broadcastBody = {
        recipientRole: form.recipientRole,
        notificationType: form.type,
        title: form.title,
        message: form.text.trim(),
        route: form.route,
        scheduledAt: vietnamScheduleToUtcIso(form.scheduledAt),
      };
      if (form.scheduledAt && !broadcastBody.scheduledAt) {
        setMessage("Please select a valid Vietnam date and time.");
        return;
      }
      if (broadcastBody.scheduledAt && new Date(broadcastBody.scheduledAt) <= new Date()) {
        setMessage("Scheduled time must be in the future according to Vietnam time (GMT+7).");
        return;
      }
      if (form.recipientEmail && form.recipientEmail.trim()) {
        broadcastBody.recipientEmail = form.recipientEmail.trim();
      }
      const payload = await apiFetch("/api/admin/notifications/broadcast", {
        method: "POST",
        auth: true,
        body: broadcastBody,
      });

      // Reload from backend to show accurate data
      const refreshed = await loadBackendNotifications();
      setNotifications(refreshed);
      setForm((current) => ({ ...current, text: "" }));
      const analyticsPayload = await loadAnalytics();
      if (analyticsPayload) setAnalytics(analyticsPayload);
      setMessage(`${payload.deliveryStatus === "pending" ? "Notification scheduled" : "Notification broadcast saved"} for ${payload.count || 0} users.`);
    } catch (error) {
      // Don't silently fall back to local — show error
      setMessage(
        `Backend broadcast failed: ${error.message}. Try again or check the backend.`,
      );
    }
  };

  const editNotification = (notification) => {
    if (!canUseAdminApi) {
      setMessage("An Administrator session is required to edit notifications.");
      return;
    }
    if (!/^\d+$/.test(String(notification.id))) {
      setMessage("Only backend notifications can be edited.");
      return;
    }
    setEditingId(notification.id);
    setForm({
      type: notification.type,
      title: notification.title,
      text: notification.text,
      recipientRole: notification.recipientRole,
      recipientEmail: notification.recipientEmail,
      route: notification.route,
      scheduledAt: notification.scheduledAt
        ? utcIsoToVietnamSchedule(notification.scheduledAt)
        : "",
    });
    setMessage(
      "Editing an existing notification. Recipient cannot be changed.",
    );
    window.requestAnimationFrame(() => {
      notificationFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      notificationFormRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
    });
  };

  const markNotificationRead = async (notification) => {
    if (!canUseAdminApi || !/^\d+$/.test(String(notification.id))) {
      setMessage("This notification is not available in the Admin API.");
      return;
    }
    setActionInProgressId(`read-${notification.id}`);
    try {
      await apiFetch(`/api/admin/notifications/${notification.id}/read`, {
        method: "PUT",
        auth: true,
      });
      setNotifications((current) =>
        current.map((item) =>
          String(item.id) === String(notification.id)
            ? { ...item, unread: false }
            : item,
        ),
      );
      setMessage("Notification marked as read.");
    } catch (error) {
      setMessage(`Could not update notification: ${error.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const deleteNotification = async (id) => {
    if (!canUseAdminApi || !/^\d+$/.test(String(id))) {
      setMessage(
        "Only notifications stored in the backend can be deleted here.",
      );
      return;
    }
    setActionInProgressId(`delete-${id}`);
    try {
      await apiFetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        auth: true,
      });
      setNotifications((current) =>
        current.filter((item) => String(item.id) !== String(id)),
      );
      setMessage("Notification deleted from the database.");
    } catch (error) {
      setMessage(`Could not delete notification: ${error.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const markAllRead = async () => {
    if (!canUseAdminApi) {
      setMessage("An Administrator session is required.");
      return;
    }
    try {
      await apiFetch(
        `/api/admin/notifications/read-all?role=${encodeURIComponent(roleFilter)}`,
        { method: "PUT", auth: true },
      );
      const refreshed = await loadBackendNotifications();
      setNotifications(refreshed);
      setMessage(
        "All matching notifications were marked as read in the database.",
      );
    } catch (error) {
      setMessage(`Could not mark notifications as read: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <AdminShell
        activeRoute="/admin-notifications"
        current="Notification Management"
      >
        <div className="admin-users-content admin-notifications-content">
          <p className="admin-users-message">Loading notifications...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      activeRoute="/admin-notifications"
      current="Notification Management"
    >
      <div className="admin-users-content admin-notifications-content">
        <header className="admin-users-heading">
          <div>
            <p>
              Dashboard <span>/</span> <strong>Notification Management</strong>
            </p>
            <h1>Notification Management</h1>
            <small>Publish announcements and manage user-facing alerts</small>
          </div>
        </header>

        {message ? (
          <p className="admin-users-message" role="status">
            {message}
          </p>
        ) : null}
        {!canUseAdminApi ? (
          <p className="admin-users-message" role="status">
            Admin backend access required to broadcast notifications to users.
          </p>
        ) : null}

        <section className="admin-users-summary-grid admin-notification-summary-grid">
          {[
            ["Total Notifications", analytics.total, "Created in the last 30 days"],
            [
              "Delivered / Read",
              analytics.delivered,
              `${analytics.read || 0} read (${analytics.readRate || 0}%)`,
            ],
            [
              "Pending / Failed",
              `${analytics.pending || 0} / ${analytics.failed || 0}`,
              "Scheduled or requiring attention",
            ],
          ].map(([label, value, note]) => (
            <article className="admin-user-summary-card" key={label}>
              <div>
                <span>{label}</span>
                <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
              </div>
              <strong>
                {typeof value === "number" ? formatCount(value) : value}
              </strong>
              <p>{note}</p>
            </article>
          ))}
        </section>

        <div className="admin-notification-layout">
          <form
            ref={notificationFormRef}
            className="admin-notification-form"
            onSubmit={createNotification}
          >
            <h2>
              {editingId !== null ? "Edit Notification" : "Create Notification"}
            </h2>
            <label>
              <span>Target role</span>
              <select
                value={form.recipientRole}
                disabled={editingId !== null}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recipientRole: event.target.value,
                    route: getNotificationRouteForRole(event.target.value),
                  }))
                }
              >
                <option>All</option>
                <option>Student</option>
                <option>Lecturer</option>
                <option>Researcher</option>
              </select>
            </label>
            <label>
              <span>Target email (optional, exact account)</span>
              <input
                value={form.recipientEmail}
                disabled={editingId !== null}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recipientEmail: event.target.value,
                  }))
                }
                placeholder="student@example.com"
              />
            </label>
            <label>
              <span>Type</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
              >
                <option>SYSTEM ALERT</option>
                <option>PUBLICATION NOTICE</option>
              </select>
            </label>
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Route</span>
              <input
                value={form.route}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    route: event.target.value,
                  }))
                }
                placeholder="/student-notifications"
              />
            </label>
            <label>
              <span>Content</span>
              <textarea
                rows={5}
                value={form.text}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
                placeholder="Write an announcement for users..."
              />
            </label>
            <VietnamScheduleField
              value={form.scheduledAt}
              disabled={editingId !== null}
              onChange={(scheduledAt) => setForm((current) => ({ ...current, scheduledAt }))}
            />
            <React.Suspense fallback={<p>Loading preview…</p>}>
              <AdminNotificationPreview form={form} role={previewRole} onRoleChange={setPreviewRole} />
            </React.Suspense>
            <button type="submit">
              {editingId !== null
                ? "Save Notification"
                : "Publish Notification"}
            </button>
            {editingId !== null ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm((current) => ({ ...current, text: "" }));
                  setMessage("");
                }}
              >
                Cancel Editing
              </button>
            ) : null}
          </form>

          <section className="admin-users-panel admin-notification-panel">
            <div className="admin-users-toolbar">
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option>All</option>
                <option>Student</option>
                <option>Lecturer</option>
                <option>Researcher</option>
              </select>
              <button type="button" onClick={markAllRead}>
                Mark All Read
              </button>
            </div>

            <div className="admin-notification-list">
              {pagedNotifications.map((notification) => (
                <article
                  className={`admin-notification-row ${notification.unread ? "unread" : ""}`}
                  key={notification.id}
                >
                  <div>
                    <span>{notification.type}</span>
                    <h3>
                      {notification.title} {notification.text}
                    </h3>
                    <p>
                      Target:{" "}
                      {notification.recipientEmail ||
                        notification.recipientRole}{" "}
                      | {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    <small>
                      Status: {notification.deliveryStatus}
                      {notification.scheduledAt ? ` · scheduled ${formatVietnamDateTime(notification.scheduledAt)} (GMT+7)` : ""}
                      {notification.failureReason ? ` · ${notification.failureReason}` : ""}
                    </small>
                  </div>
                  <div className="admin-notification-row-actions" aria-label="Notification actions">
                    {notification.unread ? (
                      <button
                        type="button"
                        className="admin-user-action edit"
                        onClick={() => markNotificationRead(notification)}
                        title="Mark notification as read"
                        aria-label="Mark notification as read"
                        disabled={actionInProgressId === `read-${notification.id}`}
                      >
                        <MiniIcon path="M5 12.5 9.5 17 19 7.5" />
                        <span className="admin-notification-action-label">Read</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="admin-user-action edit"
                      onClick={() => editNotification(notification)}
                      title="Edit notification"
                      aria-label="Edit notification"
                    >
                      <MiniIcon path="M4 20h4l10.8-10.8-4-4L4 16v4ZM13.8 6.2l4 4" />
                      <span className="admin-notification-action-label">Edit</span>
                    </button>
                    <button
                      type="button"
                      className="admin-user-action delete"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                      aria-label="Delete notification"
                      disabled={actionInProgressId === `delete-${notification.id}`}
                    >
                      <MiniIcon path="M5 7h14M10 10.5v6M14 10.5v6M8.5 7l1-3h5l1 3M7.2 7l.8 13h8l.8-13" />
                      <span className="admin-notification-action-label">Delete</span>
                    </button>
                  </div>
                </article>
              ))}
              {!visibleNotifications.length ? (
                <p className="admin-users-empty">No notifications found.</p>
              ) : null}
            </div>
            <footer className="admin-users-pagination">
              <span>{visibleNotifications.length} notifications</span>
              <div>
                <button
                  type="button"
                  disabled={safeNotificationPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {safeNotificationPage} of {notificationTotalPages}
                </span>
                <button
                  type="button"
                  disabled={safeNotificationPage === notificationTotalPages}
                  onClick={() =>
                    setPage((value) =>
                      Math.min(notificationTotalPages, value + 1),
                    )
                  }
                >
                  Next
                </button>
              </div>
            </footer>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

const ADMIN_SYSTEM_LOGS_KEY = "scholartrend.adminSystemLogs";

const setAdminSystemLogs = (logs) => {
  window.localStorage.setItem(ADMIN_SYSTEM_LOGS_KEY, JSON.stringify(logs));
};

function AdminSystemLogsPage() {
  const { t } = useTranslation();
  const canUseAdminApi = hasAdminBackendAccess();
  const [query, setQuery] = React.useState("");
  const [severity, setSeverity] = React.useState("All Severities");
  const [module, setModule] = React.useState("All Modules");
  const [correlationId, setCorrelationId] = React.useState("");
  const [ipAddress, setIpAddress] = React.useState("");
  const [userIdFilter, setUserIdFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [logs, setLogs] = React.useState([]);
  const [logMessage, setLogMessage] = React.useState("");
  const [refreshVersion, setRefreshVersion] = React.useState(0);
  const pageSize = 5;
  const backendLogUrl = React.useMemo(() => {
    if (!canUseAdminApi) return null;
    const params = new URLSearchParams({ limit: "100", refresh: String(refreshVersion) });
    if (query.trim()) params.set("search", query.trim());
    if (severity !== "All Severities") params.set("severity", severity);
    if (module !== "All Modules") params.set("module", module);
    if (correlationId.trim()) params.set("correlationId", correlationId.trim());
    if (ipAddress.trim()) params.set("ip", ipAddress.trim());
    if (/^\d+$/.test(userIdFilter.trim())) params.set("userId", userIdFilter.trim());
    return `/api/admin/system-logs?${params.toString()}`;
  }, [canUseAdminApi, correlationId, ipAddress, module, query, refreshVersion, severity, userIdFilter]);
  const { data: backendLogs, status: backendLogStatus } = useApiResource(
    backendLogUrl,
    [],
    {
      auth: true,
      select: (payload) => {
        const mapped = unwrapList(payload).map(mapAdminLogForUi);
        return mapped;
      },
    },
  );
  const { data: backendHealth } = useApiResource(
    canUseAdminApi ? `/api/admin/health?refresh=${refreshVersion}` : null,
    null,
    { auth: true },
  );

  React.useEffect(() => {
    if (backendLogStatus === "success" && Array.isArray(backendLogs)) {
      setLogs(backendLogs);
    }
  }, [backendLogStatus, backendLogs]);

  React.useEffect(() => {
    setPage(1);
  }, [query, severity, module, correlationId, ipAddress, userIdFilter]);

  const persistLogs = (nextLogs) => {
    setLogs(nextLogs);
    setAdminSystemLogs(nextLogs);
  };

  const visibleLogs = logs.filter((log) => {
    const matchesQuery = `${log.event} ${log.detail} ${log.actor} ${log.code} ${log.correlationId} ${log.ipAddress} ${log.path}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesSeverity =
      severity === "All Severities" || log.severity === severity;
    const matchesModule = module === "All Modules" || log.module === module;
    return matchesQuery && matchesSeverity && matchesModule;
  });
  const moduleOptions = Array.from(
    new Set(logs.map((log) => log.module).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const visibleWarningCount = visibleLogs.filter(
    (log) => log.severity === "Warning",
  ).length;
  const visibleErrorCount = visibleLogs.filter(
    (log) => log.severity === "Error",
  ).length;
  const warningCount = logs.filter((log) => log.severity === "Warning").length;
  const errorCount = logs.filter((log) => log.severity === "Error").length;
  const visiblePassRate =
    visibleLogs.length === 0
      ? 100
      : Math.round(
          ((visibleLogs.length - visibleErrorCount) / visibleLogs.length) *
            1000,
        ) / 10;
  const getLogSearchText = (log) =>
    `${log.event} ${log.detail} ${log.module} ${log.actor} ${log.code}`.toLowerCase();
  const getLogRoute = (log) => {
    const text = getLogSearchText(log);
    if (/user|auth|login|role|account/.test(text))
      return "/admin-user-management";
    if (/sync|semantic scholar|openalex|worker/.test(text)) {
      return "/admin-sync-management";
    }
    if (/publication|paper|similarity|submission|index|search/.test(text)) {
      return "/admin-publications";
    }
    if (/notification|alert/.test(text)) return "/admin-notifications";
    return "/admin-system-logs";
  };
  // The alert panel represents current service health. Historical warning/error
  // audit entries remain searchable in the table, but they are not active alerts.
  const alertLogs = Array.isArray(backendHealth?.services)
    ? backendHealth.services
        .filter((service) => service.operational === false)
        .map((service) => ({
          event: service.name,
          detail: service.value || "Service health check failed.",
          module: "Live Health",
          severity: "Error",
          actor: "health-check@system",
          code: "SERVICE-CRITICAL",
          time: backendHealth.checkedAt || new Date().toISOString(),
        }))
    : [];
  const activeAlert = alertLogs[0] || null;
  const getHealthState = (pattern) => {
    const relatedLogs = logs.filter((log) =>
      pattern.test(getLogSearchText(log)),
    );
    if (relatedLogs.some((log) => log.severity === "Error")) return "Critical";
    if (relatedLogs.some((log) => log.severity === "Warning"))
      return "Degraded";
    return "Operational";
  };
  const healthRows = Array.isArray(backendHealth?.services)
    ? backendHealth.services.map((service) => ({
        label: service.name,
        query: service.name,
        state: service.state || "Unknown",
      }))
    : [];
  const totalPages = Math.max(1, Math.ceil(visibleLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedLogs = visibleLogs.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const summaryCards = [
    {
      label: "Total Events",
      value: formatCount(visibleLogs.length),
      note: `${formatCount(logs.length)} total stored events`,
      tone: "info",
      icon: "M6 5h12v14H6zM9 8h6M9 12h6M9 16h4",
      action: () => {
        setQuery("");
        setSeverity("All Severities");
        setModule("All Modules");
        setLogMessage("Showing all system logs.");
      },
    },
    {
      label: "Warnings",
      value: formatCount(visibleWarningCount),
      note: `${formatCount(warningCount)} total unresolved`,
      tone: "warning",
      icon: "M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01",
      action: () => {
        setQuery("");
        setSeverity("Warning");
        setModule("All Modules");
        setLogMessage("Showing warning logs.");
      },
    },
    {
      label: "Errors",
      value: formatCount(visibleErrorCount),
      note: `${formatCount(errorCount)} total critical`,
      tone: "danger",
      icon: "M8.2 3.8h7.6l4.4 4.4v7.6l-4.4 4.4H8.2l-4.4-4.4V8.2l4.4-4.4ZM9 9l6 6M15 9l-6 6",
      action: () => {
        setQuery("");
        setSeverity("Error");
        setModule("All Modules");
        setLogMessage("Showing critical error logs.");
      },
    },
    {
      label: "Audit Pass Rate",
      value: `${visiblePassRate}%`,
      note: "Current filter pass rate",
      tone: "success",
      icon: "M12 3.5 19 6.4v5.4c0 4.2-2.8 7.3-7 8.7-4.2-1.4-7-4.5-7-8.7V6.4l7-2.9ZM8.7 12.2l2.2 2.2 4.6-5",
      action: () => {
        setSeverity("All Severities");
        setLogMessage("Audit pass rate recalculated for current filters.");
      },
    },
  ];

  const refreshLogs = () => {
    setRefreshVersion((value) => value + 1);
    setLogMessage(
      "Refreshing system logs and service health from the backend...",
    );
  };

  const filterHealth = (nextQuery = "") => {
    setModule("All Modules");
    setSeverity("All Severities");
    setQuery(nextQuery);
    setLogMessage(`Filtered logs for ${nextQuery}.`);
  };

  const viewAllLogs = () => {
    setQuery("");
    setSeverity("All Severities");
    setModule("All Modules");
    setLogMessage("Showing all system logs.");
  };

  const viewAlertLog = (alert = activeAlert) => {
    if (!alert) {
      viewAllLogs();
      return;
    }
    setQuery(alert.code);
    setSeverity("All Severities");
    setModule("All Modules");
    setLogMessage(`Showing alert ${alert.code} from ${alert.module}.`);
  };

  const openAlertModule = (alert = activeAlert) => {
    if (!alert) {
      viewAllLogs();
      return;
    }
    goToRoute(getLogRoute(alert));
  };

  const reviewCritical = () => {
    if (!alertLogs.length) {
      setQuery("");
      setSeverity("All Severities");
      setModule("All Modules");
      setLogMessage("No warning or critical logs found.");
      return;
    }
    viewAlertLog(alertLogs[0]);
  };

  const exportLogs = () => {
    downloadCsvFile("scholartrend-system-logs.csv", [
      ["Time", "Severity", "Module", "Event", "Actor", "Code"],
      ...visibleLogs.map((log) => [
        log.time,
        log.severity,
        log.module,
        log.event,
        log.actor,
        log.code,
      ]),
    ]);
  };

  return (
    <AdminShell activeRoute="/admin-system-logs" current="System Logs">
      <div className="admin-logs-content">
        <header className="admin-logs-heading">
          <div>
            <p>
              Dashboard <span>/</span> <strong>System Logs</strong>
            </p>
            <h1>System Logs</h1>
            <small>
              Monitor sync events, access activity, and platform alerts
            </small>
          </div>
          <button
            type="button"
            className="admin-log-export-button"
            onClick={exportLogs}
          >
            <span className="admin-log-export-icon">
              <MiniIcon path="M12 4v9M8.5 9.5 12 13l3.5-3.5M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16M7.5 16h9" />
            </span>
            <span className="admin-log-export-label">Download Logs</span>
          </button>
        </header>

        <section
          className="admin-logs-summary-grid"
          aria-label="System log metrics"
        >
          {summaryCards.map((item) => (
            <button
              type="button"
              className={`admin-log-summary-card ${item.tone}`}
              onClick={item.action}
              key={item.label}
            >
              <div>
                <span>{t(item.label)}</span>
                <MiniIcon path={item.icon} />
              </div>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </button>
          ))}
        </section>

        <div className="admin-logs-layout">
          <section className="admin-logs-panel">
            <div className="admin-logs-toolbar">
              <label className="admin-logs-search">
                <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Search event, actor, or code..."
                  aria-label="Search system logs"
                />
              </label>
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                aria-label="Filter logs by severity"
              >
                <option>All Severities</option>
                <option>Info</option>
                <option>Success</option>
                <option>Warning</option>
                <option>Error</option>
              </select>
              <input
                value={correlationId}
                onChange={(event) => setCorrelationId(event.target.value)}
                placeholder="Correlation ID"
                aria-label="Filter logs by correlation ID"
              />
              <input
                value={ipAddress}
                onChange={(event) => setIpAddress(event.target.value)}
                placeholder="IP address"
                aria-label="Filter logs by IP address"
              />
              <input
                value={userIdFilter}
                onChange={(event) => setUserIdFilter(event.target.value.replace(/\D/g, ""))}
                placeholder="User ID"
                inputMode="numeric"
                aria-label="Filter logs by user ID"
              />
              <select
                value={module}
                onChange={(event) => setModule(event.target.value)}
                aria-label="Filter logs by module"
              >
                <option>All Modules</option>
                {moduleOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Refresh logs"
                onClick={refreshLogs}
              >
                <MiniIcon path="M20 12a8 8 0 1 1-2.34-5.66M20 5v5h-5" />
              </button>
            </div>
            {logMessage ? (
              <p className="admin-logs-message">{logMessage}</p>
            ) : null}
            {!canUseAdminApi ? (
              <p className="admin-logs-message">
                Administrator backend access is required. System logs are unavailable.
              </p>
            ) : null}

            <div className="admin-logs-table-wrap">
              <table className="admin-logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event</th>
                    <th>Module</th>
                    <th>Severity</th>
                    <th>Actor</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLogs.map((log, index) => (
                    <tr key={log.id || `${log.code}-${log.time}-${index}`}>
                      <td>{log.time}</td>
                      <td>
                        <strong>{log.event}</strong>
                        <small>{log.detail}</small>
                      </td>
                      <td>
                        <span className="admin-log-module">{log.module}</span>
                      </td>
                      <td>
                        <span
                          className={`admin-log-severity ${log.severity.toLowerCase()}`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td>{log.actor}</td>
                      <td>
                        <code>{log.code}</code>
                      </td>
                    </tr>
                  ))}
                  {!pagedLogs.length ? (
                    <tr>
                      <td colSpan="6" className="admin-logs-empty">
                        No logs match the current filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <footer className="admin-logs-pagination">
              <span>
                Showing {pagedLogs.length ? (safePage - 1) * pageSize + 1 : 0}{" "}
                to {(safePage - 1) * pageSize + pagedLogs.length} of{" "}
                {visibleLogs.length} events
              </span>
              <div>
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <MiniIcon path="M15 18l-6-6 6-6" />
                </button>
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((number) => (
                  <button
                    type="button"
                    className={safePage === number ? "active" : ""}
                    onClick={() => setPage(number)}
                    key={number}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                >
                  <MiniIcon path="M9 18l6-6-6-6" />
                </button>
              </div>
            </footer>
          </section>

          <aside className="admin-logs-inspector">
            <section>
              <h2>Live Health</h2>
              {healthRows.map((row) => (
                <button
                  type="button"
                  className={`admin-health-filter ${row.state.toLowerCase()}`}
                  onClick={() => filterHealth(row.query)}
                  key={row.label}
                >
                  <span>{row.label}</span>
                  <strong>{row.state}</strong>
                </button>
              ))}
            </section>
            <section
              className={`admin-log-alert-card ${
                alertLogs.length
                  ? errorCount
                    ? "critical"
                    : "warning"
                  : "clear"
              }`}
            >
              <MiniIcon path="M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01" />
              <div>
                <h2>
                  {alertLogs.length ? "Attention Needed" : "No Active Alerts"}
                </h2>
                <p>
                  {activeAlert
                    ? `${alertLogs.length} alert${alertLogs.length === 1 ? "" : "s"} need admin review.`
                    : "All visible system checks are currently passing."}
                </p>
                {alertLogs.length ? (
                  <div className="admin-log-alert-list">
                    {alertLogs.map((alert) => (
                      <article
                        className={`admin-log-alert-item ${alert.severity.toLowerCase()}`}
                        key={`${alert.code}-${alert.time}`}
                      >
                        <button
                          type="button"
                          onClick={() => viewAlertLog(alert)}
                        >
                          <strong>{alert.event}</strong>
                          <span>
                            {alert.module} / {alert.code}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => openAlertModule(alert)}
                        >
                          Open
                        </button>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}


function AdminReviewManagementPage() {
  const [reviews, setReviews] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [selectedReview, setSelectedReview] = React.useState(null);
  const loadReviews = React.useCallback(async () => {
    try {
      const query = category ? `?reportCategory=${encodeURIComponent(category)}` : "";
      const payload = await apiFetch(`/api/publication-reviews/admin/all${query}`, { auth: true });
      setReviews(payload.items || []);
    } catch (error) {
      setMessage(error.message);
    }
  }, [category]);
  React.useEffect(() => { loadReviews(); }, [loadReviews]);

  const moderate = async (review, action) => {
    const requests = {
      hide: [`/api/publication-reviews/admin/${review.id}/hide`, "POST", null],
      restore: [`/api/publication-reviews/admin/${review.id}/restore`, "POST", null],
      resolve: [`/api/publication-reviews/admin/${review.id}/resolve-reports`, "POST", { resolution: "Resolved by Administrator" }],
      restrict: [`/api/publication-reviews/admin/users/${review.reviewerUserId}/restrict`, "POST", { days: 7 }],
    };
    const [path, method, body] = requests[action];
    try {
      await apiFetch(path, { method, auth: true, body });
      setMessage("Moderation action completed.");
      await loadReviews();
    } catch (error) { setMessage(error.message); }
  };

  const reviewSourceUrl = (review) => {
    if (review.publicationUrl) return review.publicationUrl;
    if (review.publicationDoi) {
      const doi = String(review.publicationDoi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
      return `https://doi.org/${doi}`;
    }
    if (review.publicationTitle) {
      return `https://scholar.google.com/scholar?q=${encodeURIComponent(review.publicationTitle)}`;
    }
    return "";
  };

  const hasDirectReviewSource = (review) => Boolean(review.publicationUrl || review.publicationDoi);

  const visibleCount = reviews.filter((review) => !review.isHidden).length;
  const reportedCount = reviews.filter((review) => (review.reportCount || 0) > 0 && review.moderationStatus !== "resolved").length;
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + Number(review.credibilityRating || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <AdminShell activeRoute="/admin-reviews" current="Review Management">
      <div className="admin-users-content admin-review-page">
        <header className="admin-review-heading">
          <div><span>Trust &amp; safety</span><h1>Review Management</h1><p>Inspect academic feedback, resolve reports, and protect publication quality.</p></div>
          <label className="admin-review-category"><span>Violation category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="misinformation">Misinformation</option><option value="conflict_of_interest">Conflict of interest</option><option value="off_topic">Off-topic</option><option value="plagiarism">Plagiarism</option><option value="other">Other</option>
          </select></label>
        </header>

        <section className="admin-review-metrics" aria-label="Review summary">
          <article><span>Total reviews</span><strong>{reviews.length}</strong><small>In the current view</small></article>
          <article><span>Visible</span><strong>{visibleCount}</strong><small>Available to readers</small></article>
          <article className={reportedCount ? "attention" : ""}><span>Needs attention</span><strong>{reportedCount}</strong><small>Unresolved reports</small></article>
          <article><span>Average rating</span><strong>{averageRating}<em>/5</em></strong><small>Credibility score</small></article>
        </section>

        {message ? <p className="admin-review-notice" role="status">{message}</p> : null}
        <section className="admin-review-list" aria-label="Publication reviews">
          <header><div><strong>All reviews</strong><span>{reviews.length} results</span></div><small>Newest activity first</small></header>
          {reviews.length ? reviews.map((review) => {
            const status = review.moderationStatus || (review.isHidden ? "hidden" : "visible");
            const sourceUrl = reviewSourceUrl(review);
            return <article className={`admin-review-row ${review.isHidden ? "is-hidden" : ""}`} key={review.id}>
              <div className="admin-review-score" aria-label={`${review.credibilityRating} out of 5`}><strong>{review.credibilityRating}</strong><span>/ 5</span><small>rating</small></div>
              <div className="admin-review-copy">
                <div className="admin-review-meta"><span className={`admin-review-status ${status}`}>{status}</span>{review.reportCount ? <span className="admin-review-report-count">{review.reportCount} report{review.reportCount > 1 ? "s" : ""}</span> : null}<time>{review.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : ""}</time></div>
                <button type="button" className="admin-review-title" onClick={() => setSelectedReview(review)}>{review.publicationTitle}</button>
                <p>{review.comment}</p>
                <div className="admin-review-byline"><span className="admin-review-avatar">{String(review.reviewerName || "U").slice(0, 1).toUpperCase()}</span><span><strong>{review.reviewerName}</strong><small>{review.reviewerRole} · {review.reviewerEmail}</small></span></div>
              </div>
              <div className="admin-review-actions">
                <button type="button" className="review-action-primary" onClick={() => setSelectedReview(review)}>View details</button>
                {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer">{hasDirectReviewSource(review) ? "Open source ↗" : "Find publication ↗"}</a> : <span className="source-unavailable">Source unavailable</span>}
                <div><button type="button" onClick={() => moderate(review, review.isHidden ? "restore" : "hide")}>{review.isHidden ? "Restore" : "Hide"}</button>{review.reportCount && status !== "resolved" ? <button type="button" onClick={() => moderate(review, "resolve")}>Resolve</button> : null}<button type="button" className="danger" onClick={() => moderate(review, "restrict")}>Restrict</button></div>
              </div>
            </article>;
          }) : <div className="admin-review-empty"><strong>No reviews found</strong><p>There are no reviews matching this violation category.</p></div>}
        </section>

        {selectedReview ? <div className="admin-review-paper-modal" role="dialog" aria-modal="true" aria-labelledby="review-paper-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReview(null); }}><section>
          <header><div><span>Reviewed publication</span><h2 id="review-paper-title">{selectedReview.publicationTitle}</h2></div><button type="button" aria-label="Close" onClick={() => setSelectedReview(null)}>×</button></header>
          <div className="admin-reviewed-paper-meta">{selectedReview.publicationSource ? <span>{selectedReview.publicationSource}</span> : null}{selectedReview.publicationYear ? <span>{selectedReview.publicationYear}</span> : null}{selectedReview.publicationAuthors ? <span>{selectedReview.publicationAuthors}</span> : null}</div>
          <section className="admin-reviewed-paper-abstract"><h3>Abstract</h3><p>{selectedReview.publicationAbstract || "No abstract was stored with this review."}</p></section>
          <div className="admin-reviewed-paper-links">{reviewSourceUrl(selectedReview) ? <a href={reviewSourceUrl(selectedReview)} target="_blank" rel="noreferrer">{hasDirectReviewSource(selectedReview) ? "Open original publication ↗" : "Find publication on Google Scholar ↗"}</a> : null}{selectedReview.publicationDoi ? <a href={`https://doi.org/${String(selectedReview.publicationDoi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`} target="_blank" rel="noreferrer">View DOI ↗</a> : null}</div>
          <section className="admin-review-detail"><header><div><span className="admin-review-avatar">{String(selectedReview.reviewerName || "U").slice(0, 1).toUpperCase()}</span><span><strong>{selectedReview.reviewerName}</strong><small>{selectedReview.reviewerEmail}</small></span></div><strong>{selectedReview.credibilityRating}/5</strong></header><p>{selectedReview.comment}</p></section>
        </section></div> : null}
      </div>
    </AdminShell>
  );
}

function AdminSectionPage({ activeRoute, title }) {
  return (
    <AdminShell activeRoute={activeRoute} current={title}>
      <div className="admin-placeholder-content">
        <span>Administrator</span>
        <h1>{title}</h1>
        <p>This Admin module is ready for its detailed workflow.</p>
      </div>
    </AdminShell>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    appendClientSystemLog({
      event: "React render error",
      detail:
        `${error?.message || "Unknown render error"} ${info?.componentStack || ""}`.slice(
          0,
          400,
        ),
      module: getClientLogModule(window.location.pathname),
      severity: "Error",
      actor: "browser@client",
      code: getClientLogCode("System", "REACT"),
    });
  }

  render() {
    if (this.state.error) {
      return (
        <main className="student-app">
          <section className="student-main">
            <div className="student-content">
              <section className="search-results-area">
                <h1>Something went wrong</h1>
                <p>{this.state.error.message}</p>
                <button
                  type="button"
                  className="new-project"
                  onClick={() => {
                    this.setState({ error: null });
                    goToRoute("/");
                  }}
                >
                  Return Home
                </button>
              </section>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

function AcademicVerificationReminder() {
  const [, refresh] = React.useReducer((value) => value + 1, 0);
  const path = window.location.pathname;
  const session = getStoredSession();
  const role = normalizeRoleForUi(session.role || getStoredAuthRole());
  const status =
    session.verificationStatus ||
    session.academicIdentity?.verificationStatus ||
    "not_submitted";
  const requestedRole =
    session.requestedRole || session.academicIdentity?.requestedRole || "";
  const hasAuthenticatedSession = Boolean(getStoredAuth().accessToken);
  const isAcademicWorkspace =
    path.startsWith("/student-") ||
    path.startsWith("/lecturer-") ||
    path.startsWith("/researcher-");
  const isProfile = path.endsWith("-profile");
  const rolePrefix = String(role || "Student").toLowerCase();
  const profilePath = `/${rolePrefix}-profile?tab=academic-identity`;

  React.useEffect(() => {
    window.addEventListener("scholartrend:navigate", refresh);
    window.addEventListener("scholartrend:session-updated", refresh);
    window.addEventListener("popstate", refresh);
    return () => {
      window.removeEventListener("scholartrend:navigate", refresh);
      window.removeEventListener("scholartrend:session-updated", refresh);
      window.removeEventListener("popstate", refresh);
    };
  }, []);

  if (
    !hasAuthenticatedSession ||
    !isAcademicWorkspace ||
    isProfile ||
    role === "Administrator" ||
    status === "verified"
  ) {
    return null;
  }

  return (
    <aside className={`verification-reminder ${status}`} role="status">
      <div>
        <strong>
          {status === "pending"
            ? `${role} verification is pending`
            : status === "rejected"
              ? `${role} verification needs changes`
              : `You are previewing the ${role} workspace`}
        </strong>
        <span>
          {status === "pending"
            ? requestedRole
              ? `Your request to change to ${requestedRole} is pending. You can continue using your current ${role} workspace.`
              : "You can preview the Dashboard while Admin reviews your Academic Identity."
            : status === "rejected"
              ? "Update your Academic Identity to restore access to role features."
              : "Only Dashboard preview is available. Complete Academic Identity to unlock role features."}
        </span>
      </div>
      <a href={profilePath} onClick={navTo(profilePath)}>
        {status === "pending" ? "View verification" : "Verify identity"}
      </a>
    </aside>
  );
}

function AcademicFeatureLocked({ role, status }) {
  const rolePrefix = String(role || "Student").toLowerCase();
  const profilePath = `/${rolePrefix}-profile?tab=academic-identity`;
  const dashboardPath = `/${rolePrefix}-dashboard`;
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  return (
    <main className="verification-gate">
      <section className="verification-gate-card" aria-labelledby="gate-title">
        <span className="verification-gate-icon" aria-hidden="true">
          <MiniIcon path="M12 3 4.5 6v5.6c0 4.7 3.2 8.1 7.5 9.4 4.3-1.3 7.5-4.7 7.5-9.4V6L12 3Zm0 5v5m0 3h.01" />
        </span>
        <p className="verification-gate-eyebrow">
          {role} workspace access
        </p>
        <h1 id="gate-title">
          {isPending
            ? "Waiting for Admin verification"
            : isRejected
              ? "Your identity information needs changes"
              : "Complete your Academic Identity first"}
        </h1>
        <p>
          {isPending
            ? "Your information has been submitted. Until Admin verifies it, you can only preview the Dashboard and manage your Profile."
            : isRejected
              ? "Admin could not verify the submitted information. Update the requested details and submit them again."
              : "Search, publication details, trends, reports, year comparison, sync, Bookmarks, and Notifications are locked until Admin verifies your role."}
        </p>
        <div className="verification-gate-actions">
          <a
            className="verification-gate-primary"
            href={profilePath}
            onClick={navTo(profilePath)}
          >
            {isPending ? "View submitted information" : "Update Academic Identity"}
          </a>
          <a
            className="verification-gate-secondary"
            href={dashboardPath}
            onClick={navTo(dashboardPath)}
          >
            Back to Dashboard
          </a>
        </div>
        <small>
          Full role access is enabled only after Admin changes the verification
          status to Verified.
        </small>
      </section>
    </main>
  );
}

function AppRoutes() {
  const [, forceRender] = React.useReducer((value) => value + 1, 0);
  const path = window.location.pathname;
  const [adminSessionRecovery, setAdminSessionRecovery] = React.useState("idle");
  const sessionRole = normalizeRoleForUi(
    getStoredSession().role || getStoredAuthRole(),
  );
  const currentSession = getStoredSession();
  const verificationStatus =
    currentSession.verificationStatus ||
    currentSession.academicIdentity?.verificationStatus ||
    "not_submitted";
  const requestedRole =
    currentSession.requestedRole ||
    currentSession.academicIdentity?.requestedRole ||
    "";
  const nonAdminRolePrefix =
    sessionRole === "Lecturer"
      ? "lecturer"
      : sessionRole === "Researcher"
        ? "researcher"
        : sessionRole === "Student"
          ? "student"
          : "";
  const isKnownNonAdminSession = Boolean(nonAdminRolePrefix);

  React.useEffect(() => {
    if (!path.startsWith("/admin-") || !isKnownNonAdminSession) return;
    const safeRoute = getSafeRecipientRoute(path, nonAdminRolePrefix);
    window.history.replaceState({}, "", safeRoute);
    window.dispatchEvent(new Event("scholartrend:navigate"));
  }, [path, isKnownNonAdminSession, nonAdminRolePrefix]);

  React.useEffect(() => {
    if (
      !isKnownNonAdminSession ||
      path.endsWith("-profile")
    ) {
      return;
    }
    if (!getStoredAuth().accessToken) return;
    const profileRequest = apiFetch("/api/auth/profile", { auth: true });
    profileRequest
      .then((profile) => {
        const nextStatus = profile.verificationStatus || "not_submitted";
        const nextRole = normalizeRoleForUi(profile.role || sessionRole);
        if (nextStatus === verificationStatus && nextRole === sessionRole) return;
        persistSession({
          ...getStoredSession(),
          role: nextRole,
          verificationStatus: nextStatus,
          requestedRole: profile.requestedRole || "",
          academicIdentity: {
            ...(getStoredSession().academicIdentity || {}),
            ...(profile.academicIdentity || {}),
            verificationStatus: nextStatus,
            requestedRole: profile.requestedRole || "",
          },
        });
        if (nextRole !== sessionRole) {
          window.history.replaceState(
            {},
            "",
            roleDashboardRoutes[nextRole] || "/student-dashboard",
          );
        }
        forceRender();
      })
      .catch(() => {});
  }, [
    isKnownNonAdminSession,
    path,
    sessionRole,
    verificationStatus,
  ]);

  React.useEffect(() => {
    if (
      !path.startsWith("/admin-") ||
      hasAdminBackendAccess() ||
      isKnownNonAdminSession
    ) {
      setAdminSessionRecovery("ready");
      return;
    }

    let cancelled = false;
    const recover = async () => {
      setAdminSessionRecovery("loading");
      const storedAuth = getStoredAuth();
      if (storedAuth.refreshToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: storedAuth.refreshToken }),
          });
          if (response.ok) {
            persistAuth(await response.json());
            if (hasAdminBackendAccess()) {
              if (!cancelled) {
                setAdminSessionRecovery("ready");
                forceRender();
              }
              return;
            }
          }
        } catch {
          // Fall through to upgrading a legacy Google/Node session.
        }
      }

      try {
        const response = await fetch(`${GOOGLE_AUTH_BASE_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const payload = await response.json();
          if (payload.accessToken) persistAuth(payload);
        }
      } catch {
        // The access-denied screen remains available if no legacy session exists.
      }

      if (!cancelled) {
        setAdminSessionRecovery(hasAdminBackendAccess() ? "ready" : "failed");
        forceRender();
      }
    };
    recover();
    return () => {
      cancelled = true;
    };
  }, [path, isKnownNonAdminSession]);

  React.useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const originalConsoleError = window.console.error.bind(window.console);
    window.fetch = async (...args) => {
      const requestInfo = args[0];
      const requestOptions = args[1] || {};
      const requestUrl =
        typeof requestInfo === "string"
          ? requestInfo
          : requestInfo?.url || String(requestInfo || "");
      const skipClientAlert = Boolean(requestOptions.__skipClientAlert);

      try {
        const response = await originalFetch(...args);
        if (!skipClientAlert && !response.ok) {
          let detail = `${requestUrl}: HTTP ${response.status}`;
          try {
            const clonedResponse = response.clone();
            const contentType =
              clonedResponse.headers.get("content-type") || "";
            const payload = contentType.includes("application/json")
              ? await clonedResponse.json()
              : await clonedResponse.text();
            const message =
              payload?.message ||
              payload?.error ||
              payload?.title ||
              (typeof payload === "string" ? payload : "");
            if (message)
              detail = `${detail} - ${String(message).slice(0, 180)}`;
          } catch {
            // Keep the status-only message if the response body cannot be read.
          }
          const module = getClientLogModule(requestUrl);
          appendClientSystemLog({
            event: `Web request failed (${response.status})`,
            detail,
            module,
            severity: response.status >= 500 ? "Error" : "Warning",
            actor: "browser@client",
            code: getClientLogCode(module, response.status),
          });
        }
        return response;
      } catch (error) {
        if (!skipClientAlert) {
          const module = getClientLogModule(requestUrl);
          appendClientSystemLog({
            event: "Web request crashed",
            detail: `${requestUrl}: ${error.message}`,
            module,
            severity: "Error",
            actor: "browser@client",
            code: getClientLogCode(module, "FETCH"),
          });
        }
        throw error;
      }
    };
    window.console.error = (...args) => {
      originalConsoleError(...args);
      const detail = args
        .map((item) => {
          if (item instanceof Error) return item.message;
          if (typeof item === "string") return item;
          try {
            return JSON.stringify(item);
          } catch {
            return String(item);
          }
        })
        .join(" ")
        .slice(0, 260);
      appendClientSystemLog({
        event: "Console error",
        detail: detail || `Console error at ${window.location.pathname}`,
        module: getClientLogModule(window.location.pathname),
        severity: "Error",
        actor: "browser@client",
        code: getClientLogCode("System", "CONSOLE"),
      });
    };
    const handleClientError = (event) => {
      appendClientSystemLog({
        event: "Frontend runtime error",
        detail: `${event.message || "Unknown JavaScript error"} at ${window.location.pathname}`,
        module: getClientLogModule(window.location.pathname),
        severity: "Error",
        actor: "browser@client",
        code: getClientLogCode("System", "JS"),
      });
    };
    const handleUnhandledRejection = (event) => {
      const reason = event.reason;
      const message =
        reason?.message ||
        (typeof reason === "string" ? reason : "Unhandled promise rejection");
      appendClientSystemLog({
        event: "Unhandled web request error",
        detail: `${message} at ${window.location.pathname}`,
        module: getClientLogModule(window.location.pathname),
        severity: "Error",
        actor: "browser@client",
        code: getClientLogCode("System", "PROMISE"),
      });
    };

    window.addEventListener("scholartrend:navigate", forceRender);
    window.addEventListener("scholartrend:session-updated", forceRender);
    window.addEventListener("popstate", forceRender);
    window.addEventListener("error", handleClientError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("scholartrend:navigate", forceRender);
      window.removeEventListener("scholartrend:session-updated", forceRender);
      window.removeEventListener("popstate", forceRender);
      window.removeEventListener("error", handleClientError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.fetch = originalFetch;
      window.console.error = originalConsoleError;
    };
  }, []);

  if (path === "/register") return <RegisterPage />;
  if (path === "/login") return <LoginPage />;
  if (path === "/") return <LandingPage />;

  const hasAuthenticatedSession = Boolean(getStoredAuth().accessToken);
  if (!hasAuthenticatedSession) {
    return <LoginPage message="Please sign in to access ScholarTrend." />;
  }

  const isAdminRoute = path.startsWith("/admin-");
  if (isAdminRoute && isKnownNonAdminSession) {
    return (
      <main className="student-app">
        <section className="student-main">
          <div className="student-content" style={{ padding: "4rem 2rem" }}>
            <h1>Redirecting...</h1>
            <p>Opening the page available for your account.</p>
          </div>
        </section>
      </main>
    );
  }
  if (isAdminRoute && adminSessionRecovery === "loading") {
    return (
      <main className="student-app">
        <section className="student-main">
          <div className="student-content" style={{ padding: "4rem 2rem" }}>
            <h1>Restoring administrator session…</h1>
            <p>Your SQL data is safe. Reconnecting this browser to the Admin API.</p>
          </div>
        </section>
      </main>
    );
  }
  if (isAdminRoute && !hasAdminBackendAccess()) {
    if (!getStoredAuth().accessToken) {
      return (
        <LoginPage message="Please sign in with an Administrator account to access the admin panel." />
      );
    }
    return (
      <main className="student-app">
        <section className="student-main">
          <div className="student-content">
            <section
              className="search-results-area"
              style={{ textAlign: "center", padding: "4rem 2rem" }}
            >
              <h1>Access Denied</h1>
              <p style={{ marginBottom: "1.5rem" }}>
                You do not have Administrator privileges. Please log out and
                sign in with an admin account.
              </p>
              <button
                type="button"
                className="new-project"
                onClick={handleLogout}
              >
                Logout &amp; Sign In as Admin
              </button>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (path === "/admin-dashboard") return <AdminDashboard />;
  if (path === "/admin-sync-management") return <AdminSyncManagementPage />;
  if (path === "/admin-user-management") return <AdminUserManagementPage />;
  if (path === "/admin-reviews") return <AdminDashboard />;
  if (path === "/admin-notifications")
    return <AdminNotificationManagementPage />;
  if (path === "/admin-publications") return <AdminDashboard />;
  if (path === "/admin-system-logs") return <AdminSystemLogsPage />;

  const isAcademicRoute =
    path.startsWith("/student-") ||
    path.startsWith("/lecturer-") ||
    path.startsWith("/researcher-");
  const academicRoutePrefix = path.startsWith("/lecturer-")
    ? "lecturer"
    : path.startsWith("/researcher-")
      ? "researcher"
      : path.startsWith("/student-")
        ? "student"
        : "";
  if (
    isAcademicRoute &&
    (!isKnownNonAdminSession || academicRoutePrefix !== nonAdminRolePrefix)
  ) {
    const dashboardPath = nonAdminRolePrefix
      ? `/${nonAdminRolePrefix}-dashboard`
      : "/login";
    return (
      <main className="student-app">
        <section className="student-main">
          <div className="student-content" style={{ padding: "4rem 2rem" }}>
            <section
              className="search-results-area"
              style={{ textAlign: "center", padding: "4rem 2rem" }}
            >
              <h1>Role access denied</h1>
              <p style={{ marginBottom: "1.5rem" }}>
                This page belongs to a different academic role.
              </p>
              <a className="new-project" href={dashboardPath}>
                Back to your dashboard
              </a>
            </section>
          </div>
        </section>
      </main>
    );
  }
  const isPreviewAllowedRoute =
    path.endsWith("-dashboard") || path.endsWith("-profile");
  if (
    isAcademicRoute &&
    isKnownNonAdminSession &&
    verificationStatus !== "verified" &&
    !isPreviewAllowedRoute
  ) {
    return (
      <AcademicFeatureLocked
        role={sessionRole}
        status={verificationStatus}
      />
    );
  }

  if (path === "/lecturer-dashboard") return <LecturerDashboard />;
  if (path === "/lecturer-trend-tracking")
    return <TrendTrackingDashboardPage />;
  if (path === "/lecturer-trend-dashboard")
    return <TrendTrackingDashboardPage />;
  if (path === "/lecturer-reports") return <ReportsPage />;
  if (path === "/lecturer-year-comparison") return <YearComparisonPage />;
  if (path === "/lecturer-sync-management") return <SyncManagementPage />;
  if (path === "/lecturer-search") return <ResearcherSearchPage />;
  if (path === "/lecturer-publication")
    return <StudentPublicationDetailPage role="lecturer" />;
  if (path === "/lecturer-bookmarks") return <BookmarksPage role="lecturer" />;
  if (path === "/lecturer-notifications")
    return <NotificationsPage role="lecturer" />;
  if (path === "/lecturer-profile") return <ProfilePage role="lecturer" />;
  if (path === "/researcher-dashboard") return <ResearcherDashboard />;
  if (path === "/researcher-trend-tracking")
    return <TrendTrackingDashboardPage />;
  if (path === "/researcher-trend-dashboard")
    return <TrendTrackingDashboardPage />;
  if (path === "/researcher-reports") return <ReportsPage />;
  if (path === "/researcher-year-comparison") return <YearComparisonPage />;
  if (path === "/researcher-sync-management") return <SyncManagementPage />;
  if (path === "/researcher-search") return <ResearcherSearchPage />;
  if (path === "/researcher-publication")
    return <StudentPublicationDetailPage role="researcher" />;
  if (path === "/researcher-bookmarks")
    return <BookmarksPage role="researcher" />;
  if (path === "/researcher-notifications")
    return <NotificationsPage role="researcher" />;
  if (path === "/researcher-profile") return <ProfilePage role="researcher" />;
  if (path === "/student-dashboard") return <StudentDashboard />;
  if (path === "/student-search") return <StudentSearchPage />;
  if (path === "/student-bookmarks") return <BookmarksPage />;
  if (path === "/student-notifications") return <NotificationsPage />;
  if (path === "/student-profile") return <ProfilePage />;
  if (path === "/student-publication") return <StudentPublicationDetailPage />;
  return <LandingPage />;
}

export default function App() {
  const [, setAuthRevision] = React.useState(0);

  React.useEffect(() => {
    const refreshAccount = () => {
      refreshStoredAuth()
        .then((result) => {
          if (result) setAuthRevision((value) => value + 1);
        })
        .catch(() => {});
    };
    window.addEventListener("focus", refreshAccount);
    const intervalId = window.setInterval(refreshAccount, 60_000);
    return () => {
      window.removeEventListener("focus", refreshAccount);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <AppErrorBoundary>
      <AcademicVerificationReminder />
      <AppRoutes />
    </AppErrorBoundary>
  );
}
