"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

export default function AuthTestPage() {
  const supabase = createClient();
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    
    const sessionResult = await supabase.auth.getSession();
    const userResult = await supabase.auth.getUser();
    
    // Check localStorage
    const lsKeys = typeof window !== 'undefined' 
      ? Object.keys(localStorage).filter(k => k.startsWith('sb-'))
      : [];
    
    setAuthData({
      session: sessionResult.data.session,
      sessionError: sessionResult.error,
      user: userResult.data.user,
      userError: userResult.error,
      hasAccessToken: !!sessionResult.data.session?.access_token,
      hasUser: !!userResult.data.user,
      localStorageKeys: lsKeys,
      timestamp: new Date().toISOString(),
    });
    
    setLoading(false);
    
    // Log to console
    console.log('🔍 Auth Test Results:', {
      session: sessionResult.data.session,
      user: userResult.data.user,
      errors: {
        session: sessionResult.error,
        user: userResult.error,
      }
    });
  }, [supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    checkAuth();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🔍 Authentication Test</h1>
          <div className="flex justify-center">
            <div className="spinner border-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">🔍 Authentication Test</h1>
          <Link href="/studio/dashboard" className="btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Quick Status */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Quick Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 border ${authData.hasAccessToken ? 'border-brand-accent bg-neutral-50' : 'border-black bg-white'}`}>
              <div className="text-sm text-neutral-600">Session Token</div>
              <div className="text-2xl font-bold">
                {authData.hasAccessToken ? '✅ EXISTS' : '❌ MISSING'}
              </div>
            </div>
            <div className={`p-4 border ${authData.hasUser ? 'border-brand-accent bg-neutral-50' : 'border-black bg-white'}`}>
              <div className="text-sm text-neutral-600">User Object</div>
              <div className="text-2xl font-bold">
                {authData.hasUser ? '✅ EXISTS' : '❌ MISSING'}
              </div>
            </div>
          </div>

          {authData.hasUser && authData.hasAccessToken ? (
            <div className="mt-4 p-4 bg-neutral-100 border border-brand-accent">
              <div className="font-bold text-neutral-900">✅ You are authenticated!</div>
              <div className="text-sm text-neutral-700 mt-1">
                Creating products should work. If you still get errors, it&apos;s an RLS policy issue.
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-white border border-black">
              <div className="font-bold text-neutral-900">❌ You are NOT authenticated!</div>
              <div className="text-sm text-neutral-700 mt-1">
                You need to log in at <Link href="/studio/login" className="underline">/studio/login</Link>
              </div>
            </div>
          )}
        </div>

        {/* User Details */}
        {authData.user && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">User Details</h2>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="font-bold">ID:</div>
                <div className="col-span-2 font-mono text-xs">{authData.user.id}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-bold">Email:</div>
                <div className="col-span-2">{authData.user.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-bold">Created:</div>
                <div className="col-span-2">{new Date(authData.user.created_at).toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-bold">Last Sign In:</div>
                <div className="col-span-2">{new Date(authData.user.last_sign_in_at || authData.user.created_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Session Details */}
        {authData.session && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Session Details</h2>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="font-bold">Access Token:</div>
                <div className="col-span-2 font-mono text-xs truncate">
                  {authData.session.access_token.substring(0, 50)}...
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-bold">Expires At:</div>
                <div className="col-span-2">
                  {new Date(authData.session.expires_at * 1000).toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-bold">Refresh Token:</div>
                <div className="col-span-2 font-mono text-xs truncate">
                  {authData.session.refresh_token ? '(present)' : '(missing)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LocalStorage */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">LocalStorage</h2>
          {authData.localStorageKeys.length > 0 ? (
            <div className="space-y-1">
              <div className="text-sm text-neutral-600 mb-2">
                Found {authData.localStorageKeys.length} Supabase key(s):
              </div>
              {authData.localStorageKeys.map((key: string) => (
                <div key={key} className="font-mono text-xs bg-neutral-100 p-2 border border-brand-accent">
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-800">
              ❌ No Supabase keys found in localStorage!
            </div>
          )}
        </div>

        {/* Errors */}
        {(authData.sessionError || authData.userError) && (
          <div className="card bg-white border border-black mb-6">
            <h2 className="text-xl font-bold mb-4 text-neutral-900">Errors</h2>
            {authData.sessionError && (
              <div className="mb-4">
                <div className="font-bold text-sm">Session Error:</div>
                <pre className="text-xs bg-white p-2 mt-1 overflow-auto">
                  {JSON.stringify(authData.sessionError, null, 2)}
                </pre>
              </div>
            )}
            {authData.userError && (
              <div>
                <div className="font-bold text-sm">User Error:</div>
                <pre className="text-xs bg-white p-2 mt-1 overflow-auto">
                  {JSON.stringify(authData.userError, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={checkAuth}
              className="btn-secondary"
            >
              🔄 Refresh Auth Status
            </button>
            {authData.hasUser && (
              <button
                onClick={handleSignOut}
                className="btn-secondary"
              >
                🚪 Sign Out
              </button>
            )}
            {!authData.hasUser && (
              <Link href="/studio/login" className="btn">
                🔐 Go to Login
              </Link>
            )}
          </div>
        </div>

        {/* Raw Data (for debugging) */}
        <details className="mt-6">
          <summary className="cursor-pointer font-bold text-sm mb-2">
            🔬 Show Raw Data (for debugging)
          </summary>
          <pre className="text-xs bg-neutral-100 p-4 overflow-auto border border-brand-accent">
            {JSON.stringify(authData, null, 2)}
          </pre>
        </details>

        {/* Test timestamp */}
        <div className="text-xs text-neutral-500 mt-4 text-center">
          Last checked: {authData.timestamp}
        </div>
      </div>
    </div>
  );
}
