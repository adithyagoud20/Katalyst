"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/brand-mark";

export function ResetPasswordForm() {
  const [client] = useState(createSupabaseBrowserClient);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    if (!client) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    const prepare = async () => {
      if (code) {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else if (tokenHash && type === "recovery") {
        const { error: verifyError } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (verifyError) throw verifyError;
      } else {
        const { data, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) throw new Error("This reset link is missing or has expired. Request a new link.");
      }
      if (active) setReady(true);
    };
    void prepare().catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "This reset link could not be verified. Request a new link.");
    });
    return () => { active = false; };
  }, [client]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!client) {
      setError("Password recovery is not configured for this deployment.");
      return;
    }
    setPending(true);
    try {
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Your password has been updated. Return to Katalyst and sign in again.");
      setPassword("");
      setConfirmPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The password could not be updated. Request a new reset link.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="legal-brand"><BrandMark className="brand-mark" /><span>Katalyst</span></Link>
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1>Choose a new password</h1>
        <p>Use a password you don’t use on another site.</p>
        <form onSubmit={submit} className="auth-form">
          <label className="key-field">New password<span className="password-entry-with-toggle"><input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!ready || pending} /><button type="button" className="password-visibility-toggle" aria-label={showPassword ? "Hide new password" : "Show new password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          <label className="key-field">Confirm new password<span className="password-entry-with-toggle"><input required minLength={8} type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!ready || pending} /><button type="button" className="password-visibility-toggle" aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword((value) => !value)}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {error && <p className="inline-error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}
          <button className="primary-button" type="submit" disabled={!ready || pending}>{pending ? "Saving…" : "Update password"}</button>
        </form>
        {!client && <p className="inline-error" role="alert">Password recovery is not configured for this deployment.</p>}
        {client && !ready && !error && <p className="auth-status" role="status">Verifying your reset link…</p>}
        <Link className="auth-back-link" href="/">Back to Katalyst</Link>
      </section>
    </main>
  );
}
