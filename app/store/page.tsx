"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import Image from "next/image";
import { ImageZoom } from "@/components/ImageZoom";

export default function StorePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("adult");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category tabs (Adult vs Kids)
  const categoryTabs = [
    { id: "adult", label: "Adult" },
    { id: "kids", label: "Kids" },
  ];

  // Style filters for Adult
  const adultStyles = [
    { id: "all", label: "All" },
    { id: "tees", label: "Tees" },
    { id: "hoodies", label: "Hoodies" },
    { id: "crewnecks", label: "Crewnecks" },
  ];

  // Style filters for Kids
  const kidsStyles = [
    { id: "all", label: "All" },
    { id: "youth_tees", label: "Youth Tees" },
    { id: "youth_hoodies", label: "Youth Hoodies" },
    { id: "youth_longsleeves", label: "Youth Longsleeves" },
  ];

  const currentStyles = selectedCategory === "adult" ? adultStyles : kidsStyles;

  useEffect(() => {
    async function fetchProducts() {
      const supa = createClient();
      
      // Fetch products from Supabase - use store_sort_order for proper arrangement
      const { data, error } = await supa
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
        .order("store_sort_order", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching products:", error);
        setError(error.message);
      } else {
        setProducts(data || []);
      }
      
      setLoading(false);
    }

    fetchProducts();
  }, []);

  // Reset style filter when category changes
  useEffect(() => {
    setSelectedStyle("all");
  }, [selectedCategory]);

  const filteredProducts = products.filter((product: any) => {
    const style = (product.style || "").toLowerCase();
    const title = (product.title || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    // Filter by search query first
    if (query && !title.includes(query)) {
      return false;
    }

    // Filter by category
    const isYouthProduct = style.includes("youth");
    if (selectedCategory === "adult" && isYouthProduct) return false;
    if (selectedCategory === "kids" && !isYouthProduct) return false;

    // Then filter by style
    if (selectedStyle === "all") return true;

    if (selectedStyle === "hoodies") return style.includes("hoodie") && !style.includes("youth");
    if (selectedStyle === "crewnecks") return style.includes("crewneck") || style.includes("crew neck");
    if (selectedStyle === "tees") return (style.includes("tee") || style.includes("t-shirt") || style.includes("shirt")) && !style.includes("youth") && !style.includes("longsleeve");

    if (selectedStyle === "youth_tees") return style.includes("youth") && (style.includes("tee") || style.includes("t-shirt")) && !style.includes("longsleeve");
    if (selectedStyle === "youth_hoodies") return style.includes("youth") && style.includes("hoodie");
    if (selectedStyle === "youth_longsleeves") return style.includes("youth") && style.includes("longsleeve");

    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          The Collection
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          American Traditional art meets sacred symbolism. Built to honor the craft.
        </p>
        <div className="badge-outline mt-6">
          Made to order in 7–10 business days
        </div>
      </div>

      {/* Search Box */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search designs..."
            className="w-full px-4 py-3 pr-12 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-neutral-600 mt-2">
            Showing results for "<span className="font-bold">{searchQuery}</span>"
          </p>
        )}
      </div>

      {/* Category Tabs (Adult vs Kids) */}
      <div className="flex justify-center gap-4 mb-6">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-8 py-3 border-2 text-base font-bold uppercase tracking-wider transition-colors ${
              selectedCategory === tab.id 
                ? "bg-black text-white border-black" 
                : "border-black text-black hover:bg-black hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Style Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {currentStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => setSelectedStyle(style.id)}
            className={`px-4 py-2 border-2 text-sm font-bold uppercase tracking-wider transition-colors ${
              selectedStyle === style.id 
                ? "bg-black text-white border-black" 
                : "border-black text-black hover:bg-black hover:text-white"
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card border border-black/50 mb-8 text-center py-8">
          <h3 className="text-xl font-bold mb-2">Error Loading Products</h3>
          <p className="text-neutral-700">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts && filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product: any) => {
            // First try to find the primary image, fallback to sorted images
            const primaryImage = product.product_images?.find((img: any) => img.is_primary);
            const sortedImages = product.product_images?.sort((a: any, b: any) => a.sort - b.sort);
            const firstImage = primaryImage || sortedImages?.[0];
            
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
              <div key={product.id} className="product-card group">
                <Link 
                  href={`/store/products/${product.slug}`}
                  className="block"
                >
                  <div className="product-image">
                    {hasValidImage ? (
                      <ImageZoom
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
        <div className="card text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="text-2xl font-bold mb-2">
            {selectedCategory === "kids" ? "Kids collection coming soon" : "New pieces in production"}
          </h3>
          <p className="text-neutral-600 mb-6">Check back soon.</p>
          <Link href="/" className="btn">
            Back to Home
          </Link>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-20 py-12 border-t border-brand-accent">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-12">
          What You Get
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-black mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Premium Quality</h4>
              <p className="text-sm text-neutral-600">
                Heavyweight cotton. Professional printing.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-black mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Made to Order</h4>
              <p className="text-sm text-neutral-600">
                Quality built to honor the craft.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-black mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Easy Returns</h4>
              <p className="text-sm text-neutral-600">
                14-day size exchange only.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}
