"use client";

import { useEffect, useState } from "react";

export function PwaStatus() {
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const syncOnline = () => setOffline(!navigator.onLine);
    syncOnline();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);

    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const checkWaiting = () => {
      if (!disposed && registration?.waiting) setUpdateReady(true);
    };
    const onStateChange = () => {
      if (!disposed && installing?.state === "installed" && navigator.serviceWorker.controller) {
        setUpdateReady(true);
      }
    };
    const onUpdateFound = () => {
      installing?.removeEventListener("statechange", onStateChange);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", onStateChange);
    };
    const checkUpdate = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void registration?.update().catch(() => {});
      }
    };

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((result) => {
          if (disposed) return;
          registration = result;
          checkWaiting();
          registration.addEventListener("updatefound", onUpdateFound);
          onUpdateFound();
          document.addEventListener("visibilitychange", checkUpdate);
        })
        .catch((error: unknown) => console.error("PWA registration failed", error));
    }

    return () => {
      disposed = true;
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
      document.removeEventListener("visibilitychange", checkUpdate);
      registration?.removeEventListener("updatefound", onUpdateFound);
      installing?.removeEventListener("statechange", onStateChange);
    };
  }, []);

  if (!offline && !updateReady) return null;
  return (
    <div role="status" className="border-b border-border bg-card px-4 py-2 text-center text-sm text-foreground">
      {offline
        ? "You're offline. Live data and call controls need an internet connection."
        : "An update is ready. After your call, close all app windows and tabs, then reopen."}
    </div>
  );
}
