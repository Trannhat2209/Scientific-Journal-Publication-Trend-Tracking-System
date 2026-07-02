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
const APP_SESSION_SECRET =
  process.env.APP_SESSION_SECRET || "scholartrend-dev-session-secret";
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
      const enrichedUser = session.user;
      
      const DOTNET_API_BASE_URL = process.env.DOTNET_API_BASE_URL || "http://localhost:5227";
      const PAYMENT_SYNC_SECRET = process.env.PAYMENT_SYNC_SECRET || "dev-payment-sync-secret";
      
      let dotnetTokens = null;
      try {
        const syncResponse = await fetch(`${DOTNET_API_BASE_URL}/api/admin/users/sync-external`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": PAYMENT_SYNC_SECRET,
          },
          body: JSON.stringify({
            fullName: enrichedUser.name || enrichedUser.fullName || enrichedUser.email,
            email: enrichedUser.email,
            role: enrichedUser.role,
            provider: enrichedUser.provider || "Google",
            externalId: enrichedUser.googleId || enrichedUser.id || "",
            isPro: Boolean(enrichedUser.isPro),
            plan: enrichedUser.plan || "Free",
          }),
        });
        if (syncResponse.ok) {
          dotnetTokens = await syncResponse.json();
        }
      } catch (err) {
        console.error("Failed to sync with dotnet backend in /api/auth/me:", err.message);
      }

      sendJson(res, 200, {
        authenticated: true,
        user: dotnetTokens?.user || enrichedUser,
        accessToken: dotnetTokens?.accessToken || session.accessToken || "",
        refreshToken: dotnetTokens?.refreshToken || session.refreshToken || "",
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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
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
    const user = upsertUser(googleUser, statePayload.role);

    const DOTNET_API_BASE_URL = process.env.DOTNET_API_BASE_URL || "http://localhost:5227";
    const PAYMENT_SYNC_SECRET = process.env.PAYMENT_SYNC_SECRET || "dev-payment-sync-secret";
    
    let dotnetTokens = null;
    try {
      const syncResponse = await fetch(`${DOTNET_API_BASE_URL}/api/admin/users/sync-external`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": PAYMENT_SYNC_SECRET,
        },
        body: JSON.stringify({
          fullName: user.name || user.fullName || user.email,
          email: user.email,
          role: user.role,
          provider: "Google",
          externalId: user.googleId || user.id || "",
          isPro: Boolean(user.isPro),
          plan: user.plan || "Free",
        }),
      });
      if (syncResponse.ok) {
        dotnetTokens = await syncResponse.json();
      }
    } catch (err) {
      console.error("Failed to sync with dotnet backend in google callback:", err.message);
    }

    const sessionToken = signToken({
      purpose: "session",
      user: dotnetTokens?.user || user,
      accessToken: dotnetTokens?.accessToken || "",
      refreshToken: dotnetTokens?.refreshToken || "",
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
  };

  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }

  fs.writeFileSync(usersFile, `${JSON.stringify(users, null, 2)}\n`);
  return user;
}

function readUsers() {
  if (!fs.existsSync(usersFile)) return [];

  try {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch {
    return [];
  }
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
