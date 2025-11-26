"use client";

import Link from "next/link";
import { useStudioAuth, logout } from "@/lib/studio-auth";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

// Enable debug panel when visiting /studio/dashboard?debug=1
const isDebugEnabled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

export default function StudioDashboard() {
  const { isAuthenticated, loading } = useStudioAuth();
  const supabase = createClient();

  const router = useRouter();

  // --- DEBUG STATE ---
  const [dbg, setDbg] = useState<{ userId: string | null; hasAccessToken: boolean; authLoading: boolean; }>({
    userId: null,
    hasAccessToken: false,
    authLoading: true,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [{ data: { user }, error: userErr }, { data: { session }, error: sessErr }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);
        if (!mounted) return;
        console.debug('[dashboard] getUser', { user, userErr });
        console.debug('[dashboard] getSession', { hasToken: !!session?.access_token, sessErr });
        setDbg({
          userId: user?.id ?? null,
          hasAccessToken: !!session?.access_token,
          authLoading: false,
        });
      } catch (err) {
        console.error("[dashboard] auth bootstrap failed", err);
        if (!mounted) return;
        setDbg({
          userId: null,
          hasAccessToken: false,
          authLoading: false,
        });
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      console.debug('[dashboard] onAuthStateChange', { evt: _evt, hasToken: !!session?.access_token });
      setDbg((d) => ({ ...d, userId: session?.user?.id ?? null, hasAccessToken: !!session?.access_token }));
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [supabase]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/studio/login");
    }
  }, [loading, isAuthenticated, router]);
  
  const [stats, setStats] = useState({
    orderCount: 0,
    productCount: 0,
    unbatchedCount: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const [{ count: productCount }, { count: orderCount }, { count: unbatchedCount }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("printer_payable_status", "UNBATCHED"),
      ]);

      setStats({
        productCount: productCount || 0,
        orderCount: orderCount || 0,
        unbatchedCount: unbatchedCount || 0,
      });
    } catch (e) {
      console.warn("Failed to load stats (likely RLS if unauthenticated)", e);
      console.debug('[dashboard] debug snapshot', dbg);
      setStats({ productCount: 0, orderCount: 0, unbatchedCount: 0 });
    }
  }, [supabase, dbg]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated, loadStats]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          {isDebugEnabled && <div className="text-xs text-neutral-500 mb-4">[debug] waiting for auth…</div>}
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-sm text-neutral-600">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {isDebugEnabled && (
        <div className="mb-6 rounded border-2 border-dashed border-neutral-400 bg-neutral-50 p-4 text-sm">
          <div className="font-semibold mb-1">Debug</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>Auth Loading: <span className="font-mono">{String(loading)}</span></div>
            <div>User ID: <span className="font-mono">{dbg.userId ?? 'null'}</span></div>
            <div>Has Access Token: <span className="font-mono">{String(dbg.hasAccessToken)}</span></div>
          </div>
          <p className="mt-2 text-neutral-600">Tip: remove <code>?debug=1</code> from the URL to hide this panel.</p>
        </div>
      )}
      {/* Header with Logout */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Studio Dashboard</h1>
          <p className="text-neutral-600">Manage your products, orders, and settlements</p>
        </div>
        <button onClick={logout} className="btn-secondary text-sm">
          Logout
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.orderCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Products</div>
          <div className="stat-value">{stats.productCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unbatched Orders</div>
          <div className="stat-value">{stats.unbatchedCount}</div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Link href="/studio/products" className="card hover:shadow-lg transition-shadow group">
          <div className="mb-4">
            <div className="w-12 h-12 bg-black group-hover:bg-neutral-800 transition-colors flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Products</h3>
            <p className="text-sm text-neutral-600">
              Manage product catalog, variants, and pricing
            </p>
          </div>
          <div className="text-sm font-medium flex items-center gap-2">
            View Products
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/studio/orders" className="card hover:shadow-lg transition-shadow group">
          <div className="mb-4">
            <div className="w-12 h-12 bg-black group-hover:bg-neutral-800 transition-colors flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Orders</h3>
            <p className="text-sm text-neutral-600">
              View and manage customer orders and fulfillment
            </p>
          </div>
          <div className="text-sm font-medium flex items-center gap-2">
            View Orders
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/studio/settlements" className="card hover:shadow-lg transition-shadow group">
          <div className="mb-4">
            <div className="w-12 h-12 bg-black group-hover:bg-neutral-800 transition-colors flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Settlements</h3>
            <p className="text-sm text-neutral-600">
              Batch orders and manage printer payments
            </p>
          </div>
          <div className="text-sm font-medium flex items-center gap-2">
            View Settlements
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/studio/analytics" className="card hover:shadow-lg transition-shadow group">
          <div className="mb-4">
            <div className="w-12 h-12 bg-black group-hover:bg-neutral-800 transition-colors flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Analytics</h3>
            <p className="text-sm text-neutral-600">
              Track sales, revenue, and performance metrics
            </p>
          </div>
          <div className="text-sm font-medium flex items-center gap-2">
            View Analytics
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

      </div>

      {/* Quick Actions */}
      <div className="mt-12 card">
        <h2 className="font-bold text-xl mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary text-sm">
            View Live Site
          </Link>
          <Link href="/store" className="btn-secondary text-sm">
            View Store
          </Link>
        </div>
      </div>
    </div>
  );
}
