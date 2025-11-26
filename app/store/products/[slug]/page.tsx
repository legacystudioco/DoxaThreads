"use client";

import Image from "next/image";
import Link from "next/link";
import { VariantPicker } from "@/components/VariantPicker";
import { ColorSwatch } from "@/components/ColorSwatch";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

type PreviewMode = "front" | "back" | "combined";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      const supa = createClient();
      const { data, error } = await supa
        .from("products")
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
        .eq("slug", params.slug)
        .eq("active", true)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
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
          <p className="text-neutral-600 mb-6">This product doesn&apos;t exist or has been removed.</p>
          <Link href="/store" className="btn">
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  const variants = product.variants?.filter((v: any) => v.active) || [];
  const images = product.product_images?.sort((a: any, b: any) => a.sort - b.sort) || [];

  return <ProductClient product={product} variants={variants} images={images} />;
}

function ProductClient({ product, variants, images }: any) {
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id || "");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const previewMode: PreviewMode = (product.preview_mode as PreviewMode) || "front";

  // Get unique colors from images - deduplicate by color name
  const availableColors = images
    .filter((img: any) => img.color_name && img.color_hex)
    .reduce((acc: any[], img: any) => {
      if (!acc.find(c => c.name === img.color_name)) {
        acc.push({
          name: img.color_name,
          hex: img.color_hex,
          image: img
        });
      }
      return acc;
    }, []);

  // Get unique sizes from variants
  const availableSizes = Array.from(
    new Set(variants.map((v: any) => v.size))
  ).sort((a: string, b: string) => {
    const sizeOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
    return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
  });

  // Set initial selected color
  useEffect(() => {
    if (availableColors.length > 0 && !selectedColor) {
      const primaryImg = images.find((img: any) => img.is_primary);
      if (primaryImg?.color_name) {
        setSelectedColor(primaryImg.color_name);
      } else {
        setSelectedColor(availableColors[0].name);
      }
    }
  }, [availableColors, images, selectedColor]);

  // Set initial size
  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  // Update selected variant based on color and size
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const matchingVariant = variants.find(
        (v: any) => v.color_name === selectedColor && v.size === selectedSize
      );
      if (matchingVariant) {
        setSelectedVariant(matchingVariant.id);
      } else {
        // If no exact match, just use first variant with matching size
        const sizeMatch = variants.find((v: any) => v.size === selectedSize);
        if (sizeMatch) {
          setSelectedVariant(sizeMatch.id);
        }
      }
    }
  }, [selectedColor, selectedSize, variants]);

  // Get the image to display based on selected color
  const displayImage = selectedColor 
    ? images.find((img: any) => img.color_name === selectedColor) || images[0]
    : images[0];

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVariant) {
      alert("Please select a size and color");
      return;
    }

    // Get existing cart
    const raw = localStorage.getItem("cart");
    const cart = raw ? JSON.parse(raw) : [];
    
    // Get the selected variant data
    const selectedVariantData = variants.find((v: any) => v.id === selectedVariant);
    
    // Check if variant already in cart
    const existingIndex = cart.findIndex((item: any) => item.variantId === selectedVariant);
    
    if (existingIndex >= 0) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({ 
        variantId: selectedVariant, 
        qty, 
        productTitle: product.title,
        selectedColor: selectedColor ? {
          name: selectedColor,
          hex: availableColors.find((c: any) => c.name === selectedColor)?.hex || "#cccccc"
        } : null,
        selectedSize: selectedSize
      });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Dispatch custom event to update cart badge
    window.dispatchEvent(new Event("cartUpdated"));
    
    // Show success message
    const colorText = selectedColor ? ` (${selectedColor})` : "";
    alert(`Added ${qty}x ${product.title} - Size ${selectedSize}${colorText} to cart!`);
  };

  const selectedVariantData = variants.find((v: any) => v.id === selectedVariant);
  const price = selectedVariantData ? (selectedVariantData.price_cents / 100).toFixed(2) : "0.00";

  // Render decoration specs table
  const renderDecorationSpecs = () => {
    if (!product.decoration_specs) return null;

    const specs = typeof product.decoration_specs === 'string' 
      ? JSON.parse(product.decoration_specs) 
      : product.decoration_specs;

    return (
      <div className="space-y-6">
        {specs.front && specs.front.length > 0 && (
          <div>
            <h4 className="font-bold mb-3 uppercase text-sm tracking-wider bg-neutral-800 text-white py-2 px-4">
              Front Decoration Dimensions
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-brand-accent">
                <thead>
                  <tr className="border-b border-brand-accent bg-neutral-100">
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Code</th>
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Location</th>
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Dimensions</th>
                    <th className="text-left py-2 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.front.map((spec: any, idx: number) => (
                    <tr key={idx} className={spec.primary ? "bg-neutral-100" : ""}>
                      <td className="py-2 px-4 border-r border-brand-accent font-bold">{spec.code}</td>
                      <td className="py-2 px-4 border-r border-brand-accent">{spec.name}</td>
                      <td className="py-2 px-4 border-r border-brand-accent">{spec.dimensions}</td>
                      <td className="py-2 px-4">{spec.primary ? "Primary" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {specs.back && specs.back.length > 0 && (
          <div>
            <h4 className="font-bold mb-3 uppercase text-sm tracking-wider bg-neutral-800 text-white py-2 px-4">
              Back Decoration Dimensions
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-brand-accent">
                <thead>
                  <tr className="border-b border-brand-accent bg-neutral-100">
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Code</th>
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Location</th>
                    <th className="text-left py-2 px-4">Dimensions</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.back.map((spec: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-4 border-r border-brand-accent font-bold">{spec.code}</td>
                      <td className="py-2 px-4 border-r border-brand-accent">{spec.name}</td>
                      <td className="py-2 px-4">{spec.dimensions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {specs.sleeve && specs.sleeve.length > 0 && (
          <div>
            <h4 className="font-bold mb-3 uppercase text-sm tracking-wider bg-neutral-800 text-white py-2 px-4">
              Sleeve Decoration Dimensions
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-brand-accent">
                <thead>
                  <tr className="border-b border-brand-accent bg-neutral-100">
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Code</th>
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Location</th>
                    <th className="text-left py-2 px-4">Dimensions</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.sleeve.map((spec: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-4 border-r border-brand-accent font-bold">{spec.code}</td>
                      <td className="py-2 px-4 border-r border-brand-accent">{spec.name}</td>
                      <td className="py-2 px-4">{spec.dimensions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {specs.hood && specs.hood.length > 0 && (
          <div>
            <h4 className="font-bold mb-3 uppercase text-sm tracking-wider bg-neutral-800 text-white py-2 px-4">
              Hood Decoration Dimensions
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-brand-accent">
                <thead>
                  <tr className="border-b border-brand-accent bg-neutral-100">
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Code</th>
                    <th className="text-left py-2 px-4 border-r border-brand-accent">Location</th>
                    <th className="text-left py-2 px-4">Dimensions</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.hood.map((spec: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-4 border-r border-brand-accent font-bold">{spec.code}</td>
                      <td className="py-2 px-4 border-r border-brand-accent">{spec.name}</td>
                      <td className="py-2 px-4">{spec.dimensions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-neutral-500 italic mt-4">
          * Decoration area is dependent on garment size, decoration method and the equipment being used.
        </p>
      </div>
    );
  };

  // Render fabric description with bullet points
  const renderFabricDescription = () => {
    if (!product.fabric_description) return null;
    
    const lines = product.fabric_description.split('\n').filter((line: string) => line.trim());
    
    return (
      <ul className="space-y-2 text-sm text-neutral-700">
        {lines.map((line: string, idx: number) => (
          <li key={idx}>• {line.trim()}</li>
        ))}
      </ul>
    );
  };

  // Render care instructions
  const renderCareInstructions = () => {
    if (!product.care_instructions) {
      return (
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>• Machine wash cold, inside-out</li>
          <li>• Tumble dry low or hang dry</li>
          <li>• Do not iron decoration</li>
          <li>• Do not bleach</li>
        </ul>
      );
    }

    const lines = product.care_instructions.split('\n').filter((line: string) => line.trim());
    
    return (
      <ul className="space-y-2 text-sm text-neutral-600">
        {lines.map((line: string, idx: number) => (
          <li key={idx}>• {line.trim()}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-8 text-sm">
        <Link href="/store" className="hover:underline">Store</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-600">{product.title}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column: Single Image with Color Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold uppercase tracking-wide">Preview</span>
            <span className="badge-outline text-xs">
              {previewMode === "front"
                ? "Front view"
                : previewMode === "back"
                ? "Back view"
                : "Front + Back view"}
            </span>
          </div>
          {/* Main Product Image - Single Large Image */}
          <div className="border border-brand-accent overflow-hidden aspect-square mb-6 bg-[var(--paper)] flex items-center justify-center">
            {displayImage ? (
              <Image 
                src={displayImage.url} 
                alt={displayImage.alt ?? `${product.title} (${previewMode} preview)`} 
                width={800} 
                height={800}
                className="w-full h-full object-contain bg-transparent"
              />
            ) : (
              <>
                {/* Placeholder until product imagery is uploaded */}
                <Image
                  src="/placeholders/product-square.svg"
                  alt="Placeholder for upcoming product imagery"
                  width={800}
                  height={800}
                  className="w-full h-full object-contain bg-transparent"
                />
              </>
            )}
          </div>

          {/* Color Selector Component */}
          {availableColors.length > 0 && (
            <ColorSwatch
              colors={availableColors.map((c: any) => ({ name: c.name, hex: c.hex }))}
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
          )}
        </div>

        {/* Right Column: Product Info */}
        <div>
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
              {product.title}
            </h1>
            
            {product.sku && (
              <p className="text-sm text-neutral-500 mb-4">SKU: {product.sku}</p>
            )}

            <div className="badge-outline mb-4">
              Made to order • Monochrome palette
            </div>

            {product.description && (
              <div className="prose mt-6">
                <p>{product.description}</p>
              </div>
            )}
          </div>

          {/* Product Form */}
          <form onSubmit={handleAddToCart} className="space-y-6">
            {/* Price */}
            <div className="text-3xl font-bold">
              ${price}
            </div>

            {/* Size Selection */}
            <div>
              <label className="label">Select Size</label>
              <VariantPicker 
                variants={variants.filter((v: any) => !selectedColor || v.color_name === selectedColor || !v.color_name)}
                value={selectedVariant}
                onChange={setSelectedVariant}
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="label">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-10 h-10 border border-brand-accent flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border border-brand-accent py-2 font-bold"
                />
                <button
                  type="button"
                  className="w-10 h-10 border border-brand-accent flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                  onClick={() => setQty(qty + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button type="submit" className="btn w-full text-base py-4">
              Add to Cart
            </button>

            {/* Product Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-brand-accent">
              <div className="text-center">
                <div className="w-10 h-10 bg-black mx-auto mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs font-bold uppercase">Premium Blanks</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-black mx-auto mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-bold uppercase">Fresh Prints</p>
              </div>
            </div>
          </form>

          {/* Additional Info */}
          <div className="mt-8 space-y-4">
            {product.fabric_description && (
              <details className="border border-brand-accent">
                <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
                  Product Description
                </summary>
                <div className="p-4 border-t border-brand-accent">
                  {renderFabricDescription()}
                </div>
              </details>
            )}

            {product.decoration_specs && (
              <details className="border border-brand-accent">
                <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
                  Decoration Specifications
                </summary>
                <div className="p-4 border-t border-brand-accent">
                  {renderDecorationSpecs()}
                </div>
              </details>
            )}

            <details className="border border-brand-accent">
              <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
                Size Chart
              </summary>
              <div className="p-4 border-t border-brand-accent">
                <p className="text-sm text-neutral-600 mb-3">
                  {product.sku ? `${product.sku} Size Chart` : "Standard Size Chart"}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-brand-accent">
                    <thead>
                      <tr className="border-b border-brand-accent bg-neutral-100">
                        <th className="text-left py-2 px-4">Size</th>
                        <th className="text-left py-2 px-4">Chest (in)</th>
                        <th className="text-left py-2 px-4">Length (in)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-brand-accent"><td className="py-2 px-4">S</td><td className="px-4">34-36</td><td className="px-4">28</td></tr>
                      <tr className="border-b border-brand-accent"><td className="py-2 px-4">M</td><td className="px-4">38-40</td><td className="px-4">29</td></tr>
                      <tr className="border-b border-brand-accent"><td className="py-2 px-4">L</td><td className="px-4">42-44</td><td className="px-4">30</td></tr>
                      <tr className="border-b border-brand-accent"><td className="py-2 px-4">XL</td><td className="px-4">46-48</td><td className="px-4">31</td></tr>
                      <tr><td className="py-2 px-4">2XL</td><td className="px-4">50-52</td><td className="px-4">32</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </details>

            <details className="border border-brand-accent">
              <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
                Care Instructions
              </summary>
              <div className="p-4 border-t border-brand-accent">
                {renderCareInstructions()}
              </div>
            </details>

            <details className="border border-brand-accent">
              <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
                Shipping & Returns
              </summary>
              <div className="p-4 border-t border-brand-accent text-sm text-neutral-600 space-y-2">
                <p>
                  <strong>Production Time:</strong> 7–10 business days (made to order)
                </p>
                <p>
                  <strong>Shipping:</strong> Free shipping on orders over $75
                </p>
                <p>
                  <strong>Returns:</strong> 30-day return policy with free size exchanges.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
