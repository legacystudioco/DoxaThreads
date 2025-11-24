/**
 * Test script for packing algorithm
 * Run with: npx ts-node test-packing.ts
 */

import { packItems, prepareItemsForPacking, formatPackingSummary, DEFAULT_ITEM_SPECS } from './lib/packing';

// Mock variants for testing
function createMockVariants(items: Array<{ title: string; variantId: string }>) {
  return items.map(item => ({
    id: item.variantId,
    weight_oz: null, // Will use defaults
    product: {
      title: item.title
    }
  }));
}

console.log("=== PACKING ALGORITHM TEST SUITE ===\n");

// Test 1: 10 T-Shirts
console.log("TEST 1: 10 T-Shirts");
console.log("Expected: 5 First Class poly mailers (2 shirts each, 12 oz each)\n");
const test1Cart = [{ variantId: 'tshirt-1', qty: 10 }];
const test1Variants = createMockVariants([{ title: 'Cool T-Shirt', variantId: 'tshirt-1' }]);
const test1Items = prepareItemsForPacking(test1Cart, test1Variants);
const test1Packages = packItems(test1Items);
console.log(formatPackingSummary(test1Packages));
console.log("\n" + "=".repeat(50) + "\n");

// Test 2: 3 Crewnecks
console.log("TEST 2: 3 Crewnecks");
console.log("Expected: 3 First Class poly mailers (1 crewneck each, 16 oz each)\n");
const test2Cart = [{ variantId: 'crew-1', qty: 3 }];
const test2Variants = createMockVariants([{ title: 'Spartans Crewneck', variantId: 'crew-1' }]);
const test2Items = prepareItemsForPacking(test2Cart, test2Variants);
const test2Packages = packItems(test2Items);
console.log(formatPackingSummary(test2Packages));
console.log("\n" + "=".repeat(50) + "\n");

// Test 3: 2 Hoodies
console.log("TEST 3: 2 Hoodies");
console.log("Expected: 2 Priority poly mailers (1 hoodie each, 24 oz each)\n");
const test3Cart = [{ variantId: 'hoodie-1', qty: 2 }];
const test3Variants = createMockVariants([{ title: 'Spartans Hoodie', variantId: 'hoodie-1' }]);
const test3Items = prepareItemsForPacking(test3Cart, test3Variants);
const test3Packages = packItems(test3Items);
console.log(formatPackingSummary(test3Packages));
console.log("\n" + "=".repeat(50) + "\n");

// Test 4: Mixed order (2 hoodies + 2 t-shirts)
console.log("TEST 4: 2 Hoodies + 2 T-Shirts");
console.log("Expected: 2 Priority poly (hoodies) + 1 First Class poly (2 shirts, 12 oz)\n");
const test4Cart = [
  { variantId: 'hoodie-1', qty: 2 },
  { variantId: 'tshirt-1', qty: 2 }
];
const test4Variants = createMockVariants([
  { title: 'Spartans Hoodie', variantId: 'hoodie-1' },
  { title: 'Cool T-Shirt', variantId: 'tshirt-1' }
]);
const test4Items = prepareItemsForPacking(test4Cart, test4Variants);
const test4Packages = packItems(test4Items);
console.log(formatPackingSummary(test4Packages));
console.log("\n" + "=".repeat(50) + "\n");

// Test 5: Large order (5 hoodies + 10 crewnecks + 15 t-shirts)
console.log("TEST 5: 5 Hoodies + 10 Crewnecks + 15 T-Shirts");
console.log("Expected: Multiple packages with appropriate service levels\n");
const test5Cart = [
  { variantId: 'hoodie-1', qty: 5 },
  { variantId: 'crew-1', qty: 10 },
  { variantId: 'tshirt-1', qty: 15 }
];
const test5Variants = createMockVariants([
  { title: 'Spartans Hoodie', variantId: 'hoodie-1' },
  { title: 'Spartans Crewneck', variantId: 'crew-1' },
  { title: 'Cool T-Shirt', variantId: 'tshirt-1' }
]);
const test5Items = prepareItemsForPacking(test5Cart, test5Variants);
const test5Packages = packItems(test5Items);
console.log(formatPackingSummary(test5Packages));

// Calculate totals for Test 5
let totalWeight = 0;
let firstClassCount = 0;
let priorityCount = 0;
for (const pkg of test5Packages) {
  totalWeight += pkg.totalWeightOz;
  if (pkg.packageType.service === 'FIRST_CLASS') {
    firstClassCount++;
  } else {
    priorityCount++;
  }
}
console.log(`\nTotals for Test 5:`);
console.log(`  Total weight: ${totalWeight} oz (${(totalWeight / 16).toFixed(2)} lbs)`);
console.log(`  First Class packages: ${firstClassCount}`);
console.log(`  Priority packages: ${priorityCount}`);
console.log(`  Estimated cost: $${((firstClassCount * 3.50) + (priorityCount * 8.00)).toFixed(2)}`);

console.log("\n" + "=".repeat(50));
console.log("✅ All tests completed!");
console.log("\nItem Specifications:");
console.log(JSON.stringify(DEFAULT_ITEM_SPECS, null, 2));
