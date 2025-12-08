"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

function MetaPixelInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize Meta Pixel
    if (typeof window !== "undefined" && !window.fbq) {
      (function (f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod
            ? n.callMethod.apply(n, arguments)
            : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        "script",
        "https://connect.facebook.net/en_US/fbevents.js"
      );

      window.fbq("init", "2253529748448994");
      window.fbq("track", "PageView");
    }
  }, []);

  useEffect(() => {
    // Track page views on route changes
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  return (
    <>
      <Suspense fallback={null}>
        <MetaPixelInner />
      </Suspense>
      {/* Meta Pixel noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=2253529748448994&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  );
}
