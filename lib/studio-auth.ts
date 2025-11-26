"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

export function useStudioAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("[studio-auth] getSession failed", err);
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrate();

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe();
    };
  }, [router, supabase]);

  return { user, isAuthenticated: !!user, loading };
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/studio/login";
}
