"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Download, LoaderCircle } from "lucide-react";
import { getInstallPromptAvailable, showInstallPrompt, subscribeToInstallPrompt } from "@/lib/pwa-install";

function subscribeToStandaloneMode(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

function getStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true);
}

export function DownloadApp() {
  const installAvailable = useSyncExternalStore(subscribeToInstallPrompt, getInstallPromptAvailable, () => false);
  const standalone = useSyncExternalStore(subscribeToStandaloneMode, getStandaloneMode, () => false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const install = async () => {
    if (!installAvailable || pending) return;
    setPending(true);
    setMessage("");
    try {
      const choice = await showInstallPrompt();
      setMessage(choice?.outcome === "accepted" ? "KATALYST is being installed." : choice ? "Install was cancelled. You can use your browser menu anytime." : "Open your browser menu to install KATALYST.");
    } catch {
      setMessage("The browser could not open its install prompt. Use the browser menu to install KATALYST.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="download-install-action">
      {standalone ? (
        <p className="download-installed" role="status"><Check size={16} /> KATALYST is installed on this device.</p>
      ) : installAvailable ? (
        <button className="download-install-button" type="button" onClick={() => void install()} disabled={pending}>
          {pending ? <LoaderCircle size={16} className="c-loading-icon" /> : <Download size={16} />}
          Install KATALYST
        </button>
      ) : (
        <p className="download-install-hint">Use the install option in your browser menu. Safari on iPhone and iPad uses Share → Add to Home Screen.</p>
      )}
      {message && <p className="download-install-message" role="status">{message}</p>}
    </div>
  );
}
