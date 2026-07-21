"use client";

import { FormEvent, useState } from "react";

export function AdminPasswordLogin({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to sign in.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Unable to reach the dashboard. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="password-form" onSubmit={submit}>
      <label>
        <span>Admin password</span>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          autoFocus
        />
      </label>
      {error ? <p className="login-error" role="alert">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Checking…" : "Open dashboard"}
      </button>
      <p className="login-identity">Signed in as {email}</p>
    </form>
  );
}
