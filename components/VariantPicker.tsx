"use client";

import { useState } from "react";

type Variant = {
  id: string;
  size: string;
  price_cents: number;
  active?: boolean;
};

interface VariantPickerProps {
  variants: Variant[];
  value: string;
  onChange: (variantId: string) => void;
}

export function VariantPicker({ variants, value, onChange }: VariantPickerProps) {
  if (!variants || variants.length === 0) {
    return <p className="text-sm text-neutral-600">No variants available.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={`
            border-2 px-4 py-3 text-center transition-all
            ${value === v.id 
              ? 'bg-black text-white border-black' 
              : 'bg-white text-black border-black hover:bg-neutral-50'
            }
          `}
        >
          <div className="font-bold text-sm uppercase tracking-wider">{v.size}</div>
          <div className="text-xs mt-1">${(v.price_cents / 100).toFixed(2)}</div>
        </button>
      ))}
    </div>
  );
}
