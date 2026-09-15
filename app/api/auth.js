/**
 * api/auth.js — FlowGuard authentication serverless function.
 *
 * Handles all auth actions via query string:
 *   GET  /api/auth?action=me            — return the current session user
 *   POST /api/auth?action=register      — create a new account
 *   POST /api/auth?action=login         — sign in
 *   POST /api/auth?action=logout        — clear session cookie
 *   POST /api/auth?action=update-profile — save preferences / name
 *
 * Sessions are JWT tokens stored in an HttpOnly cookie named `fg_token`.
 * Passwords are hashed with bcrypt (12 rounds).
 */

import db from "./_lib/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "flowguard-dev-secret-change-in-prod";
const COOKIE_NAME = "fg_token";
const COOKIE_OPTS = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;

function cookieHeader(token) {
  return `${COOKIE_NAME}=${token}; ${COOKIE_OPTS}`;
}

function clearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Parse a cookie string into a plain object. */
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k.trim()] = rest.join("=").trim();
  }
  return out;
}

/** Sign a JWT for the given user row. */
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
}

/** Verify the JWT from the request cookie and return the payload, or null. */
function getSession(req) {
  const cookies = parseCookies(req.headers && req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Read the request body as JSON (handles both streaming and buffered bodies). */
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

/** Sanitise a user row for the client — never include the password hash. */
function safeUser(row) {
  if (!row) return null;
  let prefs = {};
  try { prefs = JSON.parse(row.preferences || "{}"); } catch { /* ignore */ }
  return { id: row.id, email: row.email, name: row.name, preferences: prefs };
}

// ─── Action handlers ──────────────────────────────────────────────────────────

async function handleMe(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Not signed in" });

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(session.sub);
  if (!row) return res.status(401).json({ error: "User not found" });

  return res.status(200).json({ user: safeUser(row) });
}

async function handleRegister(req, res) {
  const { name = "", email = "", password = "" } = await readBody(req);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const hash = await bcrypt.hash(password, 12);
  const id = uuidv4();
  db.prepare(
    "INSERT INTO users (id, email, name, password, preferences, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, email.toLowerCase(), name.trim(), hash, "{}", Date.now());

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  const token = signToken(row);

  res.setHeader("Set-Cookie", cookieHeader(token));
  return res.status(201).json({ user: safeUser(row) });
}

async function handleLogin(req, res) {
  const { email = "", password = "" } = await readBody(req);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!row) {
    return res.status(401).json({ error: "No account found with that email." });
  }

  const ok = await bcrypt.compare(password, row.password);
  if (!ok) {
    return res.status(401).json({ error: "Incorrect password. Please try again." });
  }

  const token = signToken(row);
  res.setHeader("Set-Cookie", cookieHeader(token));
  return res.status(200).json({ user: safeUser(row) });
}

async function handleLogout(req, res) {
  res.setHeader("Set-Cookie", clearCookieHeader());
  return res.status(200).json({ ok: true });
}

async function handleUpdateProfile(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Not signed in" });

  const { name, preferences } = await readBody(req);

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(session.sub);
  if (!row) return res.status(401).json({ error: "User not found" });

  let existingPrefs = {};
  try { existingPrefs = JSON.parse(row.preferences || "{}"); } catch { /* ignore */ }

  const newPrefs = preferences != null
    ? { ...existingPrefs, ...preferences }
    : existingPrefs;

  db.prepare("UPDATE users SET name = ?, preferences = ? WHERE id = ?").run(
    name != null ? name.trim() : row.name,
    JSON.stringify(newPrefs),
    session.sub
  );

  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(session.sub);
  return res.status(200).json({ user: safeUser(updated) });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow the browser to send cookies from the same origin.
  res.setHeader("Access-Control-Allow-Credentials", "true");

  const action = (req.query && req.query.action) || "";

  switch (action) {
    case "me":             return handleMe(req, res);
    case "register":       return handleRegister(req, res);
    case "login":          return handleLogin(req, res);
    case "logout":         return handleLogout(req, res);
    case "update-profile": return handleUpdateProfile(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: "${action}"` });
  }
}
