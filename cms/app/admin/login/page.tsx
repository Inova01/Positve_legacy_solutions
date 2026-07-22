import { redirect } from "next/navigation";
import { getAdminAccess } from "../../admin-auth";
import { AdminPasswordLogin } from "./AdminPasswordLogin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  const access = await getAdminAccess();
  if (access.ok) redirect("/admin");

  return (
    <main className="access-page">
      <section className="access-card login-card">
        <span className="brand-mark">PLS</span>
        <p className="eyebrow">Administrator access</p>
        <h1>Welcome back.</h1>
        <p>Enter your private password to manage blog posts and PDF documents.</p>
        <AdminPasswordLogin />
      </section>
    </main>
  );
}
