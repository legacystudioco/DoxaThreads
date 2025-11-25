import "./../styles/globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/CartBadge";

export const metadata: Metadata = {
  title: "DOXA Threads | Greek for Glory",
  description: "Greek for Glory. Worn with honor. Backed by faith. American Traditional art meets sacred symbolism. Premium streetwear built to last.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Top announcement bar */}
        <div className="bg-black text-white text-center py-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
          Made to Order • Designed to Honor the Craft • Built to Last
        </div>

        {/* Main header */}
        <header className="border-b border-brand-accent bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 lg:py-6">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="block hover:opacity-70 transition-opacity">
                <Image
                  src="/assets/Doxa_Logo.png"
                  alt="DOXA Threads"
                  width={230}
                  height={70}
                  priority
                  className="h-12 w-auto"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                <Link href="/store" className="nav-link">
                  Shop
                </Link>
                <Link href="/about" className="nav-link">
                  About
                </Link>
                <Link href="/contact" className="nav-link">
                  Contact
                </Link>
                <CartBadge />
              </nav>

              {/* Mobile menu button */}
              <button className="md:hidden p-2" aria-label="Menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile Navigation - horizontal scrollable */}
            <nav className="md:hidden mt-4 pt-4 border-t border-brand-accent overflow-x-auto">
              <div className="flex gap-6 pb-2 min-w-max">
                <Link href="/store" className="nav-link whitespace-nowrap">
                  Shop
                </Link>
                <Link href="/about" className="nav-link whitespace-nowrap">
                  About
                </Link>
                <Link href="/contact" className="nav-link whitespace-nowrap">
                  Contact
                </Link>
                <Link href="/store/cart" className="nav-link whitespace-nowrap">
                  Cart
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-brand-accent bg-white mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Brand column */}
              <div className="space-y-3">
                <div className="text-2xl font-black tracking-tighter">
                  DOXA THREADS
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed max-w-xs">
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
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>Made to order</li>
                  <li>Premium materials</li>
                  <li>Free shipping $75+</li>
                  <li>30-day returns</li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-brand-accent flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-600">
              <p>© {new Date().getFullYear()} DOXA Threads. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/terms" className="hover:text-black">Terms</Link>
                <Link href="/privacy" className="hover:text-black">Privacy</Link>
                <Link href="/shipping" className="hover:text-black">Shipping</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
