"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/brand-mark";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError("Password recovery is not configured for this deployment.");
      return;
    }
    setPending(true);
    try {
      const { error: requestError } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (requestError) throw requestError;
      setMessage("If an account exists for that email, a password reset link will arrive shortly.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The reset email could not be sent. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="legal-brand"><BrandMark className="brand-mark" /><span>Katalyst</span></Link>
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1>Reset your password</h1>
        <p>Enter the email address on your account. We’ll send a recovery link if password recovery is enabled.</p>
        <form onSubmit={submit} className="auth-form">
          <label className="key-field">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {error && <p className="inline-error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}
          <button className="primary-button" type="submit" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button>
        </form>
        <Link className="auth-back-link" href="/">Back to Katalyst</Link>
      </section>
    </main>
  );
}
