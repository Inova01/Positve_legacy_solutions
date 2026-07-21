import { requireAdminApi } from "../../../../../admin-auth";
import { getDatabase } from "../../../../../../db";
import type { ClientMessage } from "../../../../../cms-types";
import { cleanText } from "../../client-helpers";

type MessageRow = {
  id: string;
  client_id: string;
  subject: string;
  body: string;
  channel: string;
  status: string;
  created_at: string;
};

function toMessage(row: MessageRow): ClientMessage {
  return {
    id: row.id,
    clientId: row.client_id,
    subject: row.subject,
    body: row.body,
    channel: "email",
    status: "prepared",
    createdAt: row.created_at,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const { id } = await context.params;
    const database = await getDatabase();
    const result = await database
      .prepare(`SELECT id, client_id, subject, body, channel, status, created_at
                FROM client_messages WHERE client_id = ? ORDER BY created_at DESC`)
      .bind(id)
      .all<MessageRow>();
    return Response.json({ messages: result.results.map(toMessage) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load messages";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access.ok) return access.response;

  try {
    const { id: clientId } = await context.params;
    const payload = (await request.json()) as { subject?: unknown; body?: unknown };
    const subject = cleanText(payload.subject, 180);
    const body = cleanText(payload.body, 8000);
    if (!subject || !body) {
      return Response.json({ error: "A subject and message are required." }, { status: 400 });
    }

    const database = await getDatabase();
    const client = await database
      .prepare("SELECT id FROM clients WHERE id = ? LIMIT 1")
      .bind(clientId)
      .first<{ id: string }>();
    if (!client) {
      return Response.json({ error: "Client not found." }, { status: 404 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await database.batch([
      database
        .prepare(`INSERT INTO client_messages (
          id, client_id, subject, body, channel, status, created_at
        ) VALUES (?, ?, ?, ?, 'email', 'prepared', ?)`)
        .bind(id, clientId, subject, body, now),
      database
        .prepare("UPDATE clients SET status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END, updated_at = ? WHERE id = ?")
        .bind(now, clientId),
    ]);

    const row = await database
      .prepare(`SELECT id, client_id, subject, body, channel, status, created_at
                FROM client_messages WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<MessageRow>();
    return Response.json({ message: row ? toMessage(row) : null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare message";
    return Response.json({ error: message }, { status: 500 });
  }
}
