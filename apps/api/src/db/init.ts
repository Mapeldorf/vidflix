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
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id       INTEGER NOT NULL,
    title         TEXT NOT NULL,
    overview      TEXT DEFAULT '',
    poster_path   TEXT DEFAULT '',
    backdrop_path TEXT DEFAULT '',
    release_date  TEXT DEFAULT '',
    vote_average  REAL DEFAULT 0,
    runtime       INTEGER DEFAULT 0,
    genres        TEXT DEFAULT '[]',
    magnet_link   TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, tmdb_id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    last_login    TEXT,
    is_active     INTEGER DEFAULT 1
  );
`);

// Migration: add user_id to movies if the table was created with the old schema
const movieColumns = db.pragma('table_info(movies)') as Array<{ name: string }>;
if (!movieColumns.some((c) => c.name === 'user_id')) {
  console.log('Migrando tabla movies: añadiendo user_id (películas anteriores se eliminan)...');
  db.exec(`
    CREATE TABLE movies_v2 (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tmdb_id       INTEGER NOT NULL,
      title         TEXT NOT NULL,
      overview      TEXT DEFAULT '',
      poster_path   TEXT DEFAULT '',
      backdrop_path TEXT DEFAULT '',
      release_date  TEXT DEFAULT '',
      vote_average  REAL DEFAULT 0,
      runtime       INTEGER DEFAULT 0,
      genres        TEXT DEFAULT '[]',
      magnet_link   TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, tmdb_id)
    );
    DROP TABLE movies;
    ALTER TABLE movies_v2 RENAME TO movies;
  `);
  console.log('Migración movies completada.');
}

// Migration: drop email column if the table was created with the old schema
const userColumns = db.pragma('table_info(users)') as Array<{ name: string }>;
if (userColumns.some((c) => c.name === 'email')) {
  console.log('Migrando tabla users: eliminando columna email...');
  db.exec(`
    CREATE TABLE users_v2 (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      last_login    TEXT,
      is_active     INTEGER DEFAULT 1
    );
    INSERT INTO users_v2 (id, username, password_hash, created_at, last_login, is_active)
      SELECT id, username, password_hash, created_at, last_login, is_active FROM users;
    DROP TABLE users;
    ALTER TABLE users_v2 RENAME TO users;
  `);
  console.log('Migración completada.');
}

// Migration: add progress_seconds column if missing
const movieColumnsV2 = db.pragma('table_info(movies)') as Array<{ name: string }>;
if (!movieColumnsV2.some((c) => c.name === 'progress_seconds')) {
  db.exec('ALTER TABLE movies ADD COLUMN progress_seconds INTEGER DEFAULT 0');
  console.log('Migración movies: añadida columna progress_seconds.');
}

console.log(`SQLite database initialized at: ${dbPath}`);
