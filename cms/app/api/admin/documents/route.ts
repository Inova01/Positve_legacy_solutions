import { requireAdminApi } from "../../../admin-auth";
import { getBindings, getDatabase } from "../../../../db";
import { cleanStatus, toDocument, type DocumentRow } from "../../_helpers";

const MAX_PDF_SIZE = 20 * 1024 * 1024;

function safeFilename(value: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "document.pdf";
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const database = await getDatabase();
    const result = await database
      .prepare(
        `SELECT id, title, description, filename, object_key, content_type,
                size, status, created_at, updated_at
         FROM documents ORDER BY updated_at DESC`,
      )
      .all<DocumentRow>();
    const origin = new URL(request.url).origin;
    return Response.json({
      documents: result.results.map((row) => toDocument(row, origin)),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load documents";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const form = await request.formData();
    const upload = form.get("file");
    if (!(upload instanceof File)) {
      return Response.json({ error: "Choose a PDF to upload." }, { status: 400 });
    }
    const isPdf =
      upload.type === "application/pdf" || upload.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return Response.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }
    if (upload.size <= 0 || upload.size > MAX_PDF_SIZE) {
      return Response.json(
        { error: "PDF files must be between 1 byte and 20 MB." },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const filename = safeFilename(upload.name);
    const objectKey = `documents/${id}/${filename}`;
    const titleValue = form.get("title");
    const descriptionValue = form.get("description");
    const statusValue = form.get("status");
    const title =
      typeof titleValue === "string" && titleValue.trim()
        ? titleValue.trim()
        : titleFromFilename(filename);
    const description =
      typeof descriptionValue === "string" ? descriptionValue.trim() : "";
    const status = cleanStatus(statusValue);
    const now = new Date().toISOString();
    const { FILES } = getBindings();

    await FILES.put(objectKey, upload.stream(), {
      httpMetadata: {
        contentType: "application/pdf",
        contentDisposition: `inline; filename="${filename.replace(/"/g, "_")}"`,
      },
      customMetadata: { title },
    });

    try {
      const database = await getDatabase();
      await database
        .prepare(
          `INSERT INTO documents (
            id, title, description, filename, object_key, content_type,
            size, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          title,
          description,
          filename,
          objectKey,
          "application/pdf",
          upload.size,
          status,
          now,
          now,
        )
        .run();

      const row = await database
        .prepare(
          `SELECT id, title, description, filename, object_key, content_type,
                  size, status, created_at, updated_at
           FROM documents WHERE id = ? LIMIT 1`,
        )
        .bind(id)
        .first<DocumentRow>();
      return Response.json(
        { document: row ? toDocument(row, new URL(request.url).origin) : null },
        { status: 201 },
      );
    } catch (error) {
      await FILES.delete(objectKey);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload PDF";
    return Response.json({ error: message }, { status: 500 });
  }
}
