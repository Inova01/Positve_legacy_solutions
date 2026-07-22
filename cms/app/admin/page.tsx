import { redirect } from "next/navigation";
import { getAdminAccess } from "../admin-auth";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

export default async function AdminPage() {
  const access = await getAdminAccess();
  if (!access.ok) redirect("/admin/login");

  return (
    <DashboardClient
      user={{ name: access.user.displayName, email: access.user.email }}
      signOutPath="/admin/logout"
    />
  );
}
