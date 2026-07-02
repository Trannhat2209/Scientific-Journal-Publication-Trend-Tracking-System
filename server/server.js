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

const roleRoutes = {
  Researcher: "/researcher-dashboard",
  Lecturer: "/lecturer-dashboard",
  Student: "/student-dashboard",
  Administrator: "/admin-dashboard",
};

const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const paymentsFile = path.join(dataDir, "payments.json");

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
      const { url, stateToken } = createGoogleAuthUrl(requestUrl);
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
      const { url, stateToken } = createGoogleAuthUrl(requestUrl);
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

    if (requestUrl.pathname === "/api/auth/me") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { authenticated: false });
        return;
      }
      const enrichedUser = enrichSessionUser(session.user);
      const syncedUser = await syncDotnetExternalUser(enrichedUser);
      const user = syncedUser
        ? applyDotnetUserSync(enrichedUser, syncedUser)
        : enrichedUser;
      sendJson(res, 200, {
        authenticated: true,
        user,
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
      sendJson(res, 200, { items: readUsers().map(mapUserForAdmin) });
      return;
    }

    if (requestUrl.pathname === "/api/admin/payments" && req.method === "GET") {
      sendJson(res, 200, { items: getPaymentsForAdmin().map(mapPaymentForAdmin) });
      return;
    }

    const adminPaymentVerifyMatch = requestUrl.pathname.match(
      /^\/api\/admin\/payments\/(\d+)\/verify$/,
    );
    if (adminPaymentVerifyMatch && req.method === "POST") {
      await handleAdminVerifyPayment(req, res, Number(adminPaymentVerifyMatch[1]));
      return;
    }

    const adminPaymentCancelMatch = requestUrl.pathname.match(
      /^\/api\/admin\/payments\/(\d+)\/cancel$/,
    );
    if (adminPaymentCancelMatch && req.method === "POST") {
      await handleAdminCancelPayment(req, res, Number(adminPaymentCancelMatch[1]));
      return;
    }

    const adminProMatch = requestUrl.pathname.match(
      /^\/api\/admin\/users\/([^/]+)\/pro$/,
    );
    if (adminProMatch && req.method === "PUT") {
      await handleAdminUpdatePro(req, res, adminProMatch[1]);
      return;
    }

    await serveStaticApp(res, requestUrl.pathname);
  } catch (error) {
    const status = error.statusCode || 500;
    sendJson(res, status, {
      error:
        status >= 500
          ? "Authentication server error."
          : error.message || "Request failed.",
    });
  }
});

server.listen(API_PORT, () => {
  console.log(`ScholarTrend API running at http://localhost:${API_PORT}`);
  console.log(`Google callback: ${GOOGLE_REDIRECT_URI}`);
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
  if (origin && origin === FRONTEND_URL) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

function createGoogleAuthUrl(requestUrl) {
  const role = sanitizeRole(requestUrl.searchParams.get("role"));
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"));
  const stateToken = signToken({
    purpose: "google-oauth",
    nonce: crypto.randomBytes(16).toString("base64url"),
    role,
    returnTo,
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
  return allowedRoles.has(role) ? role : "Researcher";
}

function sanitizeReturnTo(returnTo) {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/login";
  }
  return returnTo;
}

async function handleGoogleCallback(req, res, requestUrl) {
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookies = parseCookies(req);
  const savedState = cookies.scholartrend_oauth_state;

  try {
    if (!code) {
      throw new Error("Google did not return an authorization code.");
    }

    if (!state || !savedState || state !== savedState) {
      throw new Error("OAuth state validation failed.");
    }

    const statePayload = verifyToken(state, "google-oauth");
    const tokenSet = await exchangeCodeForTokens(code);
    const googleUser = await fetchGoogleUser(tokenSet);
    const localUser = upsertUser(googleUser, statePayload.role);
    const syncedUser = await syncDotnetExternalUser(localUser);
    const user = syncedUser
      ? applyDotnetUserSync(localUser, syncedUser)
      : localUser;
    const sessionToken = signToken({
      purpose: "session",
      user,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    });

    redirect(res, `${FRONTEND_URL}/login?auth=google-success`, {
      "Set-Cookie": [
        buildCookie("scholartrend_session", sessionToken, {
          maxAge: 60 * 60 * 24 * 7,
        }),
        buildCookie("scholartrend_oauth_state", "", { maxAge: 0 }),
      ],
    });
  } catch (error) {
    redirect(
      res,
      `${FRONTEND_URL}/login?auth=google-error&message=${encodeURIComponent(
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
    throw new Error(tokenInfo.error_description || "Google ID token is invalid.");
  }

  if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("Google ID token audience does not match this app.");
  }

  if (tokenInfo.email_verified !== "true" && tokenInfo.email_verified !== true) {
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
  fs.mkdirSync(dataDir, { recursive: true });
  const users = readUsers();
  const now = new Date().toISOString();
  const email = googleUser.email.toLowerCase();
  const existingIndex = users.findIndex((user) => user.email === email);
  const existingUser = existingIndex >= 0 ? users[existingIndex] : {};
  const user = {
    ...existingUser,
    id: existingUser.id || crypto.randomUUID(),
    email,
    name: googleUser.name,
    picture: googleUser.picture,
    role,
    route: roleRoutes[role],
    provider: "Google",
    googleId: googleUser.googleId,
    emailVerified: googleUser.emailVerified,
    createdAt: existingUser.createdAt || now,
    lastLoginAt: now,
    isPro: Boolean(existingUser.isPro),
    plan: existingUser.plan || "Free",
    subscriptionStatus: existingUser.subscriptionStatus || "free",
  };

  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }

  fs.writeFileSync(usersFile, `${JSON.stringify(users, null, 2)}\n`);
  return user;
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
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
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

function getAccuracyForUser(user) {
  const role = sanitizeRole(user?.role);
  const freeAccuracy = { Student: 15, Lecturer: 20, Researcher: 25 };
  const proAccuracy = { Student: 35, Lecturer: 40, Researcher: 45 };
  if (role === "Administrator") return 100;
  return (user?.isPro ? proAccuracy : freeAccuracy)[role] ?? freeAccuracy.Researcher;
}

function enrichSessionUser(user) {
  if (!user) return user;
  const savedUser = readUsers().find(
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

  const users = readUsers();
  const email = user.email.toLowerCase();
  const targetIndex = users.findIndex((item) => item.email === email);
  const role = normalizeDotnetRole(sqlUser.role || user.role);
  const nextUser = {
    ...(targetIndex >= 0 ? users[targetIndex] : user),
    ...user,
    id: sqlUser.id,
    email,
    name: sqlUser.name || sqlUser.fullName || user.name || email,
    role,
    route: roleRoutes[role],
    isPro: Boolean(sqlUser.isPro || user.isPro),
    plan: sqlUser.plan || user.plan || "Free",
    subscriptionStatus:
      sqlUser.subscriptionStatus ||
      user.subscriptionStatus ||
      (sqlUser.isPro || user.isPro ? "active" : "free"),
    searchAccuracy: sqlUser.searchAccuracy || user.searchAccuracy,
  };

  if (targetIndex >= 0) {
    users[targetIndex] = nextUser;
  } else {
    users.push(nextUser);
  }
  writeUsers(users);
  return nextUser;
}

async function syncDotnetExternalUser(user) {
  if (!PAYMENT_SYNC_SECRET || !user?.email) return null;

  try {
    const response = await fetch(`${DOTNET_API_BASE_URL}/api/admin/users/sync-external`, {
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
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.user || payload;
  } catch {
    return null;
  }
}

function resolveRequestUser(req, body = {}) {
  const sessionUser = getSession(req)?.user;
  const bodyUser = body.user || {};
  const candidate = sessionUser || bodyUser;
  const email = String(candidate.email || "").trim().toLowerCase();
  if (!email) return null;

  const role = sanitizeRole(candidate.role || "Researcher");
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
  const amount =
    billingCycle === "monthly" ? PAYOS_MONTHLY_AMOUNT : PAYOS_YEARLY_AMOUNT;
  const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12));
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
        name: `ScholarTrend Pro ${billingCycle}`,
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
  const savedPayment = readPayments().find((item) => item.orderCode === orderCode);
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
  const orderCode = Number(webhookData?.orderCode || webhookData?.data?.orderCode);
  const savedPayment = readPayments().find((item) => item.orderCode === orderCode);

  if (savedPayment && webhookData?.code === "00") {
    await activateUserPro(savedPayment.email, {
      billingCycle: savedPayment.billingCycle,
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
  const nextUser = {
    ...currentUser,
    isPro: true,
    plan: "Pro",
    subscriptionStatus: "active",
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
    const response = await fetch(`${DOTNET_API_BASE_URL}/api/payments/payos/activate-pro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": PAYMENT_SYNC_SECRET,
      },
      body: JSON.stringify({
        email,
        billingCycle: paymentMeta.billingCycle || "",
        orderCode: Number(paymentMeta.orderCode || 0),
        paymentLinkId: paymentMeta.paymentLinkId || "",
      }),
    });
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
  return payment.billingCycle === "monthly"
    ? "$5 / month"
    : "$49 / year";
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
    role: user?.role || "Researcher",
    createdAt: payment.createdAt,
    expiresAt: payment.expiresAt,
    expiresInSeconds: payment.expiresAt
      ? Math.max(0, Math.floor((new Date(payment.expiresAt).getTime() - Date.now()) / 1000))
      : 0,
    updatedAt: payment.updatedAt,
  };
}

async function handleAdminVerifyPayment(req, res, orderCode) {
  if (!payos) {
    sendJson(res, 500, { error: "PayOS is not configured." });
    return;
  }

  const savedPayment = readPayments().find((item) => item.orderCode === orderCode);
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

  const nextPayment = readPayments().find((item) => item.orderCode === orderCode);
  sendJson(res, 200, { payment: mapPaymentForAdmin(nextPayment) });
}

async function handleAdminCancelPayment(req, res, orderCode) {
  if (!payos) {
    sendJson(res, 500, { error: "PayOS is not configured." });
    return;
  }

  const savedPayment = readPayments().find((item) => item.orderCode === orderCode);
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

  const nextPayment = readPayments().find((item) => item.orderCode === orderCode);
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
    searchAccuracy: enriched.searchAccuracy,
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
  users[targetIndex] = {
    ...users[targetIndex],
    isPro,
    plan: isPro ? "Pro" : "Free",
    subscriptionStatus: isPro ? "active" : "free",
    subscriptionUpdatedAt: new Date().toISOString(),
  };
  writeUsers(users);
  sendJson(res, 200, { user: mapUserForAdmin(users[targetIndex]) });
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
