import { clearAdminSessionCookie } from "../../admin-password";

export async function GET(request: Request) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL("/admin/login", request.url).toString(),
      "Set-Cookie": clearAdminSessionCookie(),
      "Cache-Control": "no-store",
    },
  });
}
