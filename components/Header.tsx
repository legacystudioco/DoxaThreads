"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/CartBadge";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="bg-[var(--paper)] sticky top-0 z-50 relative border-b-2 border-brand-accent mb-12 lg:mb-16">
      <div className="container mx-auto py-0">
        <div className="flex items-end justify-between">
          {/* Logo with circular background - overlaps the bottom border at halfway point */}
          <Link
            href="/"
            className="block relative"
            style={{ zIndex: 10, marginBottom: "-75px" }}
            onClick={closeMenu}
          >
            <div className="relative w-[150px] h-[150px] lg:w-[185px] lg:h-[185px]">
              {/* Circular background with shadow */}
              <div className="absolute inset-0 rounded-full bg-[var(--paper)] border-2 border-[var(--line)] shadow-lg"></div>
              {/* Logo */}
              <div className="absolute inset-0 flex items-center justify-center p-5">
                <Image
                  src="/assets/Doxa_Circle.png"
                  alt="DOXA Threads logo"
                  width={240}
                  height={240}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="nav-link !text-base lg:!text-lg font-bold uppercase tracking-[0.15em]">
              HOME
            </Link>
            <Link href="/store" className="nav-link !text-base lg:!text-lg font-bold uppercase tracking-[0.15em]">
              SHOP
            </Link>
            <Link href="/about" className="nav-link !text-base lg:!text-lg font-bold uppercase tracking-[0.15em]">
              ABOUT
            </Link>
            <Link href="/contact" className="nav-link !text-base lg:!text-lg font-bold uppercase tracking-[0.15em]">
              CONTACT
            </Link>
            <div className="scale-[1.4]">
              <CartBadge />
            </div>
          </nav>

          {/* Mobile menu button and cart */}
          <div className="md:hidden flex items-center gap-3">
            <CartBadge />
            <button
              className="p-2"
              aria-label="Menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - dropdown from the right */}
        <nav
          id="mobile-nav"
          className={`md:hidden absolute right-0 top-full bg-[var(--paper)] border-2 border-brand-accent rounded-bl-lg shadow-lg transition-all duration-200 ${
            mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
          style={{ minWidth: '200px' }}
        >
          <div className="flex flex-col py-2">
            <Link href="/store" className="nav-link px-6 py-3 hover:bg-neutral-50 whitespace-nowrap" onClick={closeMenu}>
              Shop
            </Link>
            <Link href="/about" className="nav-link px-6 py-3 hover:bg-neutral-50 whitespace-nowrap" onClick={closeMenu}>
              About
            </Link>
            <Link href="/contact" className="nav-link px-6 py-3 hover:bg-neutral-50 whitespace-nowrap" onClick={closeMenu}>
              Contact
            </Link>
            <Link href="/store/cart" className="nav-link px-6 py-3 hover:bg-neutral-50 whitespace-nowrap" onClick={closeMenu}>
              Cart
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
