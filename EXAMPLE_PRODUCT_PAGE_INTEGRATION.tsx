/**
 * Example integration of ProductDetails component into existing product page
 * This shows how to add sizing and material information to your current setup
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { VariantPicker } from '@/components/VariantPicker';
import { ColorSwatch } from '@/components/ColorSwatch';
import { ProductDetails } from '@/components/ProductDetails'; // NEW IMPORT
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

type PreviewMode = 'front' | 'back' | 'combined';
type ImageView = 'front' | 'back' | 'combined';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      const supa = createClient();
      const { data, error } = await supa
        .from('products')
        .select(`
          *,
          product_images (
            id,
            url,
            alt,
            sort,
            color_name,
            color_hex,
            is_primary
          ),
          variants (
            id,
            size,
            price_cents,
            weight_oz,
            active,
            color_name,
            color_hex
          )
        `)
        .eq('slug', params.slug)
        .eq('active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
      }

      setProduct(data);
      setLoading(false);
    }

    fetchProduct();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="card text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <p className="text-neutral-600 mb-6">
            This product doesn&apos;t exist or has been removed.
          </p>
          <Link href="/store" className="btn">
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  const variants = product.variants?.filter((v: any) => v.active) || [];
  const images = product.product_images?.sort((a: any, b: any) => a.sort - b.sort) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Product Images */}
        <div>
          {/* Your existing image display code */}
          {images.length > 0 && (
            <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
              <Image
                src={images[0].url}
                alt={images[0].alt || product.title}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          <p className="text-2xl font-semibold mb-6">
            ${(variants[0]?.price_cents || 0) / 100}
          </p>

          {/* Your existing variant picker, color selector, etc. */}
          <div className="mb-6">
            <VariantPicker variants={variants} />
          </div>

          {/* Add to cart button */}
          <button className="btn btn-primary w-full mb-6">
            Add to Cart
          </button>

          {/* NEW: Product Details Component */}
          <ProductDetails product={product} />
        </div>
      </div>
    </div>
  );
}
