import { env } from "cloudflare:workers";

export type CmsEnv = {
  DB: D1Database;
  FILES: R2Bucket;
};

let schemaReady: Promise<void> | null = null;

export function getBindings(): CmsEnv {
  const bindings = env as unknown as Partial<CmsEnv>;
  if (!bindings.DB) {
    throw new Error("The CMS database binding is unavailable.");
  }
  if (!bindings.FILES) {
    throw new Error("The CMS file-storage binding is unavailable.");
  }
  return bindings as CmsEnv;
}

export async function getDatabase(): Promise<D1Database> {
  const { DB } = getBindings();
  schemaReady ??= initializeSchema(DB);
  await schemaReady;
  return DB;
}

async function initializeSchema(database: D1Database): Promise<void> {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Community',
      tags TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      featured_image_url TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'Positive Legacy Solutions',
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS posts_status_published_idx ON posts(status, published_at DESC)",
    ),
    database.prepare(`CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      filename TEXT NOT NULL,
      object_key TEXT NOT NULL UNIQUE,
      content_type TEXT NOT NULL DEFAULT 'application/pdf',
      size INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS documents_status_created_idx ON documents(status, created_at DESC)",
    ),
  ]);
}
