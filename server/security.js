import crypto from "node:crypto";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function tokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    return "rajarani_super_secret_jwt_key_32chars_min_length_2026";
  }
  return secret;
}

function refreshTokenSecret() {
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    return "rajarani_super_secret_jwt_key_32chars_min_length_2026";
  }
  return secret;
}

const toBase64Url = (value) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value) => Buffer.from(value, "base64url").toString("utf8");

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`scrypt$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

export function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const [algorithm, salt, storedKey] = String(storedHash || "").split("$");
    if (algorithm !== "scrypt" || !salt || !storedKey) return resolve(false);
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      const expected = Buffer.from(storedKey, "hex");
      resolve(expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey));
    });
  });
}

export function issueAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user._id || user.id),
    role: user.role || "user",
    type: "access",
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
    jti: crypto.randomUUID(),
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", tokenSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function issueRefreshToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user._id || user.id),
    role: user.role || "user",
    type: "refresh",
    iat: now,
    exp: now + REFRESH_TOKEN_TTL_SECONDS,
    jti: crypto.randomUUID(),
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", refreshTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token) {
  try {
    const [encodedPayload, signature] = String(token || "").split(".");
    if (!encodedPayload || !signature) return null;
    const expected = crypto
      .createHmac("sha256", tokenSecret())
      .update(encodedPayload)
      .digest("base64url");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000) || payload.type !== "access") return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    const [encodedPayload, signature] = String(token || "").split(".");
    if (!encodedPayload || !signature) return null;
    const expected = crypto
      .createHmac("sha256", refreshTokenSecret())
      .update(encodedPayload)
      .digest("base64url");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000) || payload.type !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(request) {
  const header = request.headers.authorization;
  return typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : null;
}

export function requireAuth(request, response, next) {
  const identity = verifyAccessToken(getBearerToken(request));
  if (!identity) return response.status(401).json({ error: "Authentication required" });
  request.auth = identity;
  next();
}

export function optionalAuth(request, _response, next) {
  request.auth = verifyAccessToken(getBearerToken(request));
  next();
}

export function createPlayerToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function tokensMatch(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
