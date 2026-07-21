import { getDatabase } from "../../../db";
import { PUBLIC_HEADERS, publicJson, toPost, type PostRow } from "../_helpers";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: PUBLIC_HEADERS });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim();
    const database = await getDatabase();

    if (slug) {
      const row = await database
        .prepare(
          `SELECT id, title, slug, excerpt, content, category, tags, status,
                  featured_image_url, author, published_at, created_at, updated_at
           FROM posts WHERE slug = ? AND status = 'published' LIMIT 1`,
        )
        .bind(slug)
        .first<PostRow>();

      if (!row) return publicJson({ error: "Post not found" }, { status: 404 });
      return publicJson({ post: toPost(row) });
    }

    const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100)
      : 50;
    const result = await database
      .prepare(
        `SELECT id, title, slug, excerpt, content, category, tags, status,
                featured_image_url, author, published_at, created_at, updated_at
         FROM posts WHERE status = 'published'
         ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?`,
      )
      .bind(limit)
      .all<PostRow>();

    return publicJson({ posts: result.results.map(toPost) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load posts";
    return publicJson({ error: message }, { status: 500 });
  }
}
