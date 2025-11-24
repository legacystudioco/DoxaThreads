/**
 * Packing algorithm for shipping calculation
 * Determines how many packages are needed and their shipping method
 */

export interface PackageDefinition {
  name: string;
  maxVolumeUnits: number;
  maxWeightOz: number;
  length: number;
  width: number;
  height: number;
  service: 'FIRST_CLASS' | 'PRIORITY';
}

export interface ItemDefinition {
  variantId: string;
  qty: number;
  weightOz: number;
  volumeUnits: number;
  name: string;
}

export interface PackedPackage {
  packageType: PackageDefinition;
  items: Array<{ variantId: string; qty: number }>;
  totalWeightOz: number;
  totalVolumeUnits: number;
}

// Package definitions
export const PACKAGES: Record<string, PackageDefinition> = {
  POLY_10x8x1_FIRST_CLASS: {
    name: 'Poly Mailer 10x8x1 (First Class)',
    maxVolumeUnits: 4,
    maxWeightOz: 16,
    length: 10,
    width: 8,
    height: 1,
    service: 'FIRST_CLASS'
  },
  POLY_10x8x1_PRIORITY: {
    name: 'Poly Mailer 10x8x1 (Priority)',
    maxVolumeUnits: 4,
    maxWeightOz: 999, // No practical weight limit for Priority
    length: 10,
    width: 8,
    height: 1,
    service: 'PRIORITY'
  },
  BOX_SMALL_PRIORITY: {
    name: 'Small Box (Priority)',
    maxVolumeUnits: 24,
    maxWeightOz: 999,
    length: 12,
    width: 9,
    height: 4,
    service: 'PRIORITY'
  }
};

// Default item specifications
export const DEFAULT_ITEM_SPECS: Record<string, { weightOz: number; volumeUnits: number }> = {
  tshirt: { weightOz: 6, volumeUnits: 1 },
  crewneck: { weightOz: 16, volumeUnits: 2 },
  hoodie: { weightOz: 24, volumeUnits: 3 }
};

/**
 * Determine item type from product title
 */
function getItemType(productTitle: string): 'tshirt' | 'crewneck' | 'hoodie' {
  const title = productTitle.toLowerCase();
  if (title.includes('hoodie')) return 'hoodie';
  if (title.includes('crewneck') || title.includes('crew neck')) return 'crewneck';
  return 'tshirt'; // Default
}

/**
 * Pack items into packages using deterministic greedy algorithm
 */
export function packItems(items: ItemDefinition[]): PackedPackage[] {
  const packages: PackedPackage[] = [];

  // Process each SKU separately for simplicity
  for (const item of items) {
    let remainingQty = item.qty;

    while (remainingQty > 0) {
      // Try First Class poly mailer first
      const firstClassPkg = PACKAGES.POLY_10x8x1_FIRST_CLASS;
      const volumeCapacity = Math.floor(firstClassPkg.maxVolumeUnits / item.volumeUnits);
      const weightCapacity = Math.floor(firstClassPkg.maxWeightOz / item.weightOz);
      const firstClassMaxCount = Math.min(volumeCapacity, weightCapacity);

      if (firstClassMaxCount >= 1) {
        // Can use First Class
        const qtyInThisPackage = Math.min(firstClassMaxCount, remainingQty);
        packages.push({
          packageType: firstClassPkg,
          items: [{ variantId: item.variantId, qty: qtyInThisPackage }],
          totalWeightOz: item.weightOz * qtyInThisPackage,
          totalVolumeUnits: item.volumeUnits * qtyInThisPackage
        });
        remainingQty -= qtyInThisPackage;
      } else {
        // Must use Priority
        const priorityPkg = PACKAGES.POLY_10x8x1_PRIORITY;
        const priorityVolumeCapacity = Math.floor(priorityPkg.maxVolumeUnits / item.volumeUnits);
        const priorityWeightCapacity = Math.floor(priorityPkg.maxWeightOz / item.weightOz);
        const priorityMaxCount = Math.min(priorityVolumeCapacity, priorityWeightCapacity);

        if (priorityMaxCount >= 1) {
          const qtyInThisPackage = Math.min(priorityMaxCount, remainingQty);
          packages.push({
            packageType: priorityPkg,
            items: [{ variantId: item.variantId, qty: qtyInThisPackage }],
            totalWeightOz: item.weightOz * qtyInThisPackage,
            totalVolumeUnits: item.volumeUnits * qtyInThisPackage
          });
          remainingQty -= qtyInThisPackage;
        } else {
          // Need small box
          const boxPkg = PACKAGES.BOX_SMALL_PRIORITY;
          const boxVolumeCapacity = Math.floor(boxPkg.maxVolumeUnits / item.volumeUnits);
          const boxWeightCapacity = Math.floor(boxPkg.maxWeightOz / item.weightOz);
          const boxMaxCount = Math.min(boxVolumeCapacity, boxWeightCapacity);

          const qtyInThisPackage = Math.min(boxMaxCount, remainingQty);
          packages.push({
            packageType: boxPkg,
            items: [{ variantId: item.variantId, qty: qtyInThisPackage }],
            totalWeightOz: item.weightOz * qtyInThisPackage,
            totalVolumeUnits: item.volumeUnits * qtyInThisPackage
          });
          remainingQty -= qtyInThisPackage;
        }
      }
    }
  }

  return packages;
}

/**
 * Prepare items for packing from cart and variant data
 */
export function prepareItemsForPacking(
  cart: Array<{ variantId: string; qty: number }>,
  variants: Array<any>
): ItemDefinition[] {
  return cart.map(cartItem => {
    const variant = variants.find(v => v.id === cartItem.variantId);
    if (!variant) {
      throw new Error(`Variant not found: ${cartItem.variantId}`);
    }

    const product = variant.product;
    if (!product) {
      throw new Error(`Product not found for variant: ${cartItem.variantId}`);
    }

    // Determine item type from product title
    const itemType = getItemType(product.title || '');
    const specs = DEFAULT_ITEM_SPECS[itemType];

    // Use variant weight if available, otherwise use default
    const weightOz = variant.weight_oz ? Number(variant.weight_oz) : specs.weightOz;
    const volumeUnits = specs.volumeUnits;

    return {
      variantId: cartItem.variantId,
      qty: cartItem.qty,
      weightOz,
      volumeUnits,
      name: product.title || 'Unknown'
    };
  });
}

/**
 * Format packing results for logging
 */
export function formatPackingSummary(packages: PackedPackage[]): string {
  const lines: string[] = [];
  lines.push(`\n=== PACKING SUMMARY ===`);
  lines.push(`Total packages: ${packages.length}`);
  
  packages.forEach((pkg, index) => {
    lines.push(`\nPackage ${index + 1}: ${pkg.packageType.name}`);
    lines.push(`  Service: ${pkg.packageType.service}`);
    lines.push(`  Weight: ${pkg.totalWeightOz} oz`);
    lines.push(`  Volume: ${pkg.totalVolumeUnits} units`);
    lines.push(`  Dimensions: ${pkg.packageType.length}x${pkg.packageType.width}x${pkg.packageType.height}"`);
    pkg.items.forEach(item => {
      lines.push(`  - Variant ${item.variantId}: ${item.qty} units`);
    });
  });
  
  return lines.join('\n');
}
