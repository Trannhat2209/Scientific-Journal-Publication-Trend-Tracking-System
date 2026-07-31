import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const INSTITUTION_OIDC_AUTHORITY = INSTITUTION_OIDC_ISSUER.replace(
  /\/v2\.0$/i,
  "",
);
const APP_SESSION_SECRET =
  process.env.APP_SESSION_SECRET || "scholartrend-dev-session-secret";
const INTERNAL_SYNC_SECRET = process.env.INTERNAL_SYNC_SECRET || "";
const DOTNET_API_BASE_URL = trimTrailingSlash(
  process.env.DOTNET_API_BASE_URL || "http://localhost:5227",
);
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
const notificationsFile = path.join(dataDir, "notifications.json");


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

    if (requestUrl.pathname === "/api/auth/institution/callback") {
      await handleInstitutionCallback(req, res, requestUrl);
      return;
    }

    // SQL/.NET is the single source of truth. Node only owns the Google OAuth
    // handshake and its short-lived signed cookie; legacy user routes
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
      requestUrl.pathname.startsWith("/api/admin/users")
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

      if (
        targetUser.verificationStatus !== "pending" ||
        targetUser.requestedRole !== role
      ) {
        sendJson(res, 409, {
          error:
            "A role can only be changed after matching academic identity evidence is submitted.",
        });
        return;
      }

      targetUser.role = role;
      targetUser.route = roleRoutes[role] || "/student-dashboard";
      targetUser.requestedRole = null;
      targetUser.verificationStatus = "verified";
      targetUser.verificationReviewedAt = new Date().toISOString();
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
        verificationStatus:
          ["pending", "verified", "rejected"].includes(body.verificationStatus)
            ? body.verificationStatus
            : current.verificationStatus || "not_submitted",
        verificationReviewedAt:
          body.verificationStatus &&
          body.verificationStatus !== current.verificationStatus
            ? new Date().toISOString()
            : current.verificationReviewedAt || "",
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
  const requestedRole = sanitizeRole(String(body.role || "Student"));
  const role = adminManagedRoles.has(requestedRole)
    ? requestedRole
    : "Student";

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
    role,
    route: roleRoutes[role],
    provider: "Local",
    createdAt: now,
    lastLoginAt: "",
    isActive: true,
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
          ? "This account is currently a Student account. Submit a role-change request and academic identity evidence for Admin approval."
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
  const role = enforceAccountRole(user.role);
  return {
    id: user.id,
    email: user.email,
    fullName: user.name || user.fullName || user.email,
    institution: user.institution || "",
    department: user.department || "",
    avatarUrl: user.avatarUrl || user.picture || "",
    academicIdentity: user.academicIdentity || {},
    verificationStatus: user.verificationStatus || "not_submitted",
    verificationReviewedAt: user.verificationReviewedAt || "",
    role,
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
    academicIdentity: body.academicIdentity
      ? {
          institution: String(body.academicIdentity.institution || "").trim().slice(0, 160),
          department: String(body.academicIdentity.department || "").trim().slice(0, 160),
          institutionalEmail: String(body.academicIdentity.institutionalEmail || "").trim().toLowerCase().slice(0, 160),
          identifier: String(body.academicIdentity.identifier || "").trim().slice(0, 100),
          programOrField: String(body.academicIdentity.programOrField || "").trim().slice(0, 160),
          evidenceUrl: String(body.academicIdentity.evidenceUrl || "").trim().slice(0, 500),
        }
      : currentUser.academicIdentity || {},
    verificationStatus: body.academicIdentity
      ? "pending"
      : currentUser.verificationStatus || "not_submitted",
    verificationSubmittedAt: body.academicIdentity
      ? new Date().toISOString()
      : currentUser.verificationSubmittedAt || "",
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

function enforceAccountRole(role) {
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
          ? "This Google account is currently a Student account. Submit a role-change request and academic identity evidence for Admin approval."
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
  };
}

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function writeUsers(users) {
  ensureDataDir();
  fs.writeFileSync(usersFile, `${JSON.stringify(users, null, 2)}\n`);
}

function readUsers() {
  if (!fs.existsSync(usersFile)) return [];
  try {
    const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
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

function enrichSessionUser(user) {
  if (!user) return user;
  const savedUser = user.provider === "Google" ? null : readUsers().find(
    (item) => item.id === user.id || item.email?.toLowerCase() === user.email?.toLowerCase(),
  );
  return { ...user, ...(savedUser || {}), searchAccuracy: 100 };
}

function normalizeDotnetRole(role) {
  return role === "Admin" ? "Administrator" : sanitizeRole(role);
}

function applyDotnetUserSync(user, sqlUser) {
  if (!sqlUser?.id || !user?.email) return user;
  const role = enforceAccountRole(normalizeDotnetRole(sqlUser.role || user.role));
  return { ...user, id: sqlUser.id, email: user.email.toLowerCase(), name: sqlUser.name || sqlUser.fullName || user.name || user.email, role, route: roleRoutes[role], searchAccuracy: 100 };
}

async function syncDotnetExternalUser(user, includeAuth = false) {
  if (!INTERNAL_SYNC_SECRET || !user?.email) return null;

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
          "X-Internal-Secret": INTERNAL_SYNC_SECRET,
        },
        body: JSON.stringify({
          fullName: user.name || user.fullName || user.email,
          email: user.email,
          role: user.role,
          provider: user.provider || "Google",
          externalId: user.googleId || user.id || "",
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
  if (!INTERNAL_SYNC_SECRET || !email) return null;

  try {
    const params = new URLSearchParams({ email });
    const response = await fetch(
      `${DOTNET_API_BASE_URL}/api/admin/users/internal?${params.toString()}`,
      {
        headers: {
          "X-Internal-Secret": INTERNAL_SYNC_SECRET,
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
    searchAccuracy: enriched.searchAccuracy,
    provider: enriched.provider || "Local",
    academicIdentity: enriched.academicIdentity || {},
    verificationStatus: enriched.verificationStatus || "not_submitted",
    verificationSubmittedAt: enriched.verificationSubmittedAt || "",
    verificationReviewedAt: enriched.verificationReviewedAt || "",
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
  if (INTERNAL_SYNC_SECRET && /^\d+$/.test(String(targetUser.id || ""))) {
    try {
      await fetch(
        `${DOTNET_API_BASE_URL}/api/admin/users/${targetUser.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": INTERNAL_SYNC_SECRET,
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
  if (!INTERNAL_SYNC_SECRET) return null;

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
        "X-Internal-Secret": INTERNAL_SYNC_SECRET,
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
