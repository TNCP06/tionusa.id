"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function VisitorBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    const search = searchParams?.toString();
    const fullPath = pathname + (search ? `?${search}` : "");
    if (lastTracked.current === fullPath) return;
    lastTracked.current = fullPath;

    // Small debounce to ensure page has loaded and not block initial paint
    const timer = setTimeout(() => {
      try {
        const isBlog = typeof window !== "undefined" && window.location.hostname.startsWith("blog.");
        const payload = JSON.stringify({
          path: fullPath,
          host: isBlog ? "blog" : "site",
          referer: typeof document !== "undefined" ? document.referrer : undefined,
        });

        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/visit", blob);
        } else {
          fetch("/api/visit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Silent catch — analytics beacon must never break the client UI
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
