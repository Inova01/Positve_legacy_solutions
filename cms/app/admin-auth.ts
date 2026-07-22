import {
  hasAdminPasswordSession,
  isAdminPasswordConfigured,
} from "./admin-password";

export type AdminUser = {
  email: string;
  displayName: string;
  fullName: string;
};

const ADMIN_USER: AdminUser = {
  email: "admin@positivelegacysolutions.com",
  displayName: "Administrator",
  fullName: "Positive Legacy Administrator",
};

export type AdminAccess =
  | { ok: true; user: AdminUser }
  | { ok: false; reason: "password-required" };

export async function getAdminAccess(): Promise<AdminAccess> {
  if (process.env.NODE_ENV === "development" && !isAdminPasswordConfigured()) {
    return { ok: true, user: ADMIN_USER };
  }

  if (!(await hasAdminPasswordSession())) {
    return { ok: false, reason: "password-required" };
  }

  return { ok: true, user: ADMIN_USER };
}

export async function requireAdminApi(): Promise<
  { ok: true; user: AdminUser } | { ok: false; response: Response }
> {
  const access = await getAdminAccess();
  if (access.ok) return access;

  return {
    ok: false,
    response: Response.json(
      {
        error: "Enter the admin password to continue.",
        loginUrl: "/admin/login",
      },
      { status: 401 },
    ),
  };
}
