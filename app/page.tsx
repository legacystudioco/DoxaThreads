"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supa = createClient();
      
      // Fetch products
      const { data: productsData, error: productsError } = await supa
        .from("products")
        .select(`
          *,
          product_images (
            id,
            url,
            alt,
            sort
          ),
          variants (
            id,
            size,
            price_cents,
            active
          )
        `)
        .eq("active", true)
        .order("created_at", { ascending: false })
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
      {/* Hero Section */}
      <section className="hero min-h-[18vh] overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(110,90,60,0.06)_0%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.12)_100%),linear-gradient(to_bottom,#1C1A16,#100F0D)] bg-no-repeat bg-cover">
        <div className="relative container text-center flex flex-col items-center gap-0 py-0 pt-1 pb-0">
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <div className="flex items-start justify-center w-full pt-0 mb-0">
              <Image
                src="/assets/Doxa_Threads_Logo.png"
                alt="DOXA Threads logo"
                width={1200}
                height={400}
                className="w-[65%] max-w-[820px] h-auto object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.25)]"
                priority
              />
            </div>
            <h1 className="sr-only">DOXA THREADS</h1>
            <div className="flex flex-col items-center">
              <p className="text-lg lg:text-xl mb-0 mt-0 max-w-2xl mx-auto font-normal tracking-tight text-[rgba(243,232,216,0.9)]">
                Greek for Glory. Worn with honor. Backed by faith.
              </p>
              <div className="flex flex-col sm:flex-row gap-1 justify-center mt-0">
                <Link href="/store" className="btn px-5 py-3 text-sm sm:text-xs">
                  Shop the Collection
                </Link>
                <Link href="/about" className="btn-secondary px-5 py-3 text-sm sm:text-xs">
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 lg:py-24">
        {/* What is DOXA */} 
        <section className="mb-16 text-black">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-center mb-6 flex items-center justify-center gap-3">
            <span>What Is</span>
            <Image src="/assets/Doxa_Logo.png" alt="DOXA" width={160} height={48} className="h-11 w-auto" />
            <span>?</span>
          </h2>
          <div className="max-w-4xl mx-auto space-y-4 text-center text-black">
            <p>DOXA (δόξα) — Greek for glory. The visible presence of God.</p>
            <p>American Traditional art meets sacred symbolism. Premium streetwear built to honor the craft.</p>
            <p className="text-[rgba(30,42,68,0.8)]">Designed to last. Made to mean something.</p>
          </div>
        </section>

        {/* Featured Products */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                Latest Drops
              </h2>
              <p className="text-neutral-600">
                Built to last. Made to mean something.
              </p>
            </div>
            <Link href="/store" className="btn-secondary text-xs">
              View All
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
                const firstImage = product.product_images?.sort((a: any, b: any) => a.sort - b.sort)[0];
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
                  <Link 
                    key={product.id} 
                    href={`/store/products/${product.slug}`} 
                    className="product-card group"
                  >
                    <div className="product-image">
                      {hasValidImage ? (
                        <Image
                          src={firstImage.url}
                          alt={firstImage.alt || product.title}
                          width={600}
                          height={600}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <>
                          {/* Placeholder until product imagery is uploaded */}
                          <Image
                            src="/placeholders/product-square.svg"
                            alt="Placeholder for upcoming product imagery"
                            width={600}
                            height={600}
                            className="w-full h-full object-cover"
                          />
                        </>
                      )}
                    </div>
                    <h3 className="product-title">{product.title}</h3>
                    <p className="product-price">
                      From ${(minPrice / 100).toFixed(2)}
                    </p>
                  </Link>
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

        {/* Call to Action */}
        <section className="grid md:grid-cols-2 gap-8 mb-20">
          {/* About Card */}
          <div className="card">
            <div className="mb-4">
              <div className="w-12 h-12 bg-[var(--ink-black)] text-[var(--paper)] flex items-center justify-center mb-4 border border-[var(--mustard-gold)]">
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
          <div className="card">
            <div className="mb-4">
              <div className="w-12 h-12 bg-[var(--storm-blue)] text-[var(--paper)] flex items-center justify-center mb-4 border border-[var(--mustard-gold)]">
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
