import { getDatabase } from "../../../db";
import {
  PUBLIC_HEADERS,
  publicJson,
  toDocument,
  type DocumentRow,
} from "../_helpers";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: PUBLIC_HEADERS });
}

export async function GET(request: Request) {
  try {
    const database = await getDatabase();
    const result = await database
      .prepare(
        `SELECT id, title, description, filename, object_key, content_type,
                size, status, created_at, updated_at
         FROM documents WHERE status = 'published' ORDER BY created_at DESC`,
      )
      .all<DocumentRow>();
    const origin = new URL(request.url).origin;
    return publicJson({
      documents: result.results.map((row) => toDocument(row, origin)),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load documents";
    return publicJson({ error: message }, { status: 500 });
  }
}
