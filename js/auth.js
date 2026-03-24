import { APP_CONFIG } from "./config.js";

const AUTH = APP_CONFIG.auth;
const ALLOWED_NEXT_PAGES = new Set(["index.html", "about.html", "library.html", "viewer.html"]);
const ACCESS_MARKER = `arthea::${AUTH.version}::${AUTH.passwordHash.slice(0, 16)}`;

function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto indisponible dans ce navigateur.");
  }
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function writeStorage(storage, key, payload) {
  try {
    storage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore quota errors or private mode restrictions.
  }
}

function readStorage(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStorage(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}

function isPayloadValid(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  if (!constantTimeEqual(String(payload.marker || ""), ACCESS_MARKER)) {
    return false;
  }
  if (payload.expiresAt && Number.isFinite(payload.expiresAt) && Date.now() > payload.expiresAt) {
    return false;
  }
  return true;
}

function buildPayload(remember) {
  const payload = {
    marker: ACCESS_MARKER,
    issuedAt: Date.now(),
    version: AUTH.version,
  };

  if (remember) {
    payload.expiresAt = Date.now() + AUTH.persistentDays * 24 * 60 * 60 * 1000;
  }

  return payload;
}

export async function verifyPassword(plainPassword) {
  const candidateHash = await sha256Hex(String(plainPassword || "").trim());
  return constantTimeEqual(candidateHash, AUTH.passwordHash);
}

export function grantAccess({ remember = false } = {}) {
  const payload = buildPayload(remember);
  writeStorage(sessionStorage, AUTH.sessionKey, payload);
  if (remember) {
    writeStorage(localStorage, AUTH.persistentKey, payload);
  } else {
    clearStorage(localStorage, AUTH.persistentKey);
  }
}

export function clearAccess() {
  clearStorage(sessionStorage, AUTH.sessionKey);
  clearStorage(localStorage, AUTH.persistentKey);
}

export function hasAccess() {
  const sessionPayload = readStorage(sessionStorage, AUTH.sessionKey);
  if (isPayloadValid(sessionPayload)) {
    return true;
  }

  const persistentPayload = readStorage(localStorage, AUTH.persistentKey);
  if (isPayloadValid(persistentPayload)) {
    writeStorage(sessionStorage, AUTH.sessionKey, persistentPayload);
    return true;
  }

  clearAccess();
  return false;
}

export function sanitizeNext(rawNext) {
  if (!rawNext) {
    return "library.html";
  }

  const next = String(rawNext).trim();
  if (!next || next.includes("://") || next.startsWith("//")) {
    return "library.html";
  }

  const [pathPart, queryPart] = next.split("?");
  const fileName = pathPart.split("/").pop();
  if (!fileName || !ALLOWED_NEXT_PAGES.has(fileName)) {
    return "library.html";
  }

  if (fileName !== "viewer.html") {
    return fileName;
  }

  const query = queryPart ? queryPart.slice(0, 180) : "";
  return query ? `${fileName}?${query}` : fileName;
}

export function getCurrentPageWithQuery() {
  const fileName = window.location.pathname.split("/").pop() || "library.html";
  return `${fileName}${window.location.search || ""}`;
}

export function buildLoginUrl(nextPage) {
  const safeNext = sanitizeNext(nextPage);
  return `./login.html?next=${encodeURIComponent(safeNext)}`;
}
