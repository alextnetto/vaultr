import initSqlJs from "sql.js";
import type { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "vaultr.db");

let dbPromise: Promise<SqlJsDatabase> | null = null;

function initDb(): Promise<SqlJsDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const SQL = await initSqlJs();
    let data: Buffer | undefined;
    try {
      data = fs.readFileSync(DB_PATH);
    } catch {}
    const db = new SQL.Database(data);
    db.run(`
      CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        encrypted_data TEXT NOT NULL,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        password_hash TEXT,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        view_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        share_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE
      )
    `);
    return db;
  })();
  return dbPromise;
}

function persist(db: SqlJsDatabase) {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function getDb() {
  return initDb();
}

export function saveDb(db: SqlJsDatabase) {
  persist(db);
}

export interface ShareRow {
  id: string;
  encrypted_data: string;
  iv: string;
  auth_tag: string;
  password_hash: string | null;
  expires_at: number;
  created_at: number;
  view_count: number;
}

export interface FileRow {
  id: string;
  share_id: string;
  filename: string;
  mimetype: string;
  data: string;
}

// Helper to get a single row from sql.js
export function getOne<T>(db: SqlJsDatabase, sql: string, params: unknown[] = []): T | undefined {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const row: Record<string, unknown> = {};
    cols.forEach((c, i) => (row[c] = vals[i]));
    stmt.free();
    return row as T;
  }
  stmt.free();
  return undefined;
}

export function getAll<T>(db: SqlJsDatabase, sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const row: Record<string, unknown> = {};
    cols.forEach((c, i) => (row[c] = vals[i]));
    results.push(row as T);
  }
  stmt.free();
  return results;
}
