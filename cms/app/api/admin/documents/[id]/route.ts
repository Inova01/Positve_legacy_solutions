import { requireAdminApi } from "../../../../admin-auth";
import { getBindings, getDatabase } from "../../../../../db";
import { cleanStatus, toDocument, type DocumentRow } from "../../../_helpers";

type DocumentPayload = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as DocumentPayload;
    const title = text(payload.title);
    if (!title) {
      return Response.json({ error: "A document title is required." }, { status: 400 });
    }

    const database = await getDatabase();
    const result = await database
      .prepare(
        `UPDATE documents SET title = ?, description = ?, status = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        title,
        text(payload.description),
        cleanStatus(payload.status),
        new Date().toISOString(),
        id,
      )
      .run();
    if (!result.meta.changes) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const row = await database
      .prepare(
        `SELECT id, title, description, filename, object_key, content_type,
                size, status, created_at, updated_at
         FROM documents WHERE id = ? LIMIT 1`,
      )
      .bind(id)
      .first<DocumentRow>();
    return Response.json({
      document: row ? toDocument(row, new URL(request.url).origin) : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update document";
    return Response.json({ error: message }, { status: 500 });
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
    const row = await database
      .prepare("SELECT object_key FROM documents WHERE id = ? LIMIT 1")
      .bind(id)
      .first<{ object_key: string }>();
    if (!row) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    await getBindings().FILES.delete(row.object_key);
    await database.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete document";
    return Response.json({ error: message }, { status: 500 });
  }
}
