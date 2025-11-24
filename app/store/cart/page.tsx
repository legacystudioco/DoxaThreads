"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

type CartItem = { 
  variantId: string; 
  qty: number; 
  productTitle?: string;
  selectedColor?: { name: string; hex: string } | null;
  selectedSize?: string;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [variantDetails, setVariantDetails] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCart() {
      const raw = localStorage.getItem("cart");
      const cartItems: CartItem[] = raw ? JSON.parse(raw) : [];
      setItems(cartItems);

      // Fetch variant details from Supabase
      if (cartItems.length > 0) {
        const supabase = createClient();
        const variantIds = cartItems.map(item => item.variantId);
        
        const { data, error } = await supabase
          .from("variants")
          .select(`
            id,
            size,
            price_cents,
            color_name,
            color_hex,
            product_id,
            products (
              id,
              title,
              product_images (
                id,
                url,
                alt,
                color_name,
                is_primary
              )
            )
          `)
          .in("id", variantIds);

        if (!error && data) {
          const detailsMap = new Map();
          data.forEach(variant => {
            detailsMap.set(variant.id, variant);
          });
          setVariantDetails(detailsMap);
        }
      }

      setLoading(false);
    }

    loadCart();
  }, []);

  const updateQty = (variantId: string, newQty: number) => {
    if (newQty < 1) return;
    const updated = items.map(item => 
      item.variantId === variantId ? { ...item, qty: newQty } : item
    );
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    // Dispatch custom event to update cart badge
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (variantId: string) => {
    const updated = items.filter(item => item.variantId !== variantId);
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    // Dispatch custom event to update cart badge
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const variantData = variantDetails.get(item.variantId);
    if (variantData) {
      return sum + (variantData.price_cents * item.qty);
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>
        <div className="card text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
          <p className="text-neutral-600 mb-8">Add a few pieces to build your monochrome kit.</p>
          <Link href="/store" className="btn">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const variantData = variantDetails.get(item.variantId);
            const product = variantData?.products;
            
            // Get the correct image - prioritize color match, then primary, then first
            let productImage = product?.product_images?.[0];
            if (item.selectedColor?.name && product?.product_images) {
              const colorMatch = product.product_images.find(
                (img: any) => img.color_name === item.selectedColor?.name
              );
              if (colorMatch) {
                productImage = colorMatch;
              } else {
                const primaryImg = product.product_images.find((img: any) => img.is_primary);
                if (primaryImg) productImage = primaryImg;
              }
            }

            // Use cart item's stored values or variant data as fallback
            const displayColor = item.selectedColor || (variantData?.color_name ? {
              name: variantData.color_name,
              hex: variantData.color_hex
            } : null);
            
            const displaySize = item.selectedSize || variantData?.size || "N/A";
            const productTitle = item.productTitle || product?.title || "Product";

            return (
              <div key={item.variantId} className="card">
              <div className="flex gap-6">
                {/* Product Image */}
                <div className="w-24 h-24 flex-shrink-0 bg-neutral-100 border border-brand-accent overflow-hidden">
                  {productImage ? (
                    <img 
                      src={productImage.url} 
                      alt={productTitle} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {/* Placeholder until product imagery is uploaded */}
                      <img 
                        src="/placeholders/product-square.svg" 
                        alt="Placeholder for upcoming product imagery" 
                        className="w-full h-full object-cover"
                      />
                    </>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{productTitle}</h3>
                    
                    <div className="space-y-1 mb-3">
                      {/* Color Display */}
                      {displayColor && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-neutral-600">Color:</span>
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-4 h-4 rounded border border-neutral-300"
                              style={{ backgroundColor: displayColor.hex }}
                            />
                            <span className="font-medium">{displayColor.name}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Size Display */}
                      <p className="text-sm">
                        <span className="text-neutral-600">Size:</span>{" "}
                        <span className="font-medium">{displaySize}</span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQty(item.variantId, item.qty - 1)}
                        className="w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-bold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.variantId, item.qty + 1)}
                        className="w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price & Remove */}
                <div className="text-right flex flex-col justify-between">
                  <p className="font-bold text-lg">
                    ${variantData ? ((variantData.price_cents * item.qty) / 100).toFixed(2) : "0.00"}
                  </p>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-sm text-neutral-600 hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
              </div>
            );
          })}

          {/* Continue Shopping */}
          <Link href="/store" className="btn-secondary inline-flex mt-4">
            ← Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-wider">Order Summary</h2>

            <div className="space-y-3 mb-6 pb-6 border-b-2 border-black">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({items.reduce((sum, i) => sum + i.qty, 0)} items)</span>
                <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Estimated Total</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>

            <Link href="/store/checkout" className="btn w-full mb-3">
              Proceed to Checkout
            </Link>

            <p className="text-xs text-neutral-600 text-center">
              Made to order • 7–10 day production window
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
