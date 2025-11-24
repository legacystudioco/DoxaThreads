// Product management using localStorage (no database required)

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  print_cost_cents: number;
  active: boolean;
  created_at: string;
  product_images: Array<{
    id: string;
    url: string;
    alt: string;
    sort: number;
  }>;
  variants: Array<{
    id: string;
    size: string;
    price_cents: number;
    weight_oz: number;
    active: boolean;
  }>;
};

const STORAGE_KEY = "doxa_products";

// Initialize with mock data if empty
export function initializeProducts() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const { mockProducts } = require("./products");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts));
  }
}

// Get all products
export function getAllProducts(): Product[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Get single product by slug
export function getProductBySlug(slug: string): Product | undefined {
  const products = getAllProducts();
  return products.find((p) => p.slug === slug);
}

// Get variant by ID
export function getVariantById(variantId: string) {
  const products = getAllProducts();
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      return { ...variant, product };
    }
  }
  return null;
}

// Create new product
export function createProduct(productData: Partial<Product>): Product {
  const products = getAllProducts();
  
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    title: productData.title || "New Product",
    slug: productData.slug || `product-${Date.now()}`,
    description: productData.description || "",
    print_cost_cents: productData.print_cost_cents || 300,
    active: productData.active ?? true,
    created_at: new Date().toISOString(),
    product_images: productData.product_images || [],
    variants: productData.variants || [
      { id: `var-${Date.now()}-1`, size: "S", price_cents: 2800, weight_oz: 5.0, active: true },
      { id: `var-${Date.now()}-2`, size: "M", price_cents: 2800, weight_oz: 5.5, active: true },
      { id: `var-${Date.now()}-3`, size: "L", price_cents: 2800, weight_oz: 6.0, active: true },
      { id: `var-${Date.now()}-4`, size: "XL", price_cents: 3200, weight_oz: 6.5, active: true },
      { id: `var-${Date.now()}-5`, size: "2XL", price_cents: 3600, weight_oz: 7.0, active: true },
    ],
  };

  products.push(newProduct);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  
  return newProduct;
}

// Update product
export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getAllProducts();
  const index = products.findIndex((p) => p.id === id);
  
  if (index === -1) return null;
  
  products[index] = { ...products[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  
  return products[index];
}

// Delete product
export function deleteProduct(id: string): boolean {
  const products = getAllProducts();
  const filtered = products.filter((p) => p.id !== id);
  
  if (filtered.length === products.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Toggle product active status
export function toggleProductActive(id: string): boolean {
  const products = getAllProducts();
  const product = products.find((p) => p.id === id);
  
  if (!product) return false;
  
  product.active = !product.active;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  
  return true;
}
