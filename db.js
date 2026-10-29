// db.js — SQLite database connection and schema bootstrap
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "voyago.sqlite");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ----- Schema -----
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS destinations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  country         TEXT NOT NULL,
  category        TEXT NOT NULL,
  price_per_person REAL NOT NULL,
  duration_days   INTEGER NOT NULL,
  rating          REAL NOT NULL DEFAULT 4.5,
  description     TEXT NOT NULL,
  highlights      TEXT NOT NULL DEFAULT '[]',
  image_seed      TEXT NOT NULL,
  image_hue       TEXT NOT NULL DEFAULT 'teal'
);

CREATE TABLE IF NOT EXISTS bookings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id  INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  travel_date     TEXT NOT NULL,
  travelers       INTEGER NOT NULL DEFAULT 1,
  total_price     REAL NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;
