import { requireAdminApi } from "../../../admin-auth";
import { getDatabase } from "../../../../db";
import {
  cleanStatus,
  cleanTags,
  slugify,
  toPost,
  type PostRow,
} from "../../_helpers";

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

export async function GET() {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const database = await getDatabase();
    const result = await database
      .prepare(
        `SELECT id, title, slug, excerpt, content, category, tags, status,
                featured_image_url, author, published_at, created_at, updated_at
         FROM posts ORDER BY updated_at DESC`,
      )
      .all<PostRow>();
    return Response.json({ posts: result.results.map(toPost) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load posts";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const payload = (await request.json()) as PostPayload;
    const title = text(payload.title);
    const slug = slugify(text(payload.slug) || title);
    if (!title) {
      return Response.json({ error: "A post title is required." }, { status: 400 });
    }
    if (!slug) {
      return Response.json({ error: "A valid post URL is required." }, { status: 400 });
    }

    const status = cleanStatus(payload.status);
    const tags = cleanTags(payload.tags);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const database = await getDatabase();

    await database
      .prepare(
        `INSERT INTO posts (
          id, title, slug, excerpt, content, category, tags, status,
          featured_image_url, author, published_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        title,
        slug,
        text(payload.excerpt),
        text(payload.content),
        text(payload.category) || "Community",
        JSON.stringify(tags),
        status,
        text(payload.featuredImageUrl),
        text(payload.author) || "Positive Legacy Solutions",
        status === "published" ? now : null,
        now,
        now,
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
    return Response.json({ post: row ? toPost(row) : null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create post";
    const status = /UNIQUE|unique/i.test(message) ? 409 : 500;
    return Response.json(
      { error: status === 409 ? "That post URL is already in use." : message },
      { status },
    );
  }
}
