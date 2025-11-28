"use client";

import { useEffect, useState, useCallback } from "react";
import { useStudioAuth } from "@/lib/studio-auth";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import ProductSortManager from "@/components/ProductSortManager";

export default function ArrangeProductsPage() {
  const { isAuthenticated, loading: authLoading } = useStudioAuth();
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'homepage' | 'store'>('homepage');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    
    const sortField = activeTab === 'homepage' ? 'homepage_sort_order' : 'store_sort_order';
    
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        title,
        slug,
        active,
        homepage_sort_order,
        store_sort_order,
        product_images (
          id,
          url,
          alt,
          is_primary
        )
      `)
      .eq("active", true)
      .order(sortField, { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, [supabase, activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated, loadProducts]);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-neutral-600 mb-6">
          You must be logged in to access this page.
        </p>
        <Link href="/studio/login" className="btn">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Arrange Products</h1>
            <p className="text-neutral-600">
              Control the order of products on your homepage and store page
            </p>
          </div>
          <Link href="/studio/products" className="btn-secondary text-sm">
            ← Back to Products
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b-2 border-neutral-200 mb-6">
          <button
            onClick={() => setActiveTab('homepage')}
            className={`px-6 py-3 font-bold transition-colors border-b-4 -mb-0.5 ${
              activeTab === 'homepage'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Latest Drops (Homepage)
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-6 py-3 font-bold transition-colors border-b-4 -mb-0.5 ${
              activeTab === 'store'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Store Page
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-600 mb-4">No active products found.</p>
          <Link href="/studio/products/new" className="btn">
            Create Your First Product
          </Link>
        </div>
      ) : (
        <ProductSortManager 
          products={products} 
          type={activeTab}
          onSave={loadProducts}
        />
      )}

      <div className="mt-8 p-4 bg-neutral-50 border-2 border-neutral-200 rounded-lg">
        <h3 className="font-bold mb-2">How it works:</h3>
        <ul className="space-y-2 text-sm text-neutral-700">
          <li>• <strong>Latest Drops:</strong> Controls the order of products shown on the homepage "Latest Drops" section (shows first 4 products)</li>
          <li>• <strong>Store Page:</strong> Controls the order of products on the main /store page</li>
          <li>• Drag and drop products to reorder them</li>
          <li>• Click "Save Order" to apply changes</li>
          <li>• Only active products are shown and can be arranged</li>
        </ul>
      </div>
    </div>
  );
}
