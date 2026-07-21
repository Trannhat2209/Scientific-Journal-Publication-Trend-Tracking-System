import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PayOS } from "@payos/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

loadEnv(path.join(rootDir, ".env"));

const API_PORT = Number(process.env.API_PORT || 4000);
const FRONTEND_URL = trimTrailingSlash(
  process.env.FRONTEND_URL || "http://localhost:5173",
);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `http://localhost:${API_PORT}/api/auth/google/callback`;
const ORCID_CLIENT_ID = process.env.ORCID_CLIENT_ID || "";
const ORCID_CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET || "";
const ORCID_REDIRECT_URI = process.env.ORCID_REDIRECT_URI || "";
const ORCID_BASE_URL = trimTrailingSlash(
  process.env.ORCID_BASE_URL || "https://sandbox.orcid.org",
);
const INSTITUTION_OIDC_CLIENT_ID =
  process.env.INSTITUTION_OIDC_CLIENT_ID || "";
const INSTITUTION_OIDC_CLIENT_SECRET =
  process.env.INSTITUTION_OIDC_CLIENT_SECRET || "";
const INSTITUTION_OIDC_TENANT_ID =
  process.env.INSTITUTION_OIDC_TENANT_ID || "";
const INSTITUTION_OIDC_REDIRECT_URI =
  process.env.INSTITUTION_OIDC_REDIRECT_URI || "";
const INSTITUTION_OIDC_ISSUER = trimTrailingSlash(
  process.env.INSTITUTION_OIDC_ISSUER ||
    (INSTITUTION_OIDC_TENANT_ID
      ? `https://login.microsoftonline.com/${INSTITUTION_OIDC_TENANT_ID}/v2.0`
      : ""),
);
const INSTITUTION_OIDC_DEV = String(process.env.INSTITUTION_OIDC_DEV || "").toLowerCase() === "true";
const INSTITUTION_OIDC_AUTHORITY = INSTITUTION_OIDC_ISSUER.replace(
  /\/v2\.0$/i,
  "",
);
const APP_SESSION_SECRET =
  process.env.APP_SESSION_SECRET || "scholartrend-dev-session-secret";
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "";
const PAYOS_MONTHLY_AMOUNT = Number(process.env.PAYOS_MONTHLY_AMOUNT || 125000);
const PAYOS_YEARLY_AMOUNT = Number(process.env.PAYOS_YEARLY_AMOUNT || 1225000);
const PAYMENT_PENDING_TTL_SECONDS = Number(
  process.env.PAYMENT_PENDING_TTL_SECONDS || 15 * 60,
);
const DOTNET_API_BASE_URL = trimTrailingSlash(
  process.env.DOTNET_API_BASE_URL || "http://localhost:5227",
);
const PAYMENT_SYNC_SECRET = process.env.PAYMENT_SYNC_SECRET || "";
const isSecureCookie = GOOGLE_REDIRECT_URI.startsWith("https://");

const allowedRoles = new Set([
  "Researcher",
  "Lecturer",
  "Student",
  "Administrator",
]);
const adminManagedRoles = new Set(["Researcher", "Lecturer", "Student"]);

const roleRoutes = {
  Researcher: "/researcher-dashboard",
  Lecturer: "/lecturer-dashboard",
  Student: "/student-dashboard",
  Administrator: "/admin-dashboard",
};

const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const paymentsFile = path.join(dataDir, "payments.json");
const publicationSubmissionsFile = path.join(
  dataDir,
  "publication-submissions.json",
);
const notificationsFile = path.join(dataDir, "notifications.json");

const payos =
  PAYOS_CLIENT_ID && PAYOS_API_KEY && PAYOS_CHECKSUM_KEY
    ? new PayOS({
        clientId: PAYOS_CLIENT_ID,
        apiKey: PAYOS_API_KEY,
        checksumKey: PAYOS_CHECKSUM_KEY,
      })
    : null;

const server = http.createServer(async (req, res) => {
  try {
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (requestUrl.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "scholartrend-auth" });
      return;
    }

    if (requestUrl.pathname === "/api/auth/google/url") {
      requireGoogleConfig();
      const { url, stateToken } = createGoogleAuthUrl(
        requestUrl,
        req.headers.origin,
      );
      sendJson(
        res,
        200,
        { url },
        {
          "Set-Cookie": buildCookie("scholartrend_oauth_state", stateToken, {
            maxAge: 600,
          }),
        },
      );
      return;
    }

    if (requestUrl.pathname === "/api/auth/google/start") {
      requireGoogleConfig();
      const { url, stateToken } = createGoogleAuthUrl(
        requestUrl,
        req.headers.origin,
      );
      redirect(res, url, {
        "Set-Cookie": buildCookie("scholartrend_oauth_state", stateToken, {
          maxAge: 600,
        }),
      });
      return;
    }

    if (requestUrl.pathname === "/api/auth/google/callback") {
      await handleGoogleCallback(req, res, requestUrl);
      return;
    }

    if (requestUrl.pathname === "/api/auth/orcid/url") {
      requireOrcidConfig();
      const { url, stateToken } = createOrcidAuthUrl(
        requestUrl,
        req.headers.origin,
      );
      sendJson(res, 200, { url }, {
        "Set-Cookie": buildCookie("scholartrend_orcid_state", stateToken, {
          maxAge: 600,
        }),
      });
      return;
    }

    if (requestUrl.pathname === "/api/auth/orcid/callback") {
      await handleOrcidCallback(req, res, requestUrl);
      return;
    }

    if (requestUrl.pathname === "/api/auth/institution/url") {
      requireInstitutionConfig();
      const { url, stateToken } = createInstitutionAuthUrl(
        requestUrl,
        req.headers.origin,
      );
      sendJson(res, 200, { url }, {
        "Set-Cookie": buildCookie("scholartrend_institution_state", stateToken, {
          maxAge: 600,
        }),
      });
      return;
    }

    // Development helper: simulate an institution SSO handshake locally when
    // `INSTITUTION_OIDC_DEV=true` is set. This redirects immediately to the
    // standard callback with a generated dev code so the rest of the flow can
    // run unmodified and create a test session.
    if (requestUrl.pathname === "/api/auth/institution/dev") {
      if (!INSTITUTION_OIDC_DEV) {
        sendJson(res, 404, { error: "Not found" });
        return;
      }
      const state = String(requestUrl.searchParams.get("state") || "");
      const code = `DEV:${crypto.randomBytes(8).toString("hex")}`;
      const redirectUrl = `${requestUrl.origin}/api/auth/institution/callback?code=${encodeURIComponent(
        code,
      )}&state=${encodeURIComponent(state)}`;
      redirect(res, redirectUrl);
      return;
    }

    if (requestUrl.pathname === "/api/auth/institution/callback") {
      await handleInstitutionCallback(req, res, requestUrl);
      return;
    }

    // SQL/.NET is the single source of truth. Node only owns the Google OAuth
    // handshake and its short-lived signed cookie; legacy user/payment routes
    // are forwarded without reading or writing server/data/users.json.
    const sqlOwnedAuthPaths = new Set([
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/login-options",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/auth/profile",
    ]);
    if (
      sqlOwnedAuthPaths.has(requestUrl.pathname) ||
      requestUrl.pathname.startsWith("/api/admin/users") ||
      requestUrl.pathname.startsWith("/api/payments/payos")
    ) {
      await proxyDotnetApi(req, res, requestUrl);
      return;
    }

    if (requestUrl.pathname === "/api/auth/register" && req.method === "POST") {
      await handleLocalRegister(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/auth/login" && req.method === "POST") {
      await handleLocalLogin(req, res);
      return;
    }

    if (
      requestUrl.pathname === "/api/auth/login-options" &&
      req.method === "GET"
    ) {
      const email = String(requestUrl.searchParams.get("email") || "")
        .trim()
        .toLowerCase();
      const user = readUsers().find(
        (item) =>
          item.email?.toLowerCase() === email && item.isActive !== false,
      );

      if (user) {
        const role = sanitizeRole(user.role);
        sendJson(res, 200, {
          isAdministrator: role === "Admin",
          allowedRoles:
            role === "Admin" ? [] : ["Researcher", "Lecturer", "Student"],
        });
        return;
      }

      await proxyDotnetApi(req, res, requestUrl);
      return;
    }

    if (
      requestUrl.pathname === "/api/auth/forgot-password" &&
      req.method === "POST"
    ) {
      await handleLocalForgotPassword(req, res);
      return;
    }

    if (
      requestUrl.pathname === "/api/auth/reset-password" &&
      req.method === "POST"
    ) {
      await handleLocalResetPassword(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/auth/profile" && req.method === "GET") {
      handleLocalProfileGet(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/auth/profile" && req.method === "PUT") {
      await handleLocalProfileUpdate(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/auth/me") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { authenticated: false });
        return;
      }
      const enrichedUser = enrichSessionUser(session.user);
      const syncResult = await syncDotnetExternalUser(enrichedUser, true);
      const user = syncResult?.user
        ? applyDotnetUserSync(enrichedUser, syncResult.user)
        : enrichedUser;
      sendJson(res, 200, {
        authenticated: true,
        user,
        ...(syncResult?.auth || session.auth || {}),
      });
      return;
    }

    if (requestUrl.pathname === "/api/auth/logout" && req.method === "POST") {
      sendJson(
        res,
        200,
        { ok: true },
        {
          "Set-Cookie": buildCookie("scholartrend_session", "", {
            maxAge: 0,
          }),
        },
      );
      return;
    }

    if (
      requestUrl.pathname === "/api/payments/payos/create" &&
      req.method === "POST"
    ) {
      await handleCreatePayosPayment(req, res);
      return;
    }

    if (
      requestUrl.pathname === "/api/payments/payos/test-activate" &&
      req.method === "POST"
    ) {
      await handleTestActivatePro(req, res);
      return;
    }

    if (
      requestUrl.pathname === "/api/payments/payos/verify" &&
      req.method === "GET"
    ) {
      await handleVerifyPayosPayment(req, res, requestUrl);
      return;
    }

    if (
      requestUrl.pathname === "/api/payments/payos/webhook" &&
      req.method === "POST"
    ) {
      await handlePayosWebhook(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/admin/users" && req.method === "GET") {
      const users = readUsers();
      await Promise.allSettled(users.map((user) => syncDotnetExternalUser(user)));
      sendJson(res, 200, { items: users.map(mapUserForAdmin) });
      return;
    }

    // PUT /api/admin/users/:identifier/role - Update user role
    const roleUpdateMatch = requestUrl.pathname.match(
	      /^\/api\/admin\/users\/([^/]+)\/role$/,
    );
    if (roleUpdateMatch && req.method === "PUT") {
      const identifier = decodeURIComponent(roleUpdateMatch[1]);
      const body = await readJsonBody(req);
      const { role } = body;

      if (!role || !adminManagedRoles.has(role)) {
        sendJson(res, 400, {
          error: `Invalid role. Must be one of: ${Array.from(adminManagedRoles).join(", ")}`,
        });
        return;
      }

      const users = readUsers();
      const targetUser = users.find(
        (u) =>
          String(u.id) === identifier ||
          u.email.toLowerCase() === identifier.toLowerCase(),
      );

      if (!targetUser) {
        sendJson(res, 404, { error: `User not found: ${identifier}` });
        return;
      }

      // Update role
      targetUser.role = role;
      targetUser.route = roleRoutes[role] || "/student-dashboard";
      targetUser.updatedAt = new Date().toISOString();
      writeUsers(users);

      console.log(`✅ Role updated for ${targetUser.email}: ${role}`);
      sendJson(res, 200, {
        success: true,
        user: mapUserForAdmin(targetUser),
        message: `Role updated to ${role}`,
      });
      return;
    }

    // PUT /api/admin/users/:identifier/pro - Update user pro status
    const proUpdateMatch = requestUrl.pathname.match(
	      /^\/api\/admin\/users\/([^/]+)\/pro$/,
    );
    if (proUpdateMatch && req.method === "PUT") {
      const identifier = decodeURIComponent(proUpdateMatch[1]);
      const body = await readJsonBody(req);
      const { isPro, plan } = body;

      const users = readUsers();
      const targetUser = users.find(
        (u) =>
          String(u.id) === identifier ||
          u.email.toLowerCase() === identifier.toLowerCase(),
      );

      if (!targetUser) {
        sendJson(res, 404, { error: `User not found: ${identifier}` });
        return;
      }

      // Update pro status
      if (typeof isPro === "boolean") {
        targetUser.isPro = isPro;
      }
      if (plan) {
        targetUser.plan = plan;
        targetUser.isPro = plan === "Pro";
      }
      targetUser.updatedAt = new Date().toISOString();
      writeUsers(users);

      console.log(
        `✅ Pro status updated for ${targetUser.email}: ${targetUser.isPro ? "Pro" : "Free"}`,
      );
      sendJson(res, 200, {
        success: true,
        user: mapUserForAdmin(targetUser),
        message: `Plan updated to ${targetUser.plan || (targetUser.isPro ? "Pro" : "Free")}`,
      });
      return;
    }

    const statusUpdateMatch = requestUrl.pathname.match(
	      /^\/api\/admin\/users\/([^/]+)\/active$/,
    );
    if (statusUpdateMatch && req.method === "PUT") {
      const identifier = decodeURIComponent(statusUpdateMatch[1]);
      const body = await readJsonBody(req);
      const users = readUsers();
      const targetUser = users.find(
        (user) =>
          String(user.id) === identifier ||
          String(user.email || "").toLowerCase() === identifier.toLowerCase(),
      );

      if (!targetUser) {
        sendJson(res, 404, { error: `User not found: ${identifier}` });
        return;
      }

      targetUser.isActive = body.isActive !== false;
      targetUser.updatedAt = new Date().toISOString();
      writeUsers(users);
      sendJson(res, 200, {
        success: true,
        user: mapUserForAdmin(targetUser),
        message: `User marked ${targetUser.isActive ? "Active" : "Inactive"}`,
      });
      return;
    }

    const userUpdateMatch = requestUrl.pathname.match(
	      /^\/api\/admin\/users\/([^/]+)$/,
    );
    if (userUpdateMatch && req.method === "PUT") {
      const identifier = decodeURIComponent(userUpdateMatch[1]);
      const body = await readJsonBody(req);
      const users = readUsers();
      const targetIndex = users.findIndex(
        (user) =>
          String(user.id) === identifier ||
          String(user.email || "").toLowerCase() === identifier.toLowerCase(),
      );
      if (targetIndex === -1) {
        sendJson(res, 404, { error: `User not found: ${identifier}` });
        return;
      }

      const normalizedEmail = String(body.email || users[targetIndex].email)
        .trim()
        .toLowerCase();
      const duplicateEmail = users.some(
        (user, index) =>
          index !== targetIndex &&
          String(user.email || "").toLowerCase() === normalizedEmail,
      );
      if (!normalizedEmail || duplicateEmail) {
        sendJson(res, 400, {
          error: duplicateEmail ? "Email already exists." : "Email is required.",
        });
        return;
      }

      const current = users[targetIndex];
      const role = body.role ? sanitizeRole(String(body.role)) : current.role;
      const isPro =
        typeof body.isPro === "boolean"
          ? body.isPro
          : body.plan
            ? body.plan === "Pro"
            : Boolean(current.isPro);
      users[targetIndex] = {
        ...current,
        name: String(body.name || current.name || "").trim(),
        email: normalizedEmail,
        role,
        route: roleRoutes[role],
        isActive:
          typeof body.isActive === "boolean"
            ? body.isActive
            : current.isActive !== false,
        isPro,
        plan: isPro ? "Pro" : "Free",
        subscriptionStatus: isPro ? "active" : "free",
        updatedAt: new Date().toISOString(),
      };
      writeUsers(users);
      sendJson(res, 200, {
        success: true,
        user: mapUserForAdmin(users[targetIndex]),
      });
      return;
    }

    if (
      requestUrl.pathname === "/api/admin/notifications/local" &&
      req.method === "POST"
    ) {
      await handleLocalNotification(req, res);
      return;
    }

    if (
      requestUrl.pathname === "/api/admin/notifications/local" &&
      req.method === "GET"
    ) {
      sendJson(res, 200, { items: readNotifications() });
      return;
    }

    if (
      requestUrl.pathname === "/api/admin/notifications/local/read-all" &&
      req.method === "PUT"
    ) {
      handleLocalNotificationsReadAll(res);
      return;
    }

    if (
      requestUrl.pathname === "/api/notifications/local" &&
      req.method === "GET"
    ) {
      sendJson(res, 200, {
        items: getNotificationsForRecipient(
          requestUrl.searchParams.get("role"),
          requestUrl.searchParams.get("email"),
        ),
      });
      return;
    }

    const localNotificationDeleteMatch = requestUrl.pathname.match(
      /^\/api\/admin\/notifications\/local\/([^/]+)$/,
    );
    if (localNotificationDeleteMatch && req.method === "DELETE") {
      handleLocalNotificationDelete(res, localNotificationDeleteMatch[1]);
      return;
    }

    const adminUserDeleteMatch = requestUrl.pathname.match(
      /^\/api\/admin\/users\/([^/]+)$/,
    );
    if (adminUserDeleteMatch && req.method === "DELETE") {
      await handleAdminDeleteUser(
        req,
        res,
        adminUserDeleteMatch[1],
        requestUrl,
      );
      return;
    }

    if (requestUrl.pathname === "/api/admin/payments" && req.method === "GET") {
      sendJson(res, 200, {
        items: getPaymentsForAdmin().map(mapPaymentForAdmin),
      });
      return;
    }

    if (
      requestUrl.pathname === "/api/publications/submissions/local" &&
      req.method === "POST"
    ) {
      await handleLocalPublicationSubmission(req, res);
      return;
    }

    if (
      requestUrl.pathname === "/api/admin/publication-submissions" &&
      req.method === "GET"
    ) {
      sendJson(res, 200, {
        items: readPublicationSubmissions().filter(
          (submission) => Number(submission.similarityPercent || 0) <= 50,
        ),
      });
      return;
    }

    const localPublicationDeleteMatch = requestUrl.pathname.match(
      /^\/api\/admin\/publication-submissions\/([^/]+)$/,
    );
    if (localPublicationDeleteMatch && req.method === "DELETE") {
      handleLocalPublicationSubmissionDelete(
        res,
        localPublicationDeleteMatch[1],
      );
      return;
    }

    const adminPaymentVerifyMatch = requestUrl.pathname.match(
      /^\/api\/admin\/payments\/(\d+)\/verify$/,
    );
    if (adminPaymentVerifyMatch && req.method === "POST") {
      await handleAdminVerifyPayment(
        req,
        res,
        Number(adminPaymentVerifyMatch[1]),
      );
      return;
    }

    const adminPaymentCancelMatch = requestUrl.pathname.match(
      /^\/api\/admin\/payments\/(\d+)\/cancel$/,
    );
    if (adminPaymentCancelMatch && req.method === "POST") {
      await handleAdminCancelPayment(
        req,
        res,
        Number(adminPaymentCancelMatch[1]),
      );
      return;
    }

    const adminProMatch = requestUrl.pathname.match(
      /^\/api\/admin\/users\/([^/]+)\/pro$/,
    );
    if (adminProMatch && req.method === "PUT") {
      await handleAdminUpdatePro(req, res, adminProMatch[1]);
      return;
    }

    const adminRoleMatch = requestUrl.pathname.match(
      /^\/api\/admin\/users\/([^/]+)\/role$/,
    );
    if (adminRoleMatch && req.method === "PUT") {
      await handleAdminUpdateRole(req, res, adminRoleMatch[1]);
      return;
    }

    if (requestUrl.pathname.startsWith("/api/")) {
      await proxyDotnetApi(req, res, requestUrl);
      return;
    }

    await serveStaticApp(res, requestUrl.pathname);
  } catch (error) {
    console.error("ScholarTrend request failed:", error);
    const status = error.statusCode || 500;
    sendJson(res, status, {
      error:
        status >= 500 && status !== 503
          ? "Authentication server error."
          : error.message || "Request failed.",
    });
  }
});

server.listen(API_PORT, () => {
  console.log(`ScholarTrend API running at http://localhost:${API_PORT}`);
  console.log(`Google callback: ${GOOGLE_REDIRECT_URI}`);
  console.log(`ORCID callback: ${ORCID_REDIRECT_URI || "not configured"}`);
  console.log(
    `Institution callback: ${INSTITUTION_OIDC_REDIRECT_URI || "not configured"}`,
  );
});

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const rows = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const row of rows) {
    const line = row.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && isAllowedCorsOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Internal-Secret",
  );
}

function isAllowedCorsOrigin(origin) {
  const normalizedOrigin = trimTrailingSlash(origin);
  if (normalizedOrigin === FRONTEND_URL) {
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalizedOrigin);
}

function sendJson(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

function buildCookie(name, value, options = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (isSecureCookie) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function hashLocalPassword(password) {
  return crypto
    .createHash("sha256")
    .update(`${APP_SESSION_SECRET}:${password}`)
    .digest("hex");
}

function buildLocalAuthResponse(user, res) {
  const enrichedUser = enrichSessionUser(user);
  const sessionToken = signToken({
    purpose: "session",
    user: enrichedUser,
    issuedAt: Date.now(),
  });
  sendJson(
    res,
    200,
    {
      accessToken: "",
      refreshToken: "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: enrichedUser,
    },
    {
      "Set-Cookie": buildCookie("scholartrend_session", sessionToken, {
        maxAge: 60 * 60 * 24,
      }),
    },
  );
}

async function handleLocalRegister(req, res) {
  const body = await readJsonBody(req);
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const fullName = String(body.fullName || body.name || "").trim();
  const password = String(body.password || "");

  if (!email || !fullName || !password) {
    sendJson(res, 400, {
      error: "Full name, email, and password are required.",
    });
    return;
  }

  let users = readUsers();
  const localDuplicateExists = users.some(
    (user) => user.email?.toLowerCase() === email,
  );
  if (localDuplicateExists) {
    const sqlUserStatus = await getDotnetUserStatusByEmail(email);
    if (sqlUserStatus && (!sqlUserStatus.exists || sqlUserStatus.isDeleted)) {
      users = users.filter((user) => user.email?.toLowerCase() !== email);
      writeUsers(users);
    } else {
      sendJson(res, 409, { error: "This email is already registered." });
      return;
    }
  }

  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    email,
    name: fullName,
    picture: "",
    role: "Student",
    route: roleRoutes.Student,
    provider: "Local",
    createdAt: now,
    lastLoginAt: "",
    isActive: true,
    isPro: false,
    plan: "Free",
    subscriptionStatus: "free",
    passwordHash: hashLocalPassword(password),
  };

  users.push(user);
  writeUsers(users);

  const syncedUser = await syncDotnetExternalUser(user);
  const registeredUser = syncedUser
    ? applyDotnetUserSync(user, syncedUser)
    : user;
  sendJson(res, 201, {
    message: "Account registered. Please sign in.",
    requiresLogin: true,
    route: "/login",
    user: enrichSessionUser(registeredUser),
  });
}

async function handleLocalLogin(req, res) {
  const body = await readJsonBody(req);
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const requestedRole = String(body.requestedRole || "").trim();
  const users = readUsers();
  const user = users.find((item) => item.email?.toLowerCase() === email);

  if (!user || user.passwordHash !== hashLocalPassword(password)) {
    await handleDotnetCredentialLogin(res, {
      email,
      password,
      requestedRole,
    });
    return;
  }

  const accountRole = sanitizeRole(user.role);

  // Admin users don't need to select a role - auto login
  if (accountRole === "Admin") {
    const nextUser = {
      ...user,
      role: accountRole,
      route: roleRoutes[accountRole],
      lastLoginAt: new Date().toISOString(),
    };
    writeUsers(
      users.map((item) =>
        item.email?.toLowerCase() === email ? nextUser : item,
      ),
    );
    buildLocalAuthResponse(nextUser, res);
    return;
  }

  // Non-admin users must select a valid role
  if (!allowedRoles.has(requestedRole)) {
    sendJson(res, 400, { error: "Please select a valid academic role." });
    return;
  }

  if (requestedRole !== accountRole) {
    sendJson(res, 403, {
      error:
        accountRole === "Student"
          ? "This account is currently a Student account. Upgrade your plan before signing in as Researcher or Lecturer."
          : `This account is registered as ${accountRole}. Please select the matching role.`,
    });
    return;
  }

  const nextUser = {
    ...user,
    role: accountRole,
    route: roleRoutes[accountRole],
    lastLoginAt: new Date().toISOString(),
  };
  writeUsers(
    users.map((item) =>
      item.email?.toLowerCase() === email ? nextUser : item,
    ),
  );
  buildLocalAuthResponse(nextUser, res);
}

async function handleDotnetCredentialLogin(
  res,
  { email, password, requestedRole },
) {
  try {
    const response = await fetch(`${DOTNET_API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, requestedRole }),
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : {};

    if (!response.ok || !payload.user) {
      sendJson(res, response.status || 401, {
        error:
          payload.message ||
          payload.error ||
          payload.title ||
          "Invalid email or password.",
      });
      return;
    }

    const role = normalizeDotnetRole(payload.user.role);
    const user = {
      ...payload.user,
      name: payload.user.fullName || payload.user.name || email,
      role,
      route: roleRoutes[role],
      provider: "Backend",
    };
    const sessionToken = signToken({
      purpose: "session",
      user,
      issuedAt: Date.now(),
    });
    sendJson(
      res,
      200,
      { ...payload, user },
      {
        "Set-Cookie": buildCookie("scholartrend_session", sessionToken, {
          maxAge: 60 * 60 * 24,
        }),
      },
    );
  } catch {
    sendJson(res, 401, { error: "Invalid email or password." });
  }
}

async function handleLocalForgotPassword(req, res) {
  const body = await readJsonBody(req);
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    sendJson(res, 400, { error: "Email is required." });
    return;
  }

  const users = readUsers();
  const userIndex = users.findIndex(
    (item) => item.email?.toLowerCase() === email,
  );

  if (userIndex < 0) {
    sendJson(res, 404, {
      error: "No local account was found for this email.",
    });
    return;
  }

  const resetToken = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  users[userIndex] = {
    ...users[userIndex],
    passwordResetToken: hashLocalPassword(resetToken),
    passwordResetTokenExpiresAt: expiresAt,
  };
  writeUsers(users);

  sendJson(res, 200, {
    message: "Password reset code generated. Use the code below within 1 hour.",
    resetToken,
    expiresAt,
  });
}

function mapLocalProfile(user) {
  const role = enforceAccountRole(user.role, user.isPro);
  return {
    id: user.id,
    email: user.email,
    fullName: user.name || user.fullName || user.email,
    institution: user.institution || "",
    department: user.department || "",
    avatarUrl: user.avatarUrl || user.picture || "",
    role,
    isPro: Boolean(user.isPro),
    plan: user.plan || (user.isPro ? "Pro" : "Free"),
  };
}

function handleLocalProfileGet(req, res) {
  const session = getSession(req);
  if (!session?.user?.email) {
    sendJson(res, 401, { error: "Please sign in to view your profile." });
    return;
  }

  const user = enrichSessionUser(session.user);
  sendJson(res, 200, mapLocalProfile(user));
}

async function handleLocalProfileUpdate(req, res) {
  const session = getSession(req);
  if (!session?.user?.email) {
    sendJson(res, 401, { error: "Please sign in to update your profile." });
    return;
  }

  const body = await readJsonBody(req);
  const fullName = String(body.fullName || "").trim();
  if (!fullName) {
    sendJson(res, 400, { error: "Full name is required." });
    return;
  }

  const email = String(session.user.email).trim().toLowerCase();
  const users = readUsers();
  const userIndex = users.findIndex(
    (item) => item.email?.toLowerCase() === email,
  );
  const currentUser = userIndex >= 0 ? users[userIndex] : session.user;
  const updatedUser = {
    ...currentUser,
    email,
    name: fullName,
    fullName,
    institution: String(body.institution || "")
      .trim()
      .slice(0, 160),
    department: String(body.department || "")
      .trim()
      .slice(0, 160),
    avatarUrl: String(body.avatarUrl || "").slice(0, 900000),
    profileUpdatedAt: new Date().toISOString(),
  };

  if (userIndex >= 0) users[userIndex] = updatedUser;
  else users.push(updatedUser);
  writeUsers(users);

  const sessionUser = enrichSessionUser(updatedUser);
  const sessionToken = signToken({
    purpose: "session",
    user: sessionUser,
    issuedAt: Date.now(),
  });
  sendJson(res, 200, mapLocalProfile(sessionUser), {
    "Set-Cookie": buildCookie("scholartrend_session", sessionToken, {
      maxAge: 60 * 60 * 24,
    }),
  });
}

async function handleLocalResetPassword(req, res) {
  const body = await readJsonBody(req);
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const token = String(body.token || "").trim();
  const newPassword = String(body.newPassword || body.password || "");

  if (!email || !token || !newPassword) {
    sendJson(res, 400, {
      error: "Email, reset code, and new password are required.",
    });
    return;
  }

  if (newPassword.length < 6) {
    sendJson(res, 400, {
      error: "New password must be at least 6 characters.",
    });
    return;
  }

  const users = readUsers();
  const userIndex = users.findIndex(
    (item) => item.email?.toLowerCase() === email,
  );

  if (userIndex < 0) {
    sendJson(res, 404, {
      error: "No local account was found for this email.",
    });
    return;
  }

  const user = users[userIndex];
  const expiresAt = user.passwordResetTokenExpiresAt
    ? new Date(user.passwordResetTokenExpiresAt).getTime()
    : Number.NaN;

  if (!user.passwordResetToken || !Number.isFinite(expiresAt)) {
    sendJson(res, 400, {
      error: "Please request a password reset code first.",
    });
    return;
  }

  if (expiresAt <= Date.now()) {
    sendJson(res, 400, {
      error: "Password reset code has expired. Please request a new code.",
    });
    return;
  }

  if (user.passwordResetToken !== hashLocalPassword(token)) {
    sendJson(res, 400, {
      error: "Invalid password reset code.",
    });
    return;
  }

  users[userIndex] = {
    ...user,
    passwordHash: hashLocalPassword(newPassword),
    passwordResetToken: "",
    passwordResetTokenExpiresAt: "",
    updatedAt: new Date().toISOString(),
  };
  writeUsers(users);

  sendJson(res, 200, {
    message: "Password has been reset. Please sign in with your new password.",
  });
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");
        return [
          cookie.slice(0, separatorIndex),
          decodeURIComponent(cookie.slice(separatorIndex + 1)),
        ];
      }),
  );
}

function requireGoogleConfig() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const error = new Error("Google OAuth credentials are not configured.");
    error.statusCode = 500;
    throw error;
  }
}

function requireOrcidConfig() {
  if (!ORCID_CLIENT_ID || !ORCID_CLIENT_SECRET || !ORCID_REDIRECT_URI) {
    const error = new Error(
      "ORCID OAuth is not configured. Add ORCID client credentials and redirect URI to .env.",
    );
    error.statusCode = 503;
    throw error;
  }
}

function createOrcidAuthUrl(requestUrl, requestOrigin) {
  const role = sanitizeRole(requestUrl.searchParams.get("role"));
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"));
  const frontendOrigin = sanitizeFrontendOrigin(requestOrigin);
  const stateToken = signToken({
    purpose: "orcid-oauth",
    nonce: crypto.randomBytes(16).toString("base64url"),
    role,
    returnTo,
    frontendOrigin,
    exp: Math.floor(Date.now() / 1000) + 600,
  });
  const authUrl = new URL(`${ORCID_BASE_URL}/oauth/authorize`);
  authUrl.searchParams.set("client_id", ORCID_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "/authenticate");
  authUrl.searchParams.set("redirect_uri", ORCID_REDIRECT_URI);
  authUrl.searchParams.set("state", stateToken);
  return { url: authUrl.toString(), stateToken };
}

async function handleOrcidCallback(req, res, requestUrl) {
  await handleExternalOAuthCallback({
    req,
    res,
    requestUrl,
    provider: "ORCID",
    purpose: "orcid-oauth",
    cookieName: "scholartrend_orcid_state",
    exchangeUser: exchangeOrcidCode,
  });
}

async function exchangeOrcidCode(code) {
  const response = await fetch(`${ORCID_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: ORCID_CLIENT_ID,
      client_secret: ORCID_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: ORCID_REDIRECT_URI,
    }),
  });
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(
      payload.error_description || payload.error || "ORCID token exchange failed.",
    );
  }
  const orcid = String(payload.orcid || "").trim();
  if (!/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i.test(orcid)) {
    throw new Error("ORCID did not return a valid authenticated iD.");
  }
  return {
    externalId: orcid,
    // The ORCID Public API /authenticate scope does not expose an email.
    // A stable non-deliverable identifier keeps the SQL account unique.
    email: `${orcid.toLowerCase()}@orcid.scholartrend.local`,
    name: String(payload.name || `ORCID ${orcid}`).trim(),
    picture: "",
    emailVerified: true,
  };
}

function requireInstitutionConfig() {
  // Allow a developer-friendly fallback when INSTITUTION_OIDC_DEV=true.
  if (INSTITUTION_OIDC_DEV) return;

  if (
    !INSTITUTION_OIDC_CLIENT_ID ||
    !INSTITUTION_OIDC_CLIENT_SECRET ||
    !INSTITUTION_OIDC_REDIRECT_URI ||
    !INSTITUTION_OIDC_ISSUER
  ) {
    const error = new Error(
      "Institution SSO is not configured. Ask the institution administrator for OIDC client credentials.",
    );
    error.statusCode = 503;
    throw error;
  }
}

function createInstitutionAuthUrl(requestUrl, requestOrigin) {
  const role = sanitizeRole(requestUrl.searchParams.get("role"));
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"));
  const frontendOrigin = sanitizeFrontendOrigin(requestOrigin);
  const stateToken = signToken({
    purpose: "institution-oauth",
    nonce: crypto.randomBytes(16).toString("base64url"),
    role,
    returnTo,
    frontendOrigin,
    exp: Math.floor(Date.now() / 1000) + 600,
  });
  // If developer mode is enabled, return a local dev endpoint that will
  // simulate the institution provider and immediately redirect to the
  // callback with a dev code.
  if (INSTITUTION_OIDC_DEV) {
    try {
      const origin = requestUrl?.origin || FRONTEND_URL;
      const devUrl = new URL("/api/auth/institution/dev", origin);
      devUrl.searchParams.set("state", stateToken);
      return { url: devUrl.toString(), stateToken };
    } catch {
      // Fallback to frontend origin if anything goes wrong.
      return { url: `${FRONTEND_URL}/?auth=institution-dev`, stateToken };
    }
  }

  const authUrl = new URL(
    `${INSTITUTION_OIDC_AUTHORITY}/oauth2/v2.0/authorize`,
  );
  authUrl.searchParams.set("client_id", INSTITUTION_OIDC_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("redirect_uri", INSTITUTION_OIDC_REDIRECT_URI);
  authUrl.searchParams.set("state", stateToken);
  authUrl.searchParams.set("nonce", stateToken.slice(0, 32));
  authUrl.searchParams.set("prompt", "select_account");
  return { url: authUrl.toString(), stateToken };
}

async function handleInstitutionCallback(req, res, requestUrl) {
  await handleExternalOAuthCallback({
    req,
    res,
    requestUrl,
    provider: "Institution SSO",
    purpose: "institution-oauth",
    cookieName: "scholartrend_institution_state",
    exchangeUser: exchangeInstitutionCode,
  });
}

async function exchangeInstitutionCode(code) {
  // Developer-mode: return a fake profile for dev codes so local testing
  // works without real OIDC credentials.
  if (INSTITUTION_OIDC_DEV && String(code || "").startsWith("DEV:")) {
    const id = String(code).slice(4);
    return {
      externalId: `dev-institution:${id}`,
      email: `dev.user+${id}@example.edu`,
      name: `Dev Institution User ${id}`,
      picture: "",
      emailVerified: true,
    };
  }

  const response = await fetch(
    `${INSTITUTION_OIDC_AUTHORITY}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: INSTITUTION_OIDC_CLIENT_ID,
        client_secret: INSTITUTION_OIDC_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: INSTITUTION_OIDC_REDIRECT_URI,
        scope: "openid profile email",
      }),
    },
  );
  const tokenSet = await response.json();
  if (!response.ok || tokenSet.error) {
    throw new Error(
      tokenSet.error_description || tokenSet.error || "Institution token exchange failed.",
    );
  }
  if (!tokenSet.access_token) {
    throw new Error("Institution did not return an access token.");
  }
  const userInfoResponse = await fetch(
    "https://graph.microsoft.com/oidc/userinfo",
    { headers: { Authorization: `Bearer ${tokenSet.access_token}` } },
  );
  const profile = await userInfoResponse.json();
  if (!userInfoResponse.ok) {
    throw new Error(profile.error_description || "Institution profile lookup failed.");
  }
  const externalId = String(profile.sub || "").trim();
  const email = String(profile.email || profile.preferred_username || "")
    .trim()
    .toLowerCase();
  if (!externalId || !email || !email.includes("@")) {
    throw new Error("Institution account did not provide a usable email address.");
  }
  return {
    externalId,
    email,
    name: String(profile.name || email).trim(),
    picture: String(profile.picture || ""),
    emailVerified: true,
  };
}

async function handleExternalOAuthCallback({
  req,
  res,
  requestUrl,
  provider,
  purpose,
  cookieName,
  exchangeUser,
}) {
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const savedState = parseCookies(req)[cookieName];
  let callbackFrontendOrigin = FRONTEND_URL;
  const providerSlug = provider === "ORCID" ? "orcid" : "institution";
  try {
    if (!code) throw new Error(`${provider} did not return an authorization code.`);
    if (!state || !savedState || state !== savedState) {
      throw new Error("OAuth state validation failed.");
    }
    const statePayload = verifyToken(state, purpose);
    callbackFrontendOrigin = sanitizeFrontendOrigin(statePayload.frontendOrigin);
    const externalProfile = await exchangeUser(code);
    const localUser = buildExternalUser(
      externalProfile,
      statePayload.role,
      provider,
    );
    const syncResult = await syncDotnetExternalUser(localUser, true);
    const user = syncResult?.user
      ? applyDotnetUserSync(localUser, syncResult.user)
      : localUser;
    const sessionToken = signToken({
      purpose: "session",
      user,
      auth: syncResult?.auth || null,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    });
    redirect(
      res,
      `${callbackFrontendOrigin}${statePayload.returnTo || "/login"}?auth=${providerSlug}-success`,
      {
        "Set-Cookie": [
          buildCookie("scholartrend_session", sessionToken, {
            maxAge: 60 * 60 * 24 * 7,
          }),
          buildCookie(cookieName, "", { maxAge: 0 }),
        ],
      },
    );
  } catch (error) {
    redirect(
      res,
      `${callbackFrontendOrigin}/login?auth=${providerSlug}-error&message=${encodeURIComponent(error.message)}`,
      { "Set-Cookie": buildCookie(cookieName, "", { maxAge: 0 }) },
    );
  }
}

function buildExternalUser(profile, role, provider) {
  const now = new Date().toISOString();
  const accountRole = sanitizeRole(role || "Student");
  return {
    id: `${provider.toLowerCase().replace(/\W+/g, "-")}:${profile.externalId}`,
    externalId: profile.externalId,
    email: profile.email.toLowerCase(),
    name: profile.name,
    picture: profile.picture || "",
    role: accountRole,
    route: roleRoutes[accountRole],
    provider,
    emailVerified: profile.emailVerified === true,
    createdAt: now,
    lastLoginAt: now,
    isPro: false,
    plan: "Free",
    subscriptionStatus: "free",
  };
}

function createGoogleAuthUrl(requestUrl, requestOrigin) {
  const role = sanitizeRole(requestUrl.searchParams.get("role"));
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"));
  const frontendOrigin = sanitizeFrontendOrigin(requestOrigin);
  const stateToken = signToken({
    purpose: "google-oauth",
    nonce: crypto.randomBytes(16).toString("base64url"),
    role,
    returnTo,
    frontendOrigin,
    exp: Math.floor(Date.now() / 1000) + 600,
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", stateToken);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account");

  return { url: authUrl.toString(), stateToken };
}

function sanitizeRole(role) {
  return allowedRoles.has(role) ? role : "Student";
}

function enforceAccountRole(role, isPro) {
  const normalizedRole = sanitizeRole(role);
  // Preserve explicit roles for free and paid users; Administrator is kept as-is.
  return normalizedRole;
}

function sanitizeUpgradeRole(role) {
  return role === "Lecturer" || role === "Researcher" ? role : "Researcher";
}

function sanitizeReturnTo(returnTo) {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/login";
  }
  return returnTo;
}

function sanitizeFrontendOrigin(origin) {
  if (!origin || !isAllowedCorsOrigin(origin)) {
    return FRONTEND_URL;
  }

  return trimTrailingSlash(origin);
}

async function handleGoogleCallback(req, res, requestUrl) {
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookies = parseCookies(req);
  const savedState = cookies.scholartrend_oauth_state;
  let callbackFrontendOrigin = FRONTEND_URL;

  try {
    if (!code) {
      throw new Error("Google did not return an authorization code.");
    }

    if (!state || !savedState || state !== savedState) {
      throw new Error("OAuth state validation failed.");
    }

    const statePayload = verifyToken(state, "google-oauth");
    callbackFrontendOrigin = sanitizeFrontendOrigin(
      statePayload.frontendOrigin,
    );
    const tokenSet = await exchangeCodeForTokens(code);
    const googleUser = await fetchGoogleUser(tokenSet);
    const localUser = upsertUser(googleUser, statePayload.role);
    const syncResult = await syncDotnetExternalUser(localUser, true);
    const user = syncResult?.user
      ? applyDotnetUserSync(localUser, syncResult.user)
      : localUser;
    const accountRole = sanitizeRole(user.role);
    if (statePayload.role !== accountRole) {
      throw new Error(
        accountRole === "Student"
          ? "This Google account is currently a Student account. Upgrade your plan before signing in as Researcher or Lecturer."
          : `This Google account is registered as ${accountRole}. Please select the matching role.`,
      );
    }
    const sessionToken = signToken({
      purpose: "session",
      user,
      auth: syncResult?.auth || null,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    });

    redirect(
      res,
      `${callbackFrontendOrigin}${statePayload.returnTo || "/login"}?auth=google-success`,
      {
        "Set-Cookie": [
          buildCookie("scholartrend_session", sessionToken, {
            maxAge: 60 * 60 * 24 * 7,
          }),
          buildCookie("scholartrend_oauth_state", "", { maxAge: 0 }),
        ],
      },
    );
  } catch (error) {
    redirect(
      res,
      `${callbackFrontendOrigin}/login?auth=google-error&message=${encodeURIComponent(
        error.message,
      )}`,
      {
        "Set-Cookie": buildCookie("scholartrend_oauth_state", "", {
          maxAge: 0,
        }),
      },
    );
  }
}

async function exchangeCodeForTokens(code) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokenSet = await response.json();
  if (!response.ok) {
    throw new Error(
      tokenSet.error_description || "Google token exchange failed.",
    );
  }

  return tokenSet;
}

async function fetchGoogleUser(tokenSet) {
  if (!tokenSet.id_token) {
    throw new Error("Google did not return an ID token.");
  }

  const tokenInfoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      tokenSet.id_token,
    )}`,
  );
  const tokenInfo = await tokenInfoResponse.json();

  if (!tokenInfoResponse.ok) {
    throw new Error(
      tokenInfo.error_description || "Google ID token is invalid.",
    );
  }

  if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("Google ID token audience does not match this app.");
  }

  if (
    tokenInfo.email_verified !== "true" &&
    tokenInfo.email_verified !== true
  ) {
    throw new Error("Google account email is not verified.");
  }

  let userInfo = {};
  if (tokenSet.access_token) {
    const userInfoResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenSet.access_token}` },
      },
    );
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json();
    }
  }

  return {
    googleId: tokenInfo.sub,
    email: tokenInfo.email,
    emailVerified: true,
    name: userInfo.name || tokenInfo.name || tokenInfo.email,
    picture: userInfo.picture || tokenInfo.picture || "",
  };
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", APP_SESSION_SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token, purpose) {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    throw new Error("Invalid token format.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", APP_SESSION_SECRET)
    .update(body)
    .digest("base64url");

  if (signature.length !== expectedSignature.length) {
    throw new Error("Invalid token signature.");
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    throw new Error("Invalid token signature.");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.purpose !== purpose) {
    throw new Error("Invalid token purpose.");
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token has expired.");
  }

  return payload;
}

function getSession(req) {
  const cookies = parseCookies(req);
  if (!cookies.scholartrend_session) return null;

  try {
    return verifyToken(cookies.scholartrend_session, "session");
  } catch {
    return null;
  }
}

function upsertUser(googleUser, role) {
  const now = new Date().toISOString();
  const email = googleUser.email.toLowerCase();
  const accountRole = sanitizeRole(role || "Student");
  return {
    id: `google:${googleUser.googleId}`,
    email,
    name: googleUser.name,
    picture: googleUser.picture,
    role: accountRole,
    route: roleRoutes[accountRole],
    provider: "Google",
    googleId: googleUser.googleId,
    emailVerified: googleUser.emailVerified,
    createdAt: now,
    lastLoginAt: now,
    isPro: false,
    plan: "Free",
    subscriptionStatus: "free",
  };
}

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function writeUsers(users) {
  ensureDataDir();
  fs.writeFileSync(usersFile, `${JSON.stringify(users, null, 2)}\n`);
}

function getSubscriptionExpiresAt(billingCycle, baseDate = new Date()) {
  const expiresAt = new Date(baseDate);
  if (billingCycle === "monthly") {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  return expiresAt.toISOString();
}

function applyExpiredSubscriptions(users) {
  if (!Array.isArray(users)) return { users: [], changed: false };

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  let changed = false;
  const nextUsers = users.map((user) => {
    const expiresAt = user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt).getTime()
      : Number.NaN;
    const shouldExpire =
      user.isPro === true && Number.isFinite(expiresAt) && expiresAt <= now;

    const enforcedRole = enforceAccountRole(user.role, user.isPro);

    if (!shouldExpire && enforcedRole !== user.role) {
      changed = true;
      return {
        ...user,
        role: enforcedRole,
        route: roleRoutes[enforcedRole],
        plan: user.isPro ? user.plan || "Pro" : "Free",
        subscriptionStatus: user.isPro
          ? user.subscriptionStatus || "active"
          : "free",
      };
    }

    if (!shouldExpire) return user;

    changed = true;
    return {
      ...user,
      role: "Student",
      route: roleRoutes.Student,
      isPro: false,
      plan: "Free",
      subscriptionStatus: "expired",
      subscriptionExpiredAt: nowIso,
      subscriptionUpdatedAt: nowIso,
    };
  });

  return { users: nextUsers, changed };
}

function readUsers() {
  if (!fs.existsSync(usersFile)) return [];

  try {
    const parsedUsers = JSON.parse(fs.readFileSync(usersFile, "utf8"));
    const { users, changed } = applyExpiredSubscriptions(parsedUsers);
    if (changed) writeUsers(users);
    return users;
  } catch {
    return [];
  }
}

function readPayments() {
  if (!fs.existsSync(paymentsFile)) return [];

  try {
    return JSON.parse(fs.readFileSync(paymentsFile, "utf8"));
  } catch {
    return [];
  }
}

function writePayments(payments) {
  ensureDataDir();
  fs.writeFileSync(paymentsFile, `${JSON.stringify(payments, null, 2)}\n`);
}

function readPublicationSubmissions() {
  if (!fs.existsSync(publicationSubmissionsFile)) return [];

  try {
    const submissions = JSON.parse(
      fs.readFileSync(publicationSubmissionsFile, "utf8"),
    );
    return Array.isArray(submissions) ? submissions : [];
  } catch {
    return [];
  }
}

function writePublicationSubmissions(submissions) {
  ensureDataDir();
  fs.writeFileSync(
    publicationSubmissionsFile,
    `${JSON.stringify(submissions, null, 2)}\n`,
  );
}

function readNotifications() {
  if (!fs.existsSync(notificationsFile)) return [];

  try {
    const notifications = JSON.parse(
      fs.readFileSync(notificationsFile, "utf8"),
    );
    return Array.isArray(notifications) ? notifications : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications) {
  ensureDataDir();
  fs.writeFileSync(
    notificationsFile,
    `${JSON.stringify(notifications, null, 2)}\n`,
  );
}

function getAccuracyForUser(user) {
  const role = sanitizeRole(user?.role);
  const freeAccuracy = { Student: 15, Lecturer: 15, Researcher: 15 };
  const proAccuracy = { Student: 35, Lecturer: 35, Researcher: 35 };
  if (role === "Administrator") return 100;
  return (
    (user?.isPro ? proAccuracy : freeAccuracy)[role] ?? freeAccuracy.Student
  );
}

function enrichSessionUser(user) {
  if (!user) return user;
  const savedUser = user.provider === "Google" ? null : readUsers().find(
    (item) =>
      item.id === user.id ||
      item.email?.toLowerCase() === user.email?.toLowerCase(),
  );
  const mergedUser = {
    ...user,
    ...(savedUser || {}),
  };
  return {
    ...mergedUser,
    isPro: Boolean(mergedUser.isPro),
    plan: mergedUser.plan || (mergedUser.isPro ? "Pro" : "Free"),
    subscriptionStatus:
      mergedUser.subscriptionStatus || (mergedUser.isPro ? "active" : "free"),
    searchAccuracy: getAccuracyForUser(mergedUser),
  };
}

function normalizeDotnetRole(role) {
  return role === "Admin" ? "Administrator" : sanitizeRole(role);
}

function applyDotnetUserSync(user, sqlUser) {
  if (!sqlUser?.id || !user?.email) return user;

  const email = user.email.toLowerCase();
  const isPro = Boolean(sqlUser.isPro || user.isPro);
  const role = enforceAccountRole(
    normalizeDotnetRole(sqlUser.role || user.role),
    isPro,
  );
  const nextUser = {
    ...user,
    id: sqlUser.id,
    email,
    name: sqlUser.name || sqlUser.fullName || user.name || email,
    role,
    route: roleRoutes[role],
    isPro,
    plan: sqlUser.plan || user.plan || "Free",
    subscriptionStatus:
      sqlUser.subscriptionStatus ||
      user.subscriptionStatus ||
      (sqlUser.isPro || user.isPro ? "active" : "free"),
    searchAccuracy: sqlUser.searchAccuracy || user.searchAccuracy,
  };

  return nextUser;
}

async function syncDotnetExternalUser(user, includeAuth = false) {
  if (!PAYMENT_SYNC_SECRET || !user?.email) return null;

  // Local accounts are owned by the .NET credential endpoints. Sending them
  // through sync-external would create an SQL account with an unknown random
  // password, making normal password login impossible.
  if (String(user.provider || "").trim().toLowerCase() === "local") {
    return null;
  }

  try {
    const response = await fetch(
      `${DOTNET_API_BASE_URL}/api/admin/users/sync-external`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": PAYMENT_SYNC_SECRET,
        },
        body: JSON.stringify({
          fullName: user.name || user.fullName || user.email,
          email: user.email,
          role: user.role,
          provider: user.provider || "Google",
          externalId: user.googleId || user.id || "",
          isPro: Boolean(user.isPro),
          plan: user.plan || "Free",
        }),
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return includeAuth ? payload : payload.user || payload;
  } catch {
    return null;
  }
}

async function getDotnetUserStatusByEmail(email) {
  if (!PAYMENT_SYNC_SECRET || !email) return null;

  try {
    const params = new URLSearchParams({ email });
    const response = await fetch(
      `${DOTNET_API_BASE_URL}/api/admin/users/internal?${params.toString()}`,
      {
        headers: {
          "X-Internal-Secret": PAYMENT_SYNC_SECRET,
        },
      },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function resolveRequestUser(req, body = {}) {
  const sessionUser = getSession(req)?.user;
  const bodyUser = body.user || {};
  const candidate = sessionUser || bodyUser;
  const email = String(candidate.email || "")
    .trim()
    .toLowerCase();
  if (!email) return null;

  const role = sanitizeRole(candidate.role || "Student");
  const users = readUsers();
  const existingIndex = users.findIndex((user) => user.email === email);
  const existingUser = existingIndex >= 0 ? users[existingIndex] : {};
  const user = {
    ...existingUser,
    id: existingUser.id || candidate.id || crypto.randomUUID(),
    email,
    name: candidate.name || candidate.fullName || existingUser.name || email,
    picture: candidate.picture || existingUser.picture || "",
    role: existingUser.role || role,
    route: roleRoutes[existingUser.role || role],
    provider: existingUser.provider || candidate.provider || "ScholarTrend",
    createdAt: existingUser.createdAt || new Date().toISOString(),
    lastLoginAt: existingUser.lastLoginAt || new Date().toISOString(),
    isPro: Boolean(existingUser.isPro || candidate.isPro),
    plan: existingUser.plan || candidate.plan || "Free",
    subscriptionStatus:
      existingUser.subscriptionStatus || candidate.subscriptionStatus || "free",
  };

  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  writeUsers(users);
  return user;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON request body.");
    error.statusCode = 400;
    throw error;
  }
}

async function handleCreatePayosPayment(req, res) {
  if (!payos) {
    sendJson(res, 500, {
      error:
        "PayOS is not configured. Add PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY to .env.",
    });
    return;
  }

  const body = await readJsonBody(req);
  const user = resolveRequestUser(req, body);
  if (!user) {
    sendJson(res, 401, { error: "Please sign in before upgrading to Pro." });
    return;
  }

  const billingCycle = body.billingCycle === "monthly" ? "monthly" : "yearly";
  const targetRole = sanitizeUpgradeRole(body.targetRole);
  const amount =
    billingCycle === "monthly" ? PAYOS_MONTHLY_AMOUNT : PAYOS_YEARLY_AMOUNT;
  const orderCode = Number(
    `${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12),
  );
  const expiresAt = Math.floor(Date.now() / 1000) + PAYMENT_PENDING_TTL_SECONDS;
  const returnUrl = `${FRONTEND_URL}/payment-return?provider=payos&orderCode=${orderCode}`;
  const cancelUrl = `${FRONTEND_URL}/payment-return?provider=payos&orderCode=${orderCode}&cancelled=1`;

  const paymentLink = await payos.paymentRequests.create({
    orderCode,
    amount,
    description: `ST Pro ${billingCycle}`,
    returnUrl,
    cancelUrl,
    buyerName: user.name,
    buyerEmail: user.email,
    expiredAt: expiresAt,
    items: [
      {
        name: `ScholarTrend Pro ${targetRole} ${billingCycle}`,
        quantity: 1,
        price: amount,
      },
    ],
  });

  const payments = readPayments();
  payments.unshift({
    orderCode,
    paymentLinkId: paymentLink.paymentLinkId,
    checkoutUrl: paymentLink.checkoutUrl,
    amount,
    billingCycle,
    targetRole,
    status: paymentLink.status || "PENDING",
    userId: user.id,
    email: user.email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  });
  writePayments(payments);

  sendJson(res, 200, {
    checkoutUrl: paymentLink.checkoutUrl,
    orderCode,
    status: paymentLink.status,
  });
}

async function handleTestActivatePro(req, res) {
  const body = await readJsonBody(req);
  const user = resolveRequestUser(req, body);
  if (!user) {
    sendJson(res, 401, { error: "Please sign in before testing Pro upgrade." });
    return;
  }

  const billingCycle = body.billingCycle === "monthly" ? "monthly" : "yearly";
  const targetRole = sanitizeUpgradeRole(body.targetRole);
  const amount =
    billingCycle === "monthly" ? PAYOS_MONTHLY_AMOUNT : PAYOS_YEARLY_AMOUNT;
  const orderCode = Number(
    `${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12),
  );
  const now = new Date().toISOString();
  const paymentLinkId = `TEST-${orderCode}`;
  const payments = readPayments();

  payments.unshift({
    orderCode,
    paymentLinkId,
    checkoutUrl: "",
    amount,
    billingCycle,
    targetRole,
    status: "PAID",
    testMode: true,
    userId: user.id,
    email: user.email,
    createdAt: now,
    paidAt: now,
    updatedAt: now,
    expiresAt: now,
  });
  writePayments(payments);

  const upgradedUser = await activateUserPro(user.email, {
    billingCycle,
    targetRole,
    orderCode,
    paymentLinkId,
    testMode: true,
  });

  sendJson(res, 200, {
    ok: true,
    testMode: true,
    orderCode,
    status: "PAID",
    user: upgradedUser,
    message: `Test upgrade activated ${targetRole} Pro without PayOS checkout.`,
  });
}

async function handleVerifyPayosPayment(req, res, requestUrl) {
  if (!payos) {
    sendJson(res, 500, { error: "PayOS is not configured." });
    return;
  }

  const orderCode = Number(requestUrl.searchParams.get("orderCode"));
  if (!Number.isFinite(orderCode)) {
    sendJson(res, 400, { error: "orderCode is required." });
    return;
  }

  const payment = await payos.paymentRequests.get(orderCode);
  const savedPayment = readPayments().find(
    (item) => item.orderCode === orderCode,
  );
  const isExpired =
    savedPayment?.expiresAt &&
    new Date(savedPayment.expiresAt).getTime() <= Date.now() &&
    payment.status !== "PAID";
  if (isExpired) {
    markPayment(orderCode, "EXPIRED");
    sendJson(res, 200, { status: "EXPIRED" });
    return;
  }

  if (payment.status === "PAID" && savedPayment) {
    const user = await activateUserPro(savedPayment.email, {
      billingCycle: savedPayment.billingCycle,
      targetRole: savedPayment.targetRole,
      orderCode,
      paymentLinkId: savedPayment.paymentLinkId,
    });
    markPayment(orderCode, "PAID");
    sendJson(res, 200, { status: "PAID", user });
    return;
  }

  markPayment(orderCode, payment.status);
  sendJson(res, 200, { status: payment.status });
}

async function handlePayosWebhook(req, res) {
  if (!payos) {
    sendJson(res, 500, { error: "PayOS is not configured." });
    return;
  }

  const body = await readJsonBody(req);
  const webhookData = await payos.webhooks.verify(body);
  const orderCode = Number(
    webhookData?.orderCode || webhookData?.data?.orderCode,
  );
  const savedPayment = readPayments().find(
    (item) => item.orderCode === orderCode,
  );

  if (savedPayment && webhookData?.code === "00") {
    await activateUserPro(savedPayment.email, {
      billingCycle: savedPayment.billingCycle,
      targetRole: savedPayment.targetRole,
      orderCode,
      paymentLinkId: savedPayment.paymentLinkId,
    });
    markPayment(orderCode, "PAID");
  }

  sendJson(res, 200, { ok: true });
}

async function activateUserPro(email, paymentMeta = {}) {
  const sqlUser = await activateDotnetUserPro(email, paymentMeta);
  const users = readUsers();
  const normalizedEmail = String(email || "").toLowerCase();
  const userIndex = users.findIndex((user) => user.email === normalizedEmail);
  if (userIndex === -1) return sqlUser;

  const now = new Date().toISOString();
  const currentUser = users[userIndex];
  const targetRole = sanitizeUpgradeRole(paymentMeta.targetRole);
  const billingCycle =
    paymentMeta.billingCycle === "monthly" ? "monthly" : "yearly";
  const nextUser = {
    ...currentUser,
    role: targetRole,
    route: roleRoutes[targetRole],
    isPro: true,
    plan: "Pro",
    subscriptionStatus: "active",
    subscriptionBillingCycle: billingCycle,
    subscriptionStartedAt: now,
    subscriptionExpiresAt: getSubscriptionExpiresAt(
      billingCycle,
      new Date(now),
    ),
    subscriptionUpdatedAt: now,
    payos: {
      ...(currentUser.payos || {}),
      ...paymentMeta,
      activatedAt: now,
    },
  };
  users[userIndex] = nextUser;
  writeUsers(users);
  return {
    ...enrichSessionUser(nextUser),
    ...(sqlUser || {}),
  };
}

async function activateDotnetUserPro(email, paymentMeta = {}) {
  if (!PAYMENT_SYNC_SECRET) return null;

  try {
    const response = await fetch(
      `${DOTNET_API_BASE_URL}/api/payments/payos/activate-pro`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": PAYMENT_SYNC_SECRET,
        },
        body: JSON.stringify({
          email,
          billingCycle: paymentMeta.billingCycle || "",
          targetRole: sanitizeUpgradeRole(paymentMeta.targetRole),
          orderCode: Number(paymentMeta.orderCode || 0),
          paymentLinkId: paymentMeta.paymentLinkId || "",
        }),
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return {
      id: payload.id,
      email: payload.email,
      name: payload.fullName || payload.name || payload.email,
      role: payload.role,
      isPro: Boolean(payload.isPro),
      plan: payload.plan || "Pro",
      searchAccuracy: payload.searchAccuracy,
      subscriptionStatus: "active",
    };
  } catch {
    return null;
  }
}

function markPayment(orderCode, status) {
  const payments = readPayments();
  const nextPayments = payments.map((payment) =>
    payment.orderCode === orderCode
      ? { ...payment, status, updatedAt: new Date().toISOString() }
      : payment,
  );
  writePayments(nextPayments);
}

function expireStalePayments() {
  const now = Date.now();
  const payments = readPayments();
  let changed = false;
  const nextPayments = payments.map((payment) => {
    if (payment.status !== "PENDING" && payment.status !== "PROCESSING") {
      return payment;
    }

    const expiresAt = payment.expiresAt
      ? new Date(payment.expiresAt).getTime()
      : new Date(payment.createdAt).getTime() +
        PAYMENT_PENDING_TTL_SECONDS * 1000;

    if (Number.isFinite(expiresAt) && expiresAt <= now) {
      changed = true;
      return {
        ...payment,
        status: "EXPIRED",
        expiresAt: new Date(expiresAt).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      ...payment,
      expiresAt: payment.expiresAt || new Date(expiresAt).toISOString(),
    };
  });

  if (changed) {
    writePayments(nextPayments);
  }

  return nextPayments;
}

function getPaymentsForAdmin() {
  return expireStalePayments();
}

function getPlanPriceLabel(payment) {
  return payment.billingCycle === "monthly" ? "$5 / month" : "$49 / year";
}

function mapPaymentForAdmin(payment) {
  const user = readUsers().find(
    (item) =>
      item.id === payment.userId ||
      item.email?.toLowerCase() === payment.email?.toLowerCase(),
  );
  return {
    orderCode: payment.orderCode,
    paymentLinkId: payment.paymentLinkId,
    checkoutUrl: payment.checkoutUrl,
    billingCycle: payment.billingCycle,
    plan: "Pro",
    priceLabel: getPlanPriceLabel(payment),
    status: payment.status || "PENDING",
    email: payment.email,
    userName: user?.name || payment.email,
    role: sanitizeUpgradeRole(payment.targetRole || user?.role),
    createdAt: payment.createdAt,
    expiresAt: payment.expiresAt,
    expiresInSeconds: payment.expiresAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(payment.expiresAt).getTime() - Date.now()) / 1000,
          ),
        )
      : 0,
    updatedAt: payment.updatedAt,
  };
}

function normalizeLocalPublicationSubmission(submission = {}) {
  const rawId = submission.id || submission.backendId || Date.now();
  const id = String(rawId).startsWith("local-submission-")
    ? String(rawId)
    : `local-submission-${rawId}`;
  const similarityPercent = Number(submission.similarityPercent || 0);
  const overLimit =
    submission.overLimit === true ||
    similarityPercent > 50 ||
    String(submission.status || "").toLowerCase() === "cancelled";

  return {
    id,
    backendId:
      submission.backendId ||
      (/^\d+$/.test(String(rawId)) ? String(rawId) : ""),
    title: String(submission.title || "").trim(),
    authors: String(submission.authors || submission.authorsText || "").trim(),
    submitter: String(
      submission.submitter ||
        submission.submitterEmail ||
        "researcher@local.test",
    ).trim(),
    submitterName: String(submission.submitterName || "").trim(),
    role: String(submission.role || submission.submitterRole || "Researcher"),
    keywords: String(
      submission.keywords || submission.keywordsText || "",
    ).trim(),
    abstract: String(submission.abstract || "").trim(),
    fileName: submission.fileName || "",
    submittedAt: submission.submittedAt || new Date().toISOString(),
    similarityPercent,
    matchedTitle: submission.matchedTitle || "No indexed match found",
    matchedSource: submission.matchedSource || "Google Scholar indexed record",
    matchedLink: submission.matchedLink || "",
    candidates: Array.isArray(submission.candidates)
      ? submission.candidates
      : [],
    status: String(
      submission.status || (overLimit ? "cancelled" : "pending"),
    ).toLowerCase(),
    decision:
      submission.decision ||
      (overLimit
        ? "Auto cancelled: over 50% similarity rule."
        : "Waiting for admin approval."),
    rejectedReason: submission.rejectedReason || "",
    rejectedEvidence: submission.rejectedEvidence || "",
    reviewedAt: submission.reviewedAt || "",
    publishedPublicationId: submission.publishedPublicationId || null,
  };
}

async function handleLocalPublicationSubmission(req, res) {
  const body = await readJsonBody(req);
  if (!body.title || !body.abstract || !body.authors || !body.keywords) {
    sendJson(res, 400, {
      error: "Title, authors, keywords, and abstract are required.",
    });
    return;
  }

  const submission = normalizeLocalPublicationSubmission(body);
  if (submission.similarityPercent > 50) {
    sendJson(res, 400, {
      error:
        "Submission blocked: similarity over 50% is not sent to Admin review.",
    });
    return;
  }

  const submissions = readPublicationSubmissions();
  const nextSubmissions = [
    submission,
    ...submissions.filter((item) => {
      const sameId = String(item.id) === String(submission.id);
      const sameBackendId =
        submission.backendId &&
        String(item.backendId || "") === String(submission.backendId);
      return !sameId && !sameBackendId;
    }),
  ];
  writePublicationSubmissions(nextSubmissions);
  sendJson(res, 200, { submission });
}

function handleLocalPublicationSubmissionDelete(res, id) {
  const normalizedId = decodeURIComponent(id);
  const submissions = readPublicationSubmissions();
  const nextSubmissions = submissions.filter(
    (item) =>
      String(item.id) !== normalizedId &&
      String(item.backendId || "") !== normalizedId,
  );
  writePublicationSubmissions(nextSubmissions);
  sendJson(res, 200, { ok: true });
}

function normalizeRecipientRole(role) {
  const value = String(role || "All")
    .trim()
    .toLowerCase();
  if (value === "all") return "All";
  if (value === "student") return "Student";
  if (value === "lecturer" || value === "lecture") return "Lecturer";
  if (value === "researcher") return "Researcher";
  if (value === "administrator" || value === "admin") return "Administrator";
  return "All";
}

function normalizeLocalNotification(notification = {}) {
  const recipientRole = normalizeRecipientRole(notification.recipientRole);
  return {
    id: String(
      notification.id || `notification-${Date.now()}-${crypto.randomUUID()}`,
    ),
    type: String(
      notification.type || notification.notificationType || "SYSTEM ALERT",
    ),
    title: String(notification.title || "NOTICE:"),
    text: String(notification.text || notification.message || "").trim(),
    recipientRole,
    recipientEmail: String(notification.recipientEmail || "")
      .trim()
      .toLowerCase(),
    route:
      notification.route ||
      (recipientRole === "Lecturer"
        ? "/lecturer-notifications"
        : recipientRole === "Researcher"
          ? "/researcher-notifications"
          : "/student-notifications"),
    createdAt: notification.createdAt || new Date().toISOString(),
    unread: notification.unread !== false,
  };
}

function notificationMatchesRecipient(notification, role, email) {
  const recipientEmail = String(
    notification.recipientEmail || "",
  ).toLowerCase();
  const currentEmail = String(email || "").toLowerCase();
  const recipientRole = normalizeRecipientRole(notification.recipientRole);
  const currentRole = normalizeRecipientRole(role);
  const emailMatches = Boolean(
    recipientEmail && currentEmail && recipientEmail === currentEmail,
  );
  const roleMatches = recipientRole === "All" || recipientRole === currentRole;

  if (recipientEmail && recipientRole === "All") {
    return emailMatches;
  }

  return emailMatches || roleMatches;
}

function getNotificationsForRecipient(role, email) {
  return readNotifications()
    .filter((notification) =>
      notificationMatchesRecipient(notification, role, email),
    )
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
}

async function handleLocalNotification(req, res) {
  const body = await readJsonBody(req);
  const notification = normalizeLocalNotification(body);
  if (!notification.text) {
    sendJson(res, 400, { error: "Notification content is required." });
    return;
  }

  const notifications = readNotifications();
  const nextNotifications = [
    notification,
    ...notifications.filter((item) => String(item.id) !== notification.id),
  ];
  writeNotifications(nextNotifications);
  sendJson(res, 200, { notification });
}

function handleLocalNotificationDelete(res, id) {
  const normalizedId = decodeURIComponent(id);
  const nextNotifications = readNotifications().filter(
    (notification) => String(notification.id) !== normalizedId,
  );
  writeNotifications(nextNotifications);
  sendJson(res, 200, { ok: true });
}

function handleLocalNotificationsReadAll(res) {
  const nextNotifications = readNotifications().map((notification) => ({
    ...notification,
    unread: false,
  }));
  writeNotifications(nextNotifications);
  sendJson(res, 200, { ok: true });
}

async function handleAdminVerifyPayment(req, res, orderCode) {
  if (!payos) {
    sendJson(res, 500, { error: "PayOS is not configured." });
    return;
  }

  const savedPayment = readPayments().find(
    (item) => item.orderCode === orderCode,
  );
  if (!savedPayment) {
    sendJson(res, 404, { error: "Payment not found." });
    return;
  }

  const payment = await payos.paymentRequests.get(orderCode);
  if (payment.status === "PAID") {
    await activateUserPro(savedPayment.email, {
      billingCycle: savedPayment.billingCycle,
      orderCode,
      paymentLinkId: savedPayment.paymentLinkId,
    });
  }
  markPayment(orderCode, payment.status);

  const nextPayment = readPayments().find(
    (item) => item.orderCode === orderCode,
  );
  sendJson(res, 200, { payment: mapPaymentForAdmin(nextPayment) });
}

async function handleAdminCancelPayment(req, res, orderCode) {
  if (!payos) {
    sendJson(res, 500, { error: "PayOS is not configured." });
    return;
  }

  const savedPayment = readPayments().find(
    (item) => item.orderCode === orderCode,
  );
  if (!savedPayment) {
    sendJson(res, 404, { error: "Payment not found." });
    return;
  }

  if (savedPayment.status === "PAID") {
    sendJson(res, 409, { error: "Paid payments cannot be cancelled." });
    return;
  }

  if (savedPayment.status === "CANCELLED") {
    sendJson(res, 200, { payment: mapPaymentForAdmin(savedPayment) });
    return;
  }

  if (savedPayment.status === "EXPIRED" || savedPayment.status === "FAILED") {
    markPayment(orderCode, "CANCELLED");
  } else {
    await payos.paymentRequests.cancel(orderCode, "Cancelled by admin");
    markPayment(orderCode, "CANCELLED");
  }

  const nextPayment = readPayments().find(
    (item) => item.orderCode === orderCode,
  );
  sendJson(res, 200, { payment: mapPaymentForAdmin(nextPayment) });
}

function mapUserForAdmin(user) {
  const enriched = enrichSessionUser(user);
  return {
    id: enriched.id,
    name: enriched.name,
    email: enriched.email,
    role: enriched.role,
    status: enriched.isActive === false ? "Inactive" : "Active",
    createdAt: enriched.createdAt,
    lastLoginAt: enriched.lastLoginAt,
    lastLogin: enriched.lastLoginAt || enriched.createdAt,
    isPro: enriched.isPro,
    plan: enriched.plan,
    subscriptionStatus: enriched.subscriptionStatus,
    subscriptionBillingCycle: enriched.subscriptionBillingCycle,
    subscriptionStartedAt: enriched.subscriptionStartedAt,
    subscriptionExpiresAt: enriched.subscriptionExpiresAt,
    subscriptionExpiredAt: enriched.subscriptionExpiredAt,
    searchAccuracy: enriched.searchAccuracy,
    provider: enriched.provider || "Local",
    updatedAt:
      enriched.updatedAt || enriched.lastLoginAt || enriched.createdAt,
    avatar: (enriched.name || "ST")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
}

async function handleAdminUpdatePro(req, res, userId) {
  const body = await readJsonBody(req);
  const users = readUsers();
  const targetIndex = users.findIndex((user) => String(user.id) === userId);
  if (targetIndex === -1) {
    sendJson(res, 404, { error: "User not found." });
    return;
  }

  const isPro = Boolean(body.isPro);
  const targetUser = users[targetIndex];
  users[targetIndex] = {
    ...targetUser,
    isPro,
    plan: isPro ? "Pro" : "Free",
    subscriptionStatus: isPro ? "active" : "free",
    subscriptionUpdatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeUsers(users);

  // Also sync to .NET backend if user has a numeric SQL id
  if (PAYMENT_SYNC_SECRET && /^\d+$/.test(String(targetUser.id || ""))) {
    try {
      await fetch(
        `${DOTNET_API_BASE_URL}/api/admin/users/${targetUser.id}/toggle-pro`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": PAYMENT_SYNC_SECRET,
          },
          body: JSON.stringify({ isPro }),
        },
      );
    } catch {
      // .NET sync is best-effort; users.json already updated
    }
  }

  sendJson(res, 200, { user: mapUserForAdmin(users[targetIndex]) });
}

async function handleAdminUpdateRole(req, res, userId) {
  const body = await readJsonBody(req);
  const users = readUsers();
  const targetIndex = users.findIndex((user) => String(user.id) === userId);
  if (targetIndex === -1) {
    sendJson(res, 404, { error: "User not found." });
    return;
  }

  const role = sanitizeRole(String(body.role || "Student"));
  const targetUser = users[targetIndex];
  users[targetIndex] = {
    ...targetUser,
    role,
    route: roleRoutes[role],
    updatedAt: new Date().toISOString(),
  };
  writeUsers(users);

  // Also sync to .NET backend if user has a numeric SQL id
  if (PAYMENT_SYNC_SECRET && /^\d+$/.test(String(targetUser.id || ""))) {
    try {
      await fetch(
        `${DOTNET_API_BASE_URL}/api/admin/users/${targetUser.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": PAYMENT_SYNC_SECRET,
          },
          body: JSON.stringify({ role }),
        },
      );
    } catch {
      // .NET sync is best-effort
    }
  }

  sendJson(res, 200, { user: mapUserForAdmin(users[targetIndex]) });
}

async function handleAdminDeleteUser(req, res, userId, requestUrl) {
  const users = readUsers();
  const decodedUserId = decodeURIComponent(String(userId || ""));
  const email = String(requestUrl.searchParams.get("email") || "")
    .trim()
    .toLowerCase();
  const targetIndex = users.findIndex((user) => {
    const userEmail = String(user.email || "").toLowerCase();
    return (
      String(user.id) === decodedUserId ||
      userEmail === decodedUserId.toLowerCase() ||
      (email && userEmail === email)
    );
  });

  let deletedUser = null;
  if (targetIndex >= 0) {
    [deletedUser] = users.splice(targetIndex, 1);
    writeUsers(users);
  }

  const sqlDeleteResult = await deleteDotnetAdminUser(decodedUserId, email);

  if (!deletedUser && !sqlDeleteResult) {
    sendJson(res, 200, {
      message: "User already deleted.",
      alreadyDeleted: true,
    });
    return;
  }

  sendJson(res, 200, {
    message: "User deleted.",
    user: deletedUser ? mapUserForAdmin(deletedUser) : sqlDeleteResult.user,
  });
}

async function deleteDotnetAdminUser(userId, email) {
  if (!PAYMENT_SYNC_SECRET) return null;

  const params = new URLSearchParams();
  if (/^\d+$/.test(String(userId || ""))) {
    params.set("id", String(userId));
  }
  if (email) {
    params.set("email", email);
  }
  if (!params.toString()) return null;

  const response = await fetch(
    `${DOTNET_API_BASE_URL}/api/admin/users/internal?${params.toString()}`,
    {
      method: "DELETE",
      headers: {
        "X-Internal-Secret": PAYMENT_SYNC_SECRET,
      },
    },
  );

  if (response.status === 404) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload?.message ||
        payload?.error ||
        "Could not delete user from SQL Server.",
    );
    error.statusCode = response.status;
    throw error;
  }
  return payload;
}

async function serveStaticApp(res, pathname) {
  const distDir = path.join(rootDir, "dist");
  const filePath = path.join(
    distDir,
    pathname === "/" ? "index.html" : pathname,
  );
  const safePath = path.normalize(filePath);
  const targetPath =
    safePath.startsWith(distDir) && fs.existsSync(safePath)
      ? safePath
      : path.join(distDir, "index.html");

  if (!fs.existsSync(targetPath)) {
    sendJson(res, 404, {
      error:
        "Frontend build not found. Run npm run build or use npm run dev in another terminal.",
    });
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
  };

  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
  });
  fs.createReadStream(targetPath).pipe(res);
}

async function proxyDotnetApi(req, res, requestUrl) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const targetUrl = `${DOTNET_API_BASE_URL}${requestUrl.pathname}${requestUrl.search}`;
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["transfer-encoding"];
  delete headers["content-length"];
  delete headers.expect;
  headers["x-forwarded-host"] = req.headers.host || "";
  headers["x-forwarded-proto"] = requestUrl.protocol.replace(":", "");
  const requestBody =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : Buffer.concat(chunks);
  if (requestBody) headers["content-length"] = String(requestBody.length);

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: requestBody,
  });

  const responseHeaders = {};
  upstream.headers.forEach((value, key) => {
    if (
      !["content-encoding", "transfer-encoding", "connection"].includes(key)
    ) {
      responseHeaders[key] = value;
    }
  });

  res.writeHead(upstream.status, responseHeaders);
  const arrayBuffer = await upstream.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
}
