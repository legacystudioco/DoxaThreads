"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import Image from "next/image";
import NewsletterPopup from "@/components/NewsletterPopup";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supa = createClient();
      
      // Fetch products - use homepage_sort_order for Latest Drops section
      const { data: productsData, error: productsError } = await supa
        .from("products")
        .select(`
          *,
          product_images (
            id,
            url,
            alt,
            sort,
            is_primary
          ),
          variants (
            id,
            size,
            price_cents,
            active
          )
        `)
        .eq("active", true)
        .order("homepage_sort_order", { ascending: true, nullsFirst: false })
        .limit(4);

      if (productsError) {
        console.error("Error fetching products:", productsError);
      } else {
        setProducts(productsData || []);
      }
      setLoadingProducts(false);
    }

    fetchData();
  }, []);

  return (
    <>
      <NewsletterPopup />
      {/* Hero Section - extended to top to eliminate gap */}
      <section className="hero relative min-h-[18vh] overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(110,90,60,0.04)_0%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.10)_100%),linear-gradient(to_bottom,#24211B,#1A1713)] bg-no-repeat bg-cover -mt-12 lg:-mt-16 pt-12 lg:pt-16">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image
            src="/assets/Doxa_Overlay.png"
            alt="DOXA Threads hero overlay"
            width={4461}
            height={1529}
            className="w-full h-full object-cover opacity-90"
            priority
          />
        </div>
        <div className="relative z-10 container text-center flex flex-col items-center gap-0 py-0 pt-1 pb-0">
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <div className="flex items-start justify-center w-full pt-0 -mb-1">
              <Image
                src="/assets/Doxa_Threads_Logo.png"
                alt="DOXA Threads logo"
                width={1200}
                height={400}
                className="w-[75%] sm:w-[65%] max-w-[820px] h-auto object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                priority
              />
            </div>
            <h1 className="sr-only">DOXA THREADS</h1>
            <div className="flex flex-col items-center">
              {/* Mobile: smaller font to fit one line, Desktop: normal size */}
              <p className="text-[13px] sm:text-lg lg:text-xl mb-0 mt-1 max-w-2xl mx-auto font-normal tracking-tight text-[rgba(243,232,216,0.92)] text-center whitespace-nowrap px-2">
                <span className="sm:hidden">Greek for Glory. | Worn with Honor. | Backed By Faith.</span>
                <span className="hidden sm:inline">Greek for Glory. Worn with honor. Backed by faith.</span>
              </p>
              {/* Side-by-side buttons on all screen sizes, smaller on mobile */}
              <div className="flex flex-row gap-2 justify-center mt-2 w-full px-4">
                <Link href="/store" className="btn px-4 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm whitespace-nowrap flex-1 text-center">
                  Shop the Collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll Down Indicator */}
      <div className="flex justify-center -mt-8 mb-4 relative z-20 pointer-events-none">
        <svg
          className="w-6 h-6 text-[#6E5A3C] animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-24">
        {/* Featured Products */}
        <section className="mb-20">
          {/* Desktop layout: side-by-side, Mobile: centered stack */}
          <div className="flex flex-col items-center gap-4 mb-8 md:flex-row md:items-end md:justify-between">
            <div className="text-center md:text-left">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                Latest Drops
              </h2>
              <p className="text-neutral-600 text-sm md:text-base">
                Built to last. Made to mean something.
              </p>
            </div>
            <Link href="/store" className="btn-secondary px-6 py-2 text-sm whitespace-nowrap">
              VIEW ALL
            </Link>
          </div>

          {/* Product grid with real products */}
          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product: any) => {
                const primaryImage = product.product_images?.find((img: any) => img.is_primary);
                const sortedImages = [...(product.product_images || [])].sort((a: any, b: any) => a.sort - b.sort);
                const firstImage = primaryImage || sortedImages[0];
                const activeVariants = product.variants?.filter((v: any) => v.active) || [];
                const minPrice = activeVariants.length 
                  ? Math.min(...activeVariants.map((v: any) => v.price_cents))
                  : 0;

                // Skip products with placeholder or invalid image URLs
                const hasValidImage = firstImage && 
                  firstImage.url && 
                  !firstImage.url.includes('placeholder-url') &&
                  !firstImage.url.includes('example.com');

                return (
                  <div 
                    key={product.id}
                    className="product-card group"
                  >
                    <Link 
                      href={`/store/products/${product.slug}`} 
                      className="block"
                    >
                      <div className="product-image">
                        {hasValidImage ? (
                        <Image
                          src={firstImage.url}
                          alt={firstImage.alt || product.title}
                          width={600}
                          height={600}
                          className="w-full h-full object-contain bg-transparent"
                        />
                        ) : (
                          <>
                            {/* Placeholder until product imagery is uploaded */}
                            <Image
                              src="/placeholders/product-square.svg"
                              alt="Placeholder for upcoming product imagery"
                              width={600}
                              height={600}
                              className="w-full h-full object-contain bg-transparent"
                            />
                          </>
                        )}
                      </div>
                    </Link>
                    <Link 
                      href={`/store/products/${product.slug}`} 
                      className="block"
                    >
                      <h3 className="product-title">{product.title}</h3>
                      <p className="product-price">
                        From ${(minPrice / 100).toFixed(2)}
                      </p>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[rgba(30,42,68,0.8)] mb-4">New pieces in production.</p>
              <Link href="/store" className="btn-secondary">
                View Store
              </Link>
            </div>
          )}
        </section>

        {/* What is DOXA */} 
        <section className="mb-16 text-black">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-center mb-7 flex items-center justify-center gap-3">
            <span>What Is</span>
            <Image src="/assets/Doxa_Logo.png" alt="DOXA" width={160} height={48} className="h-12 sm:h-14 w-auto" />
            <span>?</span>
          </h2>
          <div className="max-w-4xl mx-auto space-y-5 text-center text-black">
            <p className="text-lg sm:text-xl">DOXA (δόξα) — Greek for glory. The visible presence of God.</p>
            <p className="text-lg sm:text-xl">American Traditional art meets sacred symbolism. Premium streetwear built to honor the craft.</p>
            <p className="text-lg sm:text-xl text-[rgba(30,42,68,0.8)]">Designed to last. Made to mean something.</p>
          </div>
        </section>

        {/* Call to Action */}
        <section className="grid md:grid-cols-2 gap-8 mb-20">
          {/* About Card */}
          <div className="card text-center">
            <div className="mb-4">
              <div className="w-12 h-12 bg-[var(--ink-black)] text-[var(--paper)] flex items-center justify-center mb-4 border border-[var(--mustard-gold)] mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                What is DOXA?
              </h3>
              <p className="text-[rgba(30,42,68,0.8)] leading-relaxed mb-4">
                Worn with honor. Backed by faith. Quality built to honor the craft.
              </p>
            </div>
            <Link href="/about" className="btn-secondary w-full">
              Read More
            </Link>
          </div>

          {/* Mission Card */}
          <div className="card text-center">
            <div className="mb-4">
              <div className="w-12 h-12 bg-[var(--storm-blue)] text-[var(--paper)] flex items-center justify-center mb-4 border border-[var(--mustard-gold)] mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                Built to Last
              </h3>
              <p className="text-[rgba(30,42,68,0.8)] leading-relaxed mb-4">
                Heavyweight cotton. Bold traditional design. Made to last.
              </p>
            </div>
            <Link href="/contact" className="btn w-full">
              Get in Touch
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
