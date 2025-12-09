"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Generate a session ID that persists in sessionStorage
function getSessionId() {
  if (typeof window === "undefined") return null;
  
  let sessionId = sessionStorage.getItem("visitor_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem("visitor_session_id", sessionId);
  }
  return sessionId;
}

export function VisitorTracker() {
  const pathname = usePathname();
  const trackedPaths = useRef(new Set<string>());

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith("/studio") || pathname.startsWith("/admin")) {
      return;
    }

    // Don't track static assets or API routes
    const isAsset = pathname.startsWith('/assets/') ||
                   pathname.startsWith('/_next/') ||
                   pathname.startsWith('/api/') ||
                   pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js|json|xml|txt)$/i);

    if (isAsset) {
      return;
    }

    // Prevent duplicate tracking
    const pathKey = pathname;
    if (trackedPaths.current.has(pathKey)) {
      return;
    }

    // Check sessionStorage for persistence across re-renders
    const sessionId = getSessionId();
    if (!sessionId) {
      return;
    }

    const storageKey = `visited_${sessionId}`;
    const visitedPages = sessionStorage.getItem(storageKey);
    if (visitedPages) {
      const visited = JSON.parse(visitedPages);
      if (visited.includes(pathname)) {
        trackedPaths.current.add(pathKey);
        return;
      }
    }

    async function trackVisit() {
      try {
        const sessionId = getSessionId();
        if (!sessionId) return;

        console.log("[VisitorTracker] Tracking visit:", pathname);

        // Use server-side API route to track visitor
        // This bypasses RLS issues by using the service role key
        const response = await fetch("/api/track-visitor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            page_path: pathname,
            referrer: typeof document !== "undefined" ? document.referrer || null : null,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          }),
        });

        if (!response.ok) {
          console.error("[VisitorTracker] Failed to track visitor:", response.status);
          return;
        }

        const data = await response.json();
        if (data.success) {
          console.log("[VisitorTracker] ✅ Successfully tracked visit:", data.id);
          
          // Mark this path as tracked
          trackedPaths.current.add(pathKey);

          // Persist to sessionStorage
          const visitedPages = sessionStorage.getItem(storageKey);
          const visited = visitedPages ? JSON.parse(visitedPages) : [];
          if (!visited.includes(pathname)) {
            visited.push(pathname);
            sessionStorage.setItem(storageKey, JSON.stringify(visited));
          }
        }
      } catch (error) {
        console.error("[VisitorTracker] Error tracking visitor:", error);
      }
    }

    // Track on page load with a small delay
    const timer = setTimeout(trackVisit, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
