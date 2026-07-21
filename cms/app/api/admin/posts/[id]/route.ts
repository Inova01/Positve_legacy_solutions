import { requireAdminApi } from "../../../../admin-auth";
import { getDatabase } from "../../../../../db";
import {
  cleanStatus,
  cleanTags,
  slugify,
  toPost,
  type PostRow,
} from "../../../_helpers";

type PostPayload = {
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  content?: unknown;
  category?: unknown;
  tags?: unknown;
  status?: unknown;
  featuredImageUrl?: unknown;
  author?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as PostPayload;
    const title = text(payload.title);
    const slug = slugify(text(payload.slug) || title);
    if (!title || !slug) {
      return Response.json(
        { error: "A post title and valid URL are required." },
        { status: 400 },
      );
    }

    const database = await getDatabase();
    const existing = await database
      .prepare("SELECT status, published_at FROM posts WHERE id = ? LIMIT 1")
      .bind(id)
      .first<{ status: string; published_at: string | null }>();
    if (!existing) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }

    const status = cleanStatus(payload.status);
    const publishedAt =
      status === "published"
        ? existing.published_at || new Date().toISOString()
        : null;
    const now = new Date().toISOString();

    await database
      .prepare(
        `UPDATE posts SET
          title = ?, slug = ?, excerpt = ?, content = ?, category = ?,
          tags = ?, status = ?, featured_image_url = ?, author = ?,
          published_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        title,
        slug,
        text(payload.excerpt),
        text(payload.content),
        text(payload.category) || "Community",
        JSON.stringify(cleanTags(payload.tags)),
        status,
        text(payload.featuredImageUrl),
        text(payload.author) || "Positive Legacy Solutions",
        publishedAt,
        now,
        id,
      )
      .run();

    const row = await database
      .prepare(
        `SELECT id, title, slug, excerpt, content, category, tags, status,
                featured_image_url, author, published_at, created_at, updated_at
         FROM posts WHERE id = ? LIMIT 1`,
      )
      .bind(id)
      .first<PostRow>();
    return Response.json({ post: row ? toPost(row) : null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update post";
    const status = /UNIQUE|unique/i.test(message) ? 409 : 500;
    return Response.json(
      { error: status === 409 ? "That post URL is already in use." : message },
      { status },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const { id } = await context.params;
    const database = await getDatabase();
    const result = await database
      .prepare("DELETE FROM posts WHERE id = ?")
      .bind(id)
      .run();
    if (!result.meta.changes) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete post";
    return Response.json({ error: message }, { status: 500 });
  }
}
