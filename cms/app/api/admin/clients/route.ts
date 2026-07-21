import { requireAdminApi } from "../../../admin-auth";
import { getDatabase } from "../../../../db";
import {
  CLIENT_SELECT,
  cleanClientStatus,
  cleanText,
  toClient,
  type ClientRow,
} from "./client-helpers";

type ClientPayload = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  service?: unknown;
  source?: unknown;
  status?: unknown;
  notes?: unknown;
};

export async function GET() {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const database = await getDatabase();
    const result = await database
      .prepare(`${CLIENT_SELECT} GROUP BY c.id ORDER BY c.created_at DESC`)
      .all<ClientRow>();
    return Response.json({ clients: result.results.map(toClient) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load clients";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const payload = (await request.json()) as ClientPayload;
    const fullName = cleanText(payload.fullName, 120);
    const email = cleanText(payload.email, 180).toLowerCase();
    if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json(
        { error: "A client name and valid email are required." },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const database = await getDatabase();
    await database
      .prepare(`INSERT INTO clients (
        id, full_name, email, phone, service, source, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
      .bind(
        id,
        fullName,
        email,
        cleanText(payload.phone, 50),
        cleanText(payload.service, 120) || "General inquiry",
        cleanText(payload.source, 80) || "Manual entry",
        cleanClientStatus(payload.status),
        cleanText(payload.notes, 4000),
        now,
        now,
      )
      .run();

    const row = await database
      .prepare(`${CLIENT_SELECT} WHERE c.id = ? GROUP BY c.id LIMIT 1`)
      .bind(id)
      .first<ClientRow>();
    return Response.json({ client: row ? toClient(row) : null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create client";
    return Response.json({ error: message }, { status: 500 });
  }
}
