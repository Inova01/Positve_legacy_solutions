import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

const COOKIE_NAME = "pls_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function runtimeSecret(name: "ADMIN_PASSWORD" | "ADMIN_SESSION_SECRET"): string {
  const bindings = env as unknown as Record<string, unknown>;
  const value = bindings[name] ?? process.env[name];
  return typeof value === "string" ? value : "";
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(runtimeSecret("ADMIN_PASSWORD") && runtimeSecret("ADMIN_SESSION_SECRET"));
}

export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  const password = runtimeSecret("ADMIN_PASSWORD");
  if (!password || !candidate) return false;
  return constantTimeEqual(candidate, password);
}

export async function hasAdminPasswordSession(email: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token, email) : false;
}

export async function createAdminSessionToken(email: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${email.toLowerCase()}.${expiresAt}`;
  const signature = await sign(payload);
  return `${base64UrlEncode(payload)}.${signature}`;
}

export function adminSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}

export function clearAdminSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function verifySessionToken(token: string, email: string): Promise<boolean> {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const payload = base64UrlDecode(encodedPayload);
  if (!payload) return false;

  const separator = payload.lastIndexOf(".");
  if (separator < 1) return false;
  const tokenEmail = payload.slice(0, separator);
  const expiresAt = Number(payload.slice(separator + 1));
  if (tokenEmail !== email.toLowerCase() || !Number.isFinite(expiresAt)) return false;
  if (expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const expected = await sign(payload);
  return constantTimeEqual(signature, expected);
}

async function sign(payload: string): Promise<string> {
  const secret = runtimeSecret("ADMIN_SESSION_SECRET");
  if (!secret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([digest(left), digest(right)]);
  if (leftHash.length !== rightHash.length) return false;
  let mismatch = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    mismatch |= leftHash[index] ^ rightHash[index];
  }
  return mismatch === 0;
}

async function digest(value: string): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(hash);
}

function base64UrlEncode(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch {
    return null;
  }
}
