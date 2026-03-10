import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath =
  process.env['DB_PATH'] || path.join(process.cwd(), 'data', 'vidflix.db');

// Ensure the data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id       INTEGER UNIQUE NOT NULL,
    title         TEXT NOT NULL,
    overview      TEXT DEFAULT '',
    poster_path   TEXT DEFAULT '',
    backdrop_path TEXT DEFAULT '',
    release_date  TEXT DEFAULT '',
    vote_average  REAL DEFAULT 0,
    runtime       INTEGER DEFAULT 0,
    genres        TEXT DEFAULT '[]',
    magnet_link   TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  )
`);

console.log(`SQLite database initialized at: ${dbPath}`);
