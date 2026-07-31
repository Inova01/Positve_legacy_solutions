import type { BlogPost, CmsDocument, PostStatus } from "../cms-types";

export const PUBLIC_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
};

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  status: string;
  featured_image_url: string;
  author: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  title: string;
  description: string;
  filename: string;
  object_key: string;
  content_type: string;
  size: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export function toPost(row: PostRow): BlogPost {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags) as unknown;
    if (Array.isArray(parsed)) {
      tags = parsed.filter((tag): tag is string => typeof tag === "string");
    }
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags,
    status: row.status === "published" ? "published" : "draft",
    featuredImageUrl: row.featured_image_url,
    author: row.author,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDocument(row: DocumentRow, origin = ""): CmsDocument {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    filename: row.filename,
    contentType: row.content_type,
    size: row.size,
    status: row.status === "published" ? "published" : "draft",
    downloadUrl: `${origin}/api/files/${encodeURIComponent(row.id)}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function cleanStatus(value: unknown): PostStatus {
  return value === "published" ? "published" : "draft";
}

export function cleanTags(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return source
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function publicJson(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, {
    ...init,
    headers: { ...PUBLIC_HEADERS, ...(init.headers ?? {}) },
  });
}
