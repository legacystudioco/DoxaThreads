"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith("/studio")) {
      return;
    }

    async function trackVisit() {
      try {
        const sessionId = getSessionId();
        const supabase = createClient();

        // Get location data from ipapi.co (free tier: 30k requests/month)
        let locationData = null;
        try {
          const locationResponse = await fetch("https://ipapi.co/json/");
          if (locationResponse.ok) {
            locationData = await locationResponse.json();
          }
        } catch (error) {
          console.warn("Failed to fetch location data:", error);
        }

        // Track the visit
        const { error } = await supabase.from("visitor_events").insert({
          session_id: sessionId,
          page_path: pathname,
          referrer: typeof document !== "undefined" ? document.referrer : null,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          city: locationData?.city || null,
          region: locationData?.region || null,
          country: locationData?.country_name || null,
          country_code: locationData?.country_code || null,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          ip_address: locationData?.ip || null,
        });

        if (error) {
          console.warn("Failed to track visitor:", error);
        }
      } catch (error) {
        console.warn("Visitor tracking error:", error);
      }
    }

    // Track on page load with a small delay to not block rendering
    const timer = setTimeout(trackVisit, 1000);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  return null; // This component doesn't render anything
}
