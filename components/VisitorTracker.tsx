"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

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
    if (pathname.startsWith("/studio")) {
      return;
    }

    // Prevent duplicate tracking of the same path in quick succession
    const pathKey = pathname;
    if (trackedPaths.current.has(pathKey)) {
      return;
    }

    async function trackVisit() {
      try {
        const sessionId = getSessionId();
        if (!sessionId) {
          console.warn("[VisitorTracker] No session ID available");
          return;
        }

        const supabase = createClient();

        // Get location data from ipapi.co (free tier: 30k requests/month)
        let locationData: any = null;
        try {
          const locationResponse = await fetch("https://ipapi.co/json/", {
            cache: 'no-store'
          });
          if (locationResponse.ok) {
            locationData = await locationResponse.json();
            console.log("[VisitorTracker] Location data fetched:", {
              city: locationData.city,
              region: locationData.region,
              country: locationData.country_name
            });
          } else {
            console.warn("[VisitorTracker] Location API returned:", locationResponse.status);
          }
        } catch (error) {
          console.warn("[VisitorTracker] Failed to fetch location data:", error);
        }

        // Track the visit
        const visitData = {
          session_id: sessionId,
          page_path: pathname,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          city: locationData?.city || null,
          region: locationData?.region || null,
          country: locationData?.country_name || null,
          country_code: locationData?.country_code || null,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          ip_address: locationData?.ip || null,
        };

        console.log("[VisitorTracker] Tracking visit:", {
          page_path: visitData.page_path,
          session_id: visitData.session_id,
          city: visitData.city,
          country: visitData.country,
        });

        const { data, error } = await supabase
          .from("visitor_events")
          .insert(visitData)
          .select();

        if (error) {
          console.error("[VisitorTracker] Failed to track visitor:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          
          // If it's an RLS error, provide helpful message
          if (error.code === '42501') {
            console.error("[VisitorTracker] RLS POLICY ERROR! Anonymous users cannot insert into visitor_events.");
            console.error("[VisitorTracker] Run the fix_visitor_events_rls.sql migration to fix this.");
          }
        } else {
          console.log("[VisitorTracker] ✅ Successfully tracked visit:", data?.[0]?.id);
          // Mark this path as tracked for this session
          trackedPaths.current.add(pathKey);
        }
      } catch (error) {
        console.error("[VisitorTracker] Visitor tracking error:", error);
      }
    }

    // Track on page load with a small delay to not block rendering
    const timer = setTimeout(trackVisit, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  return null; // This component doesn't render anything
}
