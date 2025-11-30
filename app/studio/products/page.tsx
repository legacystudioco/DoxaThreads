"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useStudioAuth } from "@/lib/studio-auth";
import { createClient } from "@/lib/supabase-client";

export default function StudioProductsPage() {
  const { isAuthenticated, loading: authLoading } = useStudioAuth();
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = [
    { id: "all", label: "All" },
    { id: "hoodie", label: "Hoodie" },
    { id: "crewneck", label: "Crewneck" },
    { id: "tshirt", label: "T-Shirt" },
  ];

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_images (
          id,
          url,
          alt
        ),
        variants (
          id,
          size,
          price_cents,
          color_name,
          color_hex
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated, loadProducts]);

  const styles = Array.from(
    new Set(
      products
        .map((p) => (p.style || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const filteredProducts = products.filter((product) => {
    const matchesStyle = styleFilter === "all" || (product.style || "").toLowerCase() === styleFilter.toLowerCase();
    const title = (product.title || "").toLowerCase();
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "hoodie" && title.includes("hoodie")) ||
      (categoryFilter === "crewneck" && (title.includes("crewneck") || title.includes("crew neck"))) ||
      (categoryFilter === "tshirt" && (title.includes("tee") || title.includes("t-shirt") || title.includes("shirt")));

    return matchesStyle && matchesCategory;
  });

  useEffect(() => {
    setSelectedProducts((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(filteredProducts.map((p) => p.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [styleFilter, categoryFilter, products]); // Keep selections in sync with the current filter

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert(`Error deleting product: ${error.message}`);
    } else {
      alert(`Product "${title}" deleted successfully!`);
      loadProducts();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ active: !currentStatus })
      .eq("id", id);

    if (error) {
      alert(`Error updating product: ${error.message}`);
    } else {
      loadProducts();
    }
  };

  // Bulk Actions Functions
  const handleSelectAll = (checked: boolean) => {
    const visibleIds = filteredProducts.map((p) => p.id);
    setSelectedProducts(checked ? new Set(visibleIds) : new Set());
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelection = new Set(selectedProducts);
    if (checked) {
      newSelection.add(productId);
    } else {
      newSelection.delete(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleBulkAction = async () => {
    if (selectedProducts.size === 0) {
      alert("Please select at least one product");
      return;
    }

    if (!bulkAction) {
      alert("Please select an action");
      return;
    }

    const productIds = Array.from(selectedProducts);
    const count = productIds.length;

    let confirmMessage = "";
    switch (bulkAction) {
      case "activate":
        confirmMessage = `Set ${count} product(s) to Active?`;
        break;
      case "deactivate":
        confirmMessage = `Set ${count} product(s) to Inactive?`;
        break;
      case "delete":
        confirmMessage = `Delete ${count} product(s)? This cannot be undone.`;
        break;
      default:
        return;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsBulkProcessing(true);

    try {
      if (bulkAction === "delete") {
        const { error } = await supabase
          .from("products")
          .delete()
          .in("id", productIds);

        if (error) throw error;
        alert(`Successfully deleted ${count} product(s)`);
      } else {
        const activeStatus = bulkAction === "activate";
        const { error } = await supabase
          .from("products")
          .update({ active: activeStatus })
          .in("id", productIds);

        if (error) throw error;
        alert(`Successfully updated ${count} product(s)`);
      }

      // Clear selection and reload
      setSelectedProducts(new Set());
      setBulkAction("");
      await loadProducts();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
    setBulkAction("");
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const allSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedProducts.has(p.id));
  const someSelected = filteredProducts.some((p) => selectedProducts.has(p.id)) && !allSelected;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Products</h1>
          <p className="text-neutral-600">Manage your product catalog ({products.length} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-neutral-700">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-neutral-700">Style</label>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="select text-sm"
            >
              <option value="all">All styles</option>
              {styles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
          <Link href="/studio/dashboard" className="btn-secondary text-sm">
            ← Dashboard
          </Link>
          <Link href="/studio/products/arrange" className="btn-secondary text-sm">
            🔀 Arrange Products
          </Link>
          <Link href="/studio/products/new" className="btn text-sm">
            + Add Product
          </Link>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <div className="mb-6 p-4 bg-neutral-100 border border-brand-accent rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-neutral-900">
              {selectedProducts.size} product(s) selected
            </span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-brand-accent rounded-none px-3 py-2 text-sm font-medium"
              disabled={isBulkProcessing}
            >
              <option value="">Select action...</option>
              <option value="activate">Set Active</option>
              <option value="deactivate">Set Inactive</option>
              <option value="delete">Delete</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={isBulkProcessing || !bulkAction}
              className="btn text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkProcessing ? "Processing..." : "Apply"}
            </button>
          </div>
          <button
            onClick={clearSelection}
            className="text-sm text-neutral-900 hover:underline font-medium"
            disabled={isBulkProcessing}
          >
            Clear Selection
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-2xl font-bold mb-2">No products yet</h3>
          <p className="text-neutral-600 mb-6">Create your first product to get started</p>
          <Link href="/studio/products/new" className="btn">
            + Add Product
          </Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-xl font-bold mb-2">No products match this style</h3>
          <p className="text-neutral-600 mb-4">Try selecting a different style filter.</p>
          <button
            onClick={() => setStyleFilter("all")}
            className="btn-secondary text-sm"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </th>
                <th>Product Name</th>
                <th>Slug</th>
                <th>Style</th>
                <th>Print Cost</th>
                <th>Images/Variants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </td>
                  <td>
                    <div className="font-bold">{product.title}</div>
                    <div className="text-xs text-neutral-600 mt-1">
                      ID: {product.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="text-sm">{product.slug}</td>
                  <td className="text-sm">{product.style || "—"}</td>
                  <td className="font-medium">
                    ${(product.print_cost_cents / 100).toFixed(2)}
                  </td>
                  <td className="text-sm">
                    {product.product_images?.length || 0} images / {product.variants?.length || 0} variants
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(product.id, product.active)}
                      className={product.active ? "status-paid" : "badge"}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        href={`/studio/products/${product.id}/edit`}
                        className="text-sm hover:underline font-medium"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/store/products/${product.slug}`}
                        className="text-sm hover:underline font-medium"
                        target="_blank"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.title)}
                        className="text-sm hover:underline font-medium text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 card border border-brand-accent">
        <p className="text-sm">
          <strong>✅ Connected to Supabase:</strong> All changes sync with your database in real-time!
        </p>
      </div>
    </div>
  );
}
