import { getChatGPTUser, type ChatGPTUser } from "./chatgpt-auth";
import {
  hasAdminPasswordSession,
  isAdminPasswordConfigured,
} from "./admin-password";

export type AdminAccess =
  | { ok: true; user: ChatGPTUser }
  | { ok: false; reason: "signed-out" }
  | { ok: false; reason: "password-required"; user: ChatGPTUser };

export async function getAdminUser(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();

  if (!user && process.env.NODE_ENV === "development") {
    return {
      email: "local-preview@positivelegacy.test",
      displayName: "Local Preview",
      fullName: "Local Preview",
    };
  }

  return user;
}

export async function getAdminAccess(): Promise<AdminAccess> {
  const user = await getAdminUser();
  if (!user) return { ok: false, reason: "signed-out" };

  if (process.env.NODE_ENV === "development" && !isAdminPasswordConfigured()) {
    return { ok: true, user };
  }

  if (!(await hasAdminPasswordSession(user.email))) {
    return { ok: false, reason: "password-required", user };
  }

  return { ok: true, user };
}

export async function requireAdminApi(): Promise<
  { ok: true; user: ChatGPTUser } | { ok: false; response: Response }
> {
  const access = await getAdminAccess();
  if (access.ok) return access;

  return {
    ok: false,
    response: Response.json(
      {
        error:
          access.reason === "password-required"
            ? "Enter the admin password to continue."
            : "Sign in to continue.",
        loginUrl: "/admin/login",
      },
      { status: 401 },
    ),
  };
}
