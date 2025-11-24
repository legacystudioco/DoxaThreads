"use client";

import React, { useEffect, useState } from "react";

type CartItem = {
  variantId: string;
  qty: number;
};

interface CartProps {
  onUpdate?: (items: CartItem[]) => void;
}

export default function Cart({ onUpdate }: CartProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("cart");
    const parsed = raw ? JSON.parse(raw) : [];
    setItems(parsed);
  }, []);

  // Update localStorage and optionally notify parent
  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
    // Dispatch custom event to update cart badge
    window.dispatchEvent(new Event("cartUpdated"));
    if (onUpdate) onUpdate(newItems);
  };

  const increment = (variantId: string) => {
    const newItems = items.map((i) =>
      i.variantId === variantId ? { ...i, qty: i.qty + 1 } : i
    );
    updateCart(newItems);
  };

  const decrement = (variantId: string) => {
    const newItems = items
      .map((i) =>
        i.variantId === variantId ? { ...i, qty: i.qty - 1 } : i
      )
      .filter((i) => i.qty > 0);
    updateCart(newItems);
  };

  const removeItem = (variantId: string) => {
    const newItems = items.filter((i) => i.variantId !== variantId);
    updateCart(newItems);
  };

  if (items.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
        <p className="text-neutral-600 mb-6">Add some items to get started</p>
        <a href="/store" className="btn">
          Browse Products
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div
          key={item.variantId}
          className="card"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Product placeholder image */}
            <div className="w-20 h-20 bg-neutral-100 border border-brand-accent flex-shrink-0 overflow-hidden">
              {/* Placeholder until product imagery is uploaded */}
              <img src="/placeholders/product-square.svg" alt="Product placeholder" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <p className="font-bold text-sm uppercase tracking-wider mb-1">
                Product Name
              </p>
              <p className="text-sm text-neutral-600 mb-2">
                Variant: {item.variantId}
              </p>
              
              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <button 
                  className="w-8 h-8 border border-brand-accent flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                  onClick={() => decrement(item.variantId)}
                >
                  −
                </button>
                <span className="w-12 text-center font-bold">{item.qty}</span>
                <button 
                  className="w-8 h-8 border border-brand-accent flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                  onClick={() => increment(item.variantId)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold mb-3">$XX.XX</p>
              <button
                className="text-xs text-neutral-600 hover:underline font-medium"
                onClick={() => removeItem(item.variantId)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="card bg-neutral-50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold uppercase tracking-wider">Subtotal</span>
          <span className="text-xl font-bold">$XX.XX</span>
        </div>
        <p className="text-xs text-neutral-600 mb-4">
          Shipping and taxes calculated at checkout
        </p>
        <a className="btn w-full" href="/store/checkout">
          Proceed to Checkout
        </a>
      </div>
    </div>
  );
}
