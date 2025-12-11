"use client";

import Link from "next/link";

export default function GoogleAnalyticsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/studio/analytics" className="text-sm hover:underline text-neutral-600 mb-2 inline-block">
              ← Back to Live Analytics
            </Link>
            <h1 className="text-2xl font-bold">Google Analytics 4</h1>
          </div>
        </div>
      </div>

      {/* Embedded Looker Studio Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <div className="w-full" style={{ minHeight: "900px" }}>
          <iframe
            width="100%"
            height="900"
            src="https://lookerstudio.google.com/embed/reporting/182e1580-b97a-41b6-b164-3c3f2b103318/page/p_q57jcn6xyd"
            frameBorder="0"
            style={{ border: 0 }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
