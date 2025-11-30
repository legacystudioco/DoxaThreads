/**
 * Extended Product Types with Sizing Information
 * Add these to your existing types or import where needed
 */

// Base size options
export type SizeName = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL';

// Product type categories
export type ProductType = 'hoodie' | 'crewneck' | 'tshirt' | 'other';

// Individual size measurements
export interface SizeMeasurements {
  body_length: number;     // in inches
  chest: number;           // in inches
  sleeve_length: number;   // in inches
}

// Size chart with chest ranges
export interface SizeChartEntry {
  chest_range: string;     // e.g., "38-41"
}

// Measurement instruction notes
export interface MeasurementNotes {
  body_length: string;
  chest: string;
  sleeve_length: string;
}

// Complete sizing information structure
export interface SizingInfo {
  measurements: Record<SizeName, SizeMeasurements>;
  size_chart: Record<SizeName, SizeChartEntry>;
  measurement_notes: MeasurementNotes;
}

// Extended product interface with sizing fields
export interface Product {
  // Existing fields
  id: string;
  title: string;
  slug: string;
  description: string;
  print_cost_cents: number;
  active: boolean;
  created_at: string;
  updated_at?: string;
  
  // Sorting fields
  homepage_sort_order?: number;
  store_sort_order?: number;
  
  // Display mode
  preview_mode?: 'front' | 'back' | 'combined';
  
  // NEW: Sizing and material fields
  product_type?: ProductType;
  material_description?: string;
  sizing_info?: SizingInfo;
  
  // Relations
  product_images?: ProductImage[];
  variants?: ProductVariant[];
}

// Product image type
export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  sort: number;
  color_name?: string;
  color_hex?: string;
  is_primary?: boolean;
}

// Product variant type
export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  price_cents: number;
  weight_oz: number;
  active: boolean;
  color_name?: string;
  color_hex?: string;
}

// Database query result type
export type ProductWithRelations = Product & {
  product_images: ProductImage[];
  variants: ProductVariant[];
};

// Type guard to check if product has sizing info
export function hasSizingInfo(product: Product): product is Product & { sizing_info: SizingInfo } {
  return product.sizing_info !== null && product.sizing_info !== undefined;
}

// Type guard to check if product has material description
export function hasMaterialDescription(product: Product): product is Product & { material_description: string } {
  return typeof product.material_description === 'string' && product.material_description.length > 0;
}

// Type guard to check if product has product type
export function hasProductType(product: Product): product is Product & { product_type: ProductType } {
  return product.product_type !== null && product.product_type !== undefined;
}

// Helper type for Supabase select queries
export type SupabaseProductQuery = {
  from: (table: 'products') => {
    select: (query: string) => any;
  };
};

// Material description constants by type
export const MATERIAL_SPECS: Record<ProductType, {
  weight: string;
  blend: string;
  features: string[];
}> = {
  hoodie: {
    weight: '7.4-ounce',
    blend: '80/20 cotton/poly',
    features: [
      '100% cotton face',
      'Front pouch pocket',
      '1x1 rib knit cuffs and hem',
      'Twill back neck tape',
      'Stitched eyelets',
      'Jersey-lined hood',
      'Natural flat drawcord',
      'Locker patch for printable label',
      'Side seamed',
      'Tear-away label'
    ]
  },
  crewneck: {
    weight: '5.3-ounce',
    blend: '60/40 combed ring spun cotton/polyester French terry fleece',
    features: [
      'Tear-away label',
      'Halfmoon at back neck',
      'Cross-stitch detail at neck',
      'Raglan sleeves',
      'Side seamed',
      '1x1 rib knit cuffs and hem'
    ]
  },
  tshirt: {
    weight: '3.5-ounce',
    blend: '65/35 poly/combed ring spun cotton, 40 singles',
    features: [
      '1x1 rib knit neck',
      'Double-needle edge stitch at neck',
      'Shoulder to shoulder taping',
      'Tear-away label',
      'Side seamed'
    ]
  },
  other: {
    weight: '',
    blend: '',
    features: []
  }
};

// Standard sizing chart data (can be overridden by database)
export const DEFAULT_SIZE_CHARTS: Record<ProductType, Partial<Record<SizeName, SizeChartEntry>>> = {
  hoodie: {
    'S': { chest_range: '35-38' },
    'M': { chest_range: '38-41' },
    'L': { chest_range: '41-44' },
    'XL': { chest_range: '44-48' },
    '2XL': { chest_range: '48-52' },
    '3XL': { chest_range: '52-56' }
  },
  crewneck: {
    'S': { chest_range: '35-38' },
    'M': { chest_range: '38-41' },
    'L': { chest_range: '41-44' },
    'XL': { chest_range: '44-48' },
    '2XL': { chest_range: '48-52' },
    '3XL': { chest_range: '52-56' }
  },
  tshirt: {
    'S': { chest_range: '35-38' },
    'M': { chest_range: '38-41' },
    'L': { chest_range: '41-44' },
    'XL': { chest_range: '44-48' },
    '2XL': { chest_range: '48-52' },
    '3XL': { chest_range: '52-56' }
  },
  other: {}
};

// Export everything for use in components
export type {
  Product as ProductWithSizing,
  ProductWithRelations,
  SupabaseProductQuery
};
