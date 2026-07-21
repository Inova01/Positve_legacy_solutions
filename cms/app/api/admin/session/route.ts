import { getAdminUser } from "../../../admin-auth";
import {
  adminSessionCookie,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "../../../admin-password";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Sign in with ChatGPT first." }, { status: 401 });
  }
  if (!isAdminPasswordConfigured()) {
    return Response.json({ error: "Admin password is not configured." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof payload.password === "string" ? payload.password : "";
  if (!(await verifyAdminPassword(password))) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createAdminSessionToken(user.email);
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": adminSessionCookie(token), "Cache-Control": "no-store" } },
  );
}
