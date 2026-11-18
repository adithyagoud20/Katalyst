"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "@/lib/pwa-install";

export function PwaRegister() {
  useEffect(() => {
    const stopCapturingInstallPrompt = captureInstallPrompt();
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return stopCapturingInstallPrompt;
    }

    let refreshingAfterUpdate = false;
    let activeController = navigator.serviceWorker.controller;
    const onControllerChange = () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return;
      if (!activeController) {
        activeController = controller;
        return;
      }
      if (controller !== activeController && !refreshingAfterUpdate) {
        refreshingAfterUpdate = true;
        window.location.reload();
      }
      activeController = controller;
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => undefined);

    return () => {
      stopCapturingInstallPrompt();
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
