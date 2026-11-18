"use client";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredInstallPrompt: InstallPromptEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

function notifyListeners() {
  for (const listener of listeners) listener(Boolean(deferredInstallPrompt));
}

export function captureInstallPrompt(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    deferredInstallPrompt = event as InstallPromptEvent;
    notifyListeners();
  };
  const handleAppInstalled = () => {
    deferredInstallPrompt = null;
    notifyListeners();
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.removeEventListener("appinstalled", handleAppInstalled);
  };
}

export function getInstallPromptAvailable() {
  return Boolean(deferredInstallPrompt);
}

export function subscribeToInstallPrompt(listener: (available: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function showInstallPrompt() {
  const prompt = deferredInstallPrompt;
  if (!prompt) return null;
  deferredInstallPrompt = null;
  notifyListeners();
  await prompt.prompt();
  return prompt.userChoice;
}
