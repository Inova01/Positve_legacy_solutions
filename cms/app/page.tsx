import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "PLS Content Manager",
  description: "Secure blog publishing and document management for Positive Legacy Solutions.",
};

export default async function Home() {
  const user = await getChatGPTUser();
  const destination = user ? "/admin" : chatGPTSignInPath("/admin");

  return (
    <main className="hub-page">
      <div className="hub-orbit hub-orbit-one" />
      <div className="hub-orbit hub-orbit-two" />
      <section className="hub-card">
        <div className="brand-lockup">
          <span className="brand-mark">PLS</span>
          <span>
            <strong>Positive Legacy Solutions</strong>
            <small>Content Manager</small>
          </span>
        </div>
        <p className="eyebrow">Private publishing workspace</p>
        <h1>Keep your ideas, articles and client resources in one place.</h1>
        <p className="hub-copy">
          Create and publish blog posts, organize downloadable PDFs and keep the
          public website current without editing website code.
        </p>
        <div className="hub-features" aria-label="Content manager capabilities">
          <span>Draft and publish</span>
          <span>PDF library</span>
          <span>Secure access</span>
        </div>
        <Link className="primary-button" href={destination}>
          {user ? "Open dashboard" : "Sign in to manage content"}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
