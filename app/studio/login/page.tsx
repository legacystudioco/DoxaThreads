"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

const getLS = (k: string) => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(k); } catch { return null; }
};

export default function StudioLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const [dbg, setDbg] = useState<{ hasToken: boolean; userId: string | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [userRes, sessRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      if (!mounted) return;
      const user = userRes.data.user;
      const session = sessRes.data.session;
      console.log("[login] getUser:", { user, error: userRes.error });
      console.log("[login] getSession:", { hasToken: !!session?.access_token, error: sessRes.error });
      setDbg({ hasToken: !!session?.access_token, userId: user?.id ?? null });
      // Removed auto-redirect to dashboard if user exists
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else if (data.user) {
        router.replace("/studio/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">DOXA THREADS</h1>
            <p className="text-neutral-600">Studio Admin Login</p>
          </div>
          <div className="flex justify-center"><div className="spinner border-2" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              DOXA THREADS
            </h1>
          </Link>
          <p className="text-neutral-600">Studio Admin Login</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert-error">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn w-full text-base py-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner border-2"></div>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-600">
              Need access? Contact the administrator
            </p>
          </div>

          <p className="mt-6 text-xs text-neutral-500 text-center">
            Need help? Add <code>?debug=1</code> to this URL to show login debug info.
          </p>

          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug') && (
            <div className="mt-6 rounded border-2 border-dashed border-neutral-400 bg-neutral-50 p-4 text-sm">
              <div className="font-semibold mb-2">Debug</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>LocalStorage key present: <span className="font-mono">{String(!!getLS('sb-') || (!!(typeof window!== 'undefined' && window.localStorage) && Object.keys(localStorage).some(k => k.startsWith('sb-'))))}</span></div>
                <div>Session token present: <span className="font-mono">{String(dbg?.hasToken)}</span></div>
                <div>User ID: <span className="font-mono">{dbg?.userId ?? 'null'}</span></div>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-secondary" onClick={async () => {
                  await supabase.auth.signOut();
                  try { localStorage.clear(); } catch {}
                  setDbg({ hasToken: false, userId: null });
                  console.log('[login] signed out and cleared storage');
                }}>Sign out & Clear Storage</button>
                <button type="button" className="btn-secondary" onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  const { data: { user } } = await supabase.auth.getUser();
                  setDbg({ hasToken: !!session?.access_token, userId: user?.id ?? null });
                  console.log('[login] refreshed debug');
                }}>Refresh Debug</button>
              </div>
            </div>
          )}
        </div>

        {/* Back to Site */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm hover:underline">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
