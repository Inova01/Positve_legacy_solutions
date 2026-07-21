import { getBindings, getDatabase } from "../../../../db";
import { PUBLIC_HEADERS, type DocumentRow } from "../../_helpers";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: PUBLIC_HEADERS });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const database = await getDatabase();
    const row = await database
      .prepare(
        `SELECT id, title, description, filename, object_key, content_type,
                size, status, created_at, updated_at
         FROM documents WHERE id = ? AND status = 'published' LIMIT 1`,
      )
      .bind(id)
      .first<DocumentRow>();

    if (!row) {
      return Response.json(
        { error: "Document not found" },
        { status: 404, headers: PUBLIC_HEADERS },
      );
    }

    const object = await getBindings().FILES.get(row.object_key);
    if (!object) {
      return Response.json(
        { error: "Stored document is unavailable" },
        { status: 404, headers: PUBLIC_HEADERS },
      );
    }

    const dispositionFilename = row.filename.replace(/["\r\n]/g, "_");
    return new Response(object.body, {
      headers: {
        ...PUBLIC_HEADERS,
        "Content-Type": row.content_type,
        "Content-Length": String(row.size),
        "Content-Disposition": `inline; filename="${dispositionFilename}"`,
        ETag: object.httpEtag,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load document";
    return Response.json(
      { error: message },
      { status: 500, headers: PUBLIC_HEADERS },
    );
  }
}
