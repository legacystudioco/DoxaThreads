import "./../styles/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "DOXA Threads | Greek for Glory",
  description: "Greek for Glory. Worn with honor. Backed by faith. American Traditional art meets sacred symbolism. Premium streetwear built to last.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Top announcement bar */}
        <div className="bg-[var(--ink-black)] text-[var(--paper)] text-center py-2 text-[11px] font-semibold uppercase tracking-[0.16em] border-b border-brand-accent">
          Made to Order • Designed to Honor the Craft • Built to Last
        </div>

        <Header />

        {/* Main content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-brand-accent bg-[var(--paper)] mt-20">
          <div className="container mx-auto py-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Brand column */}
              <div className="space-y-3">
                <div className="mb-2">
                  <Image
                    src="/assets/Doxa_Logo.png"
                    alt="DOXA Threads Logo"
                    width={200}
                    height={60}
                    className="h-14 w-auto"
                  />
                </div>
                <p className="text-sm leading-relaxed max-w-xs text-[rgba(30,42,68,0.8)]">
                  Greek for Glory. Premium streetwear built with purpose. Worn with honor. Backed by faith.
                </p>
              </div>

              {/* Quick links */}
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/store" className="hover:underline">Shop</Link></li>
                  <li><Link href="/about" className="hover:underline">About</Link></li>
                  <li><Link href="/contact" className="hover:underline">Contact</Link></li>
                </ul>
              </div>

              {/* Info */}
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Information</h4>
                <ul className="space-y-2 text-sm text-[rgba(30,42,68,0.8)]">
                  <li>Made to order</li>
                  <li>Premium materials</li>
                  <li>Free shipping $75+</li>
                  <li>14-day size exchange only</li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-brand-accent flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[rgba(30,42,68,0.8)]">
              <p>© {new Date().getFullYear()} DOXA Threads. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/terms" className="hover:text-[var(--blood-red)]">Terms</Link>
                <Link href="/privacy" className="hover:text-[var(--blood-red)]">Privacy</Link>
                <Link href="/shipping" className="hover:text-[var(--blood-red)]">Shipping</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
