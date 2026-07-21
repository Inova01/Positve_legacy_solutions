import type { ClientRecord, ClientStatus } from "../../../cms-types";

export type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service: string;
  source: string;
  status: string;
  notes: string;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export function cleanClientStatus(value: unknown): ClientStatus {
  return value === "contacted" || value === "active" || value === "closed"
    ? value
    : "new";
}

export function cleanText(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function toClient(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    service: row.service,
    source: row.source,
    status: cleanClientStatus(row.status),
    notes: row.notes,
    messageCount: Number(row.message_count || 0),
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const CLIENT_SELECT = `
  SELECT c.id, c.full_name, c.email, c.phone, c.service, c.source,
         c.status, c.notes, c.created_at, c.updated_at,
         COUNT(m.id) AS message_count,
         MAX(m.created_at) AS last_message_at
  FROM clients c
  LEFT JOIN client_messages m ON m.client_id = c.id
`;
