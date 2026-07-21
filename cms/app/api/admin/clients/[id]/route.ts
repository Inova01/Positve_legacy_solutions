import { requireAdminApi } from "../../../../admin-auth";
import { getDatabase } from "../../../../../db";
import {
  CLIENT_SELECT,
  cleanClientStatus,
  cleanText,
  toClient,
  type ClientRow,
} from "../client-helpers";

type ClientPayload = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  service?: unknown;
  source?: unknown;
  status?: unknown;
  notes?: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as ClientPayload;
    const fullName = cleanText(payload.fullName, 120);
    const email = cleanText(payload.email, 180).toLowerCase();
    if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json(
        { error: "A client name and valid email are required." },
        { status: 400 },
      );
    }

    const database = await getDatabase();
    const result = await database
      .prepare(`UPDATE clients SET
        full_name = ?, email = ?, phone = ?, service = ?, source = ?,
        status = ?, notes = ?, updated_at = ? WHERE id = ?`)
      .bind(
        fullName,
        email,
        cleanText(payload.phone, 50),
        cleanText(payload.service, 120) || "General inquiry",
        cleanText(payload.source, 80) || "Manual entry",
        cleanClientStatus(payload.status),
        cleanText(payload.notes, 4000),
        new Date().toISOString(),
        id,
      )
      .run();
    if (!result.meta.changes) {
      return Response.json({ error: "Client not found." }, { status: 404 });
    }

    const row = await database
      .prepare(`${CLIENT_SELECT} WHERE c.id = ? GROUP BY c.id LIMIT 1`)
      .bind(id)
      .first<ClientRow>();
    return Response.json({ client: row ? toClient(row) : null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update client";
    return Response.json({ error: message }, { status: 500 });
  }
}
