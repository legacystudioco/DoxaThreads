"use client";

import Link from "next/link";
import { useState } from "react";

export default function GoogleAnalyticsPage() {
  const [activePage, setActivePage] = useState("page1");

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

      {/* Page Tabs */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActivePage("page1")}
              className={`px-4 py-3 border-b-2 font-semibold transition-colors ${
                activePage === "page1"
                  ? "border-black text-black"
                  : "border-transparent text-neutral-600 hover:text-black"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActivePage("page2")}
              className={`px-4 py-3 border-b-2 font-semibold transition-colors ${
                activePage === "page2"
                  ? "border-black text-black"
                  : "border-transparent text-neutral-600 hover:text-black"
              }`}
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Looker Studio Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <div className="w-full" style={{ minHeight: "900px" }}>
          {activePage === "page1" && (
            <iframe
              width="100%"
              height="900"
              src="https://lookerstudio.google.com/embed/reporting/182e1580-b97a-41b6-b164-3c3f2b103318/page/5uaiF"
              frameBorder="0"
              style={{ border: 0 }}
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            ></iframe>
          )}
          {activePage === "page2" && (
            <iframe
              width="100%"
              height="900"
              src="https://lookerstudio.google.com/embed/reporting/182e1580-b97a-41b6-b164-3c3f2b103318/page/p_q57jcn6xyd"
              frameBorder="0"
              style={{ border: 0 }}
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
}
