"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SupermemoryHeroGraphic } from "@/components/supermemory-hero-graphic";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { passwordInputType, safeLoginDestination } from "@/lib/login-utils";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";

type LoginMode = "sign-in" | "sign-up" | "forgot";
type TurnstileWidget = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    theme: "auto";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileWidget }
}

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export function LoginForm() {
  const router = useRouter();
  const client = useMemo(() => createSupabaseBrowserClient(), []);
  const consentFlowRef = useRef(false);
  const [mode, setMode] = useState<LoginMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [googleConsentOpen, setGoogleConsentOpen] = useState(false);
  const [googleConsentAccepted, setGoogleConsentAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const captchaWidgetRef = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountAvailable, setAccountAvailable] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initializeFromUrl = () => {
      if (params.get("mode") === "sign-up") setMode("sign-up");
      if (params.get("account") === "sign-in-failed") setError("Sign-in did not complete. Check the enabled sign-in methods and redirect URL, then try again.");
      if (params.get("account") === "consent-required") setError("Accept the current Terms and Privacy notice before signing in.");
      if (params.get("account") === "consent-unavailable") setError("Your account was not signed in because the consent record could not be saved. Try again shortly.");
      if (!client) setAccountAvailable(false);
    };
    const initializeTimer = window.setTimeout(initializeFromUrl, 0);
    if (!client) {
      return () => window.clearTimeout(initializeTimer);
    }
    const finishVerifiedSession = async () => {
      const { data, error: authError } = await client.auth.getUser();
      if (!authError && data.user && !consentFlowRef.current) router.replace(safeLoginDestination(params.get("next"), window.location.origin));
    };
    void finishVerifiedSession();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !consentFlowRef.current) router.replace(safeLoginDestination(params.get("next"), window.location.origin));
    });
    return () => {
      window.clearTimeout(initializeTimer);
      subscription.unsubscribe();
    };
  }, [client, router]);

  useEffect(() => {
    if (!turnstileSiteKey || !captchaContainerRef.current) return;
    let active = true;
    const renderWidget = () => {
      if (!active || !captchaContainerRef.current || !window.turnstile || captchaWidgetRef.current) return;
      captchaWidgetRef.current = window.turnstile.render(captchaContainerRef.current, {
        sitekey: turnstileSiteKey,
        theme: "auto",
        callback: (token) => { setCaptchaToken(token); setCaptchaError(""); },
        "expired-callback": () => { setCaptchaToken(""); setCaptchaError("The security check expired. Complete it again."); },
        "error-callback": () => { setCaptchaToken(""); setCaptchaError("The security check could not load. Refresh and try again."); },
      });
    };
    let script = document.getElementById("katalyst-turnstile-script") as HTMLScriptElement | null;
    if (window.turnstile) {
      renderWidget();
    } else if (script) {
      script.addEventListener("load", renderWidget, { once: true });
    } else {
      script = document.createElement("script");
      script.id = "katalyst-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      script.addEventListener("error", () => setCaptchaError("The security check could not load. Refresh and try again."), { once: true });
      document.head.appendChild(script);
    }
    return () => {
      active = false;
      if (captchaWidgetRef.current && window.turnstile) window.turnstile.remove(captchaWidgetRef.current);
      captchaWidgetRef.current = null;
    };
  }, []);

  const requireTermsAcceptance = () => {
    if (acceptedTerms) return true;
    setError("Please accept the Terms of Service and Privacy Policy to continue.");
    return false;
  };

  const prepareConsent = async (method: "google" | "email-sign-in" | "email-sign-up") => {
    const response = await fetch("/api/legal/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "prepare", accepted: true, termsVersion: CURRENT_TERMS_VERSION, privacyVersion: CURRENT_PRIVACY_VERSION, method }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Consent could not be recorded.");
  };

  const completeConsent = async () => {
    const response = await fetch("/api/legal/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Consent could not be recorded.");
  };

  const resetCaptcha = () => {
    setCaptchaToken("");
    if (captchaWidgetRef.current && window.turnstile) window.turnstile.reset(captchaWidgetRef.current);
  };

  const startGoogle = () => {
    setGoogleConsentAccepted(false);
    setError("");
    setGoogleConsentOpen(true);
  };

  const continueGoogle = async () => {
    if (!client || !googleConsentAccepted) return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      await prepareConsent("google");
      const { error: authError } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth/callback" },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google sign-in could not start. Try again.");
      setPending(false);
      setGoogleConsentOpen(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!client) {
      setError("Account sign-in is not configured for this deployment. You can continue as a guest.");
      return;
    }
    if (mode !== "forgot" && !requireTermsAcceptance()) return;
    if (turnstileSiteKey && !captchaToken) {
      setError("Complete the security check to continue.");
      return;
    }
    consentFlowRef.current = mode !== "forgot";
    setPending(true);
    try {
      if (mode === "forgot") {
        const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + "/auth/reset-password",
          ...(captchaToken ? { captchaToken } : {}),
        });
        if (resetError) throw resetError;
        setNotice("If an account exists for that email, a password reset link will arrive shortly.");
      } else if (mode === "sign-in") {
        await prepareConsent("email-sign-in");
        const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password, ...(captchaToken ? { options: { captchaToken } } : {}) });
        if (signInError) throw signInError;
        const { data, error: userError } = await client.auth.getUser();
        if (userError || !data.user) throw new Error("The account session could not be verified. Try signing in again.");
        try {
          await completeConsent();
        } catch (consentError) {
          await client.auth.signOut();
          throw consentError;
        }
        router.replace(safeLoginDestination(new URLSearchParams(window.location.search).get("next"), window.location.origin));
      } else {
        await prepareConsent("email-sign-up");
        const { data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + "/auth/callback", ...(captchaToken ? { captchaToken } : {}) },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          const { data: userData, error: userError } = await client.auth.getUser();
          if (userError || !userData.user) throw new Error("The new account could not be verified. Check your email confirmation settings.");
          try {
            await completeConsent();
          } catch (consentError) {
            await client.auth.signOut();
            throw consentError;
          }
          router.replace(safeLoginDestination(new URLSearchParams(window.location.search).get("next"), window.location.origin));
        } else {
          consentFlowRef.current = false;
          setPassword("");
          setNotice("Check your email to confirm your account. Consent will be recorded when the confirmation link returns to this browser.");
        }
      }
    } catch (authError) {
      consentFlowRef.current = false;
      setError(authError instanceof Error ? authError.message : "This account request could not be completed.");
    } finally {
      setPending(false);
      if (turnstileSiteKey) resetCaptcha();
    }
  };

  const title = mode === "sign-up" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";

  return (
    <main className="login-page">
      <section className="login-form-panel">
          <header className="login-brand-row">
          <Link href="/" className="legal-brand"><BrandMark className="brand-mark" /><span>KATALYST</span></Link>
          <Link href="/" className="login-guest-link">Continue as guest <small>Kat AI credits included</small><ArrowRight size={14} /></Link>
        </header>
        <div className="login-form-content">
          <span className="eyebrow">{mode === "forgot" ? "ACCOUNT RECOVERY" : "YOUR TECHNICAL STUDIO"}</span>
          <h1>{title}</h1>
          <p>{mode === "sign-up" ? "Save learning progress and continue across devices. You can also explore as a guest." : mode === "forgot" ? "Enter the email address on your account and we’ll send a secure recovery link." : "Sign in to sync your learning, projects, and appearance across devices."}</p>
          {mode !== "forgot" && <p className="login-credit-explainer">Guest mode includes a Kat AI credit allowance. Your remaining balance appears in the workspace; use varies with model and request size. Your own provider key does not use Kat AI credits.</p>}
          {!accountAvailable && <div className="login-config-notice" role="status">Account sign-in is not configured here. Guest mode is available without an account.</div>}
          {mode !== "forgot" && <button type="button" className="login-google-button" onClick={() => void startGoogle()} disabled={pending || !accountAvailable}><span className="google-glyph" aria-hidden="true">G</span>Continue with Google</button>}
          {mode !== "forgot" && <div className="login-divider"><span>or use email</span></div>}
          <form className="login-form" onSubmit={(event) => void submit(event)}>
            <label className="login-field"><span>Email address</span><span className="login-input-wrap"><Mail size={16} /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span></label>
            {mode !== "forgot" && <label className="login-field"><span>Password</span><span className="login-input-wrap"><LockKeyhole size={16} /><input type={passwordInputType(showPassword)} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={mode === "sign-up" ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "sign-up" ? "At least 8 characters" : "Enter your password"} /><button type="button" className="password-visibility-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>}
            {turnstileSiteKey && <div className="login-captcha"><div ref={captchaContainerRef} />{captchaError && <small role="alert">{captchaError}</small>}</div>}
            {mode !== "forgot" && <label className="login-terms-consent"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /><span>I accept the <Link href="/terms" target="_blank">Terms of Service</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>}
            {error && <p className="login-error" role="alert">{error}</p>}
            {notice && <p className="login-notice" role="status">{notice}</p>}
            <button className="login-submit-button" type="submit" disabled={pending || !accountAvailable}>{pending ? "Please wait…" : mode === "sign-up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<ArrowRight size={16} /></button>
          </form>
          <nav className="login-mode-links" aria-label="Account options">
            {mode === "sign-in" && <><button type="button" onClick={() => { setError(""); setNotice(""); setMode("sign-up"); }}>Create an account</button><button type="button" onClick={() => { setError(""); setNotice(""); setMode("forgot"); }}>Forgot password?</button></>}
            {mode !== "sign-in" && <button type="button" onClick={() => { setError(""); setNotice(""); setMode("sign-in"); }}>Back to sign in</button>}
          </nav>
          <div className="login-privacy-note"><ShieldCheck size={15} /><span>Account creation is optional. Guest learning stays in this browser until you choose to sync.</span></div>
        </div>
        <footer className="login-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/account/delete">Delete account</Link></footer>
      </section>
      <aside className="login-story-panel">
        <div className="login-story-topline"><span><i /> OPEN TECHNICAL STUDIO</span><span>LEARN / BUILD / EXPLORE</span></div>
        <div className="login-story-copy"><span className="eyebrow">A PLACE FOR CURIOUS BUILDERS</span><h2>Explore systems.<br /><em>Understand the world.</em></h2><p>Move between software, electronics, circuits, databases, AI, and visual media in one connected learning space.</p></div>
        <SupermemoryHeroGraphic />
        <div className="login-runtime-facts"><span><strong>01</strong> Lessons with clear steps</span><span><strong>02</strong> Browser-based tools</span><span><strong>03</strong> Optional AI guidance</span></div>
      </aside>
      {googleConsentOpen && <div className="legal-consent-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setGoogleConsentOpen(false); }}>
        <section className="legal-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="google-consent-title" aria-describedby="google-consent-description">
          <button type="button" className="legal-consent-close" aria-label="Close consent dialog" disabled={pending} onClick={() => setGoogleConsentOpen(false)}>×</button>
          <span className="eyebrow">BEFORE YOU CONTINUE</span>
          <h2 id="google-consent-title">Review and accept</h2>
          <p id="google-consent-description">Google sign-in will create or open your KATALYST account. Please review the current terms and privacy notice. We record the versions and time you accept.</p>
          <label className="login-terms-consent"><input type="checkbox" checked={googleConsentAccepted} onChange={(event) => setGoogleConsentAccepted(event.target.checked)} /><span>I accept the <Link href="/terms" target="_blank">Terms of Service</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>
          <div className="legal-consent-actions"><button type="button" className="secondary-button" disabled={pending} onClick={() => setGoogleConsentOpen(false)}>Cancel</button><button type="button" className="login-submit-button" disabled={pending || !googleConsentAccepted || !accountAvailable} onClick={() => void continueGoogle()}>{pending ? "Opening Google…" : "Accept and continue with Google"}<ArrowRight size={16} /></button></div>
        </section>
      </div>}
    </main>
  );
}
