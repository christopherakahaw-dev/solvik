/**
 * db.js — SQLite singleton for FlowGuard auth.
 *
 * Initialises the database file at data/users.db (relative to the project
 * root) on first import and runs the schema migration if the table doesn't
 * exist yet. Every serverless function imports this module and gets the same
 * prepared-statement-ready `db` object.
 */

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

// Resolve to <project-root>/data/users.db regardless of where Node is invoked
// from. Works in both Vite's SSR middleware and a real Vercel serverless env.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../../data/users.db");

// Ensure the data directory exists (not tracked in git, so it may be absent).
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL for concurrent reads alongside writes.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Schema — idempotent: only runs on first launch or after a wipe.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           TEXT    PRIMARY KEY,
    email        TEXT    UNIQUE NOT NULL,
    name         TEXT    NOT NULL DEFAULT '',
    password     TEXT    NOT NULL,
    preferences  TEXT    NOT NULL DEFAULT '{}',
    created_at   INTEGER NOT NULL
  );
`);

export default db;
