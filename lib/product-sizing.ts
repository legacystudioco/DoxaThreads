/**
 * Product sizing and material information utilities
 * This file provides type-safe access to product descriptions and sizing charts
 */

export type ProductType = 'hoodie' | 'crewneck' | 'tshirt' | 'other';

export type SizeName = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

export interface SizeMeasurements {
  body_length: number;
  chest: number;
  sleeve_length: number;
}

export interface SizeChart {
  chest_range: string;
}

export interface MeasurementNotes {
  body_length: string;
  chest: string;
  sleeve_length: string;
}

export interface SizingInfo {
  measurements: Record<SizeName, SizeMeasurements>;
  size_chart: Record<SizeName, SizeChart>;
  measurement_notes: MeasurementNotes;
}

export interface ProductWithSizing {
  id: string;
  title: string;
  product_type?: ProductType;
  material_description?: string;
  sizing_info?: SizingInfo;
  // ... other product fields
}

/**
 * Material descriptions for each product type
 */
export const MATERIAL_DESCRIPTIONS: Record<ProductType, string> = {
  hoodie: '7.4-ounce, 80/20 cotton/poly • 100% cotton face • Front pouch pocket • 1x1 rib knit cuffs and hem • Twill back neck tape • Stitched eyelets • Jersey-lined hood • Natural flat drawcord • Locker patch for printable label • Side seamed • Tear-away label',
  crewneck: '5.3-ounce, 60/40 combed ring spun cotton/polyester French terry fleece • Tear-away label • Halfmoon at back neck • Cross-stitch detail at neck • Raglan sleeves • Side seamed • 1x1 rib knit cuffs and hem',
  tshirt: '3.5-ounce, 65/35 poly/combed ring spun cotton, 40 singles • 1x1 rib knit neck • Double-needle edge stitch at neck • Shoulder to shoulder taping • Tear-away label • Side seamed',
  other: ''
};

/**
 * Get material description for a product
 */
export function getMaterialDescription(product: ProductWithSizing): string {
  // Use database value if available, otherwise fall back to constants
  if (product.material_description) {
    return product.material_description;
  }
  
  if (product.product_type) {
    return MATERIAL_DESCRIPTIONS[product.product_type];
  }
  
  return '';
}

/**
 * Get sizing information for a product
 */
export function getSizingInfo(product: ProductWithSizing): SizingInfo | null {
  return product.sizing_info || null;
}

/**
 * Get measurements for a specific size
 */
export function getSizeMeasurements(
  product: ProductWithSizing,
  size: SizeName
): SizeMeasurements | null {
  const sizingInfo = getSizingInfo(product);
  if (!sizingInfo) return null;
  
  return sizingInfo.measurements[size] || null;
}

/**
 * Get chest range recommendation for a size
 */
export function getChestRange(
  product: ProductWithSizing,
  size: SizeName
): string | null {
  const sizingInfo = getSizingInfo(product);
  if (!sizingInfo) return null;
  
  return sizingInfo.size_chart[size]?.chest_range || null;
}

/**
 * Format material description as an array of features
 */
export function formatMaterialFeatures(description: string): string[] {
  return description.split(' • ').filter(Boolean);
}

/**
 * Get all available sizes for a product
 */
export function getAvailableSizes(product: ProductWithSizing): SizeName[] {
  const sizingInfo = getSizingInfo(product);
  if (!sizingInfo) return [];
  
  return Object.keys(sizingInfo.measurements) as SizeName[];
}

/**
 * Format measurements as a readable string
 */
export function formatMeasurements(measurements: SizeMeasurements): string {
  return `Body Length: ${measurements.body_length}" | Chest: ${measurements.chest}" | Sleeve: ${measurements.sleeve_length}"`;
}

/**
 * Determine product type from title (fallback for products without product_type)
 */
export function inferProductType(title: string): ProductType {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('hoodie')) return 'hoodie';
  if (lowerTitle.includes('crewneck') || lowerTitle.includes('crew neck')) return 'crewneck';
  if (lowerTitle.includes('t-shirt') || lowerTitle.includes('tee') || lowerTitle.includes('shirt')) return 'tshirt';
  
  return 'other';
}

/**
 * Get product type (from database or inferred from title)
 */
export function getProductType(product: ProductWithSizing): ProductType {
  return product.product_type || inferProductType(product.title);
}
