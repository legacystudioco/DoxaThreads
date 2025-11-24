import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Studio • DOXA Threads",
  description: "Admin tools for managing products and content.",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal wrapper so /studio pages (including /studio/login) always render
  return <>{children}</>;
}
