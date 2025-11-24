"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStudioAuth } from "@/lib/studio-auth";
import { createClient } from "@/lib/supabase-client";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { isAuthenticated, loading: authLoading } = useStudioAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<any>(null);

  const loadProduct = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_images (*),
        variants (*)
      `)
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Error loading product:", error);
      setError("Failed to load product");
    } else {
      setProduct(data);
    }
    setLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProduct();
    }
  }, [isAuthenticated, loadProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Update product
      // @ts-ignore - Supabase types not generated
      const { error: productError } = await supabase
        .from("products")
        .update({
          title: product.title,
          slug: product.slug,
          description: product.description,
          print_cost_cents: product.print_cost_cents,
          active: product.active,
        })
        .eq("id", params.id);

      if (productError) throw productError;

      // Update images
      if (product.product_images) {
        for (const img of product.product_images) {
          if (img.id.startsWith("new-")) {
            // New image - insert
            // @ts-ignore - Supabase types not generated
            const { error: imgError } = await supabase
              .from("product_images")
              .insert({
                product_id: params.id,
                url: img.url,
                alt: img.alt,
                sort: img.sort,
              });
            if (imgError) console.error("Image insert error:", imgError);
          } else {
            // Existing image - update
            // @ts-ignore - Supabase types not generated
            const { error: imgError } = await supabase
              .from("product_images")
              .update({
                url: img.url,
                alt: img.alt,
                sort: img.sort,
              })
              .eq("id", img.id);
            if (imgError) console.error("Image update error:", imgError);
          }
        }
      }

      // Update variants
      if (product.variants) {
        for (const variant of product.variants) {
          if (variant.id.startsWith("new-")) {
            // New variant - insert
            // @ts-ignore - Supabase types not generated
            const { error: varError } = await supabase
              .from("variants")
              .insert({
                product_id: params.id,
                size: variant.size,
                price_cents: variant.price_cents,
                weight_oz: variant.weight_oz,
                active: variant.active ?? true,
              });
            if (varError) console.error("Variant insert error:", varError);
          } else {
            // Existing variant - update
            // @ts-ignore - Supabase types not generated
            const { error: varError } = await supabase
              .from("variants")
              .update({
                size: variant.size,
                price_cents: variant.price_cents,
                weight_oz: variant.weight_oz,
                active: variant.active ?? true,
              })
              .eq("id", variant.id);
            if (varError) console.error("Variant update error:", varError);
          }
        }
      }

      router.push("/studio/products");
    } catch (err: any) {
      setError(err.message || "Failed to update product");
      console.error("Error updating product:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...product.variants];
    updated[index] = { ...updated[index], [field]: value };
    setProduct({ ...product, variants: updated });
  };

  const updateImage = (index: number, field: string, value: any) => {
    const updated = [...product.product_images];
    updated[index] = { ...updated[index], [field]: value };
    setProduct({ ...product, product_images: updated });
  };

  const addImage = () => {
    const newImage = {
      id: `new-${Date.now()}`,
      url: "",
      alt: "",
      sort: product.product_images?.length || 0,
    };
    setProduct({
      ...product,
      product_images: [...(product.product_images || []), newImage],
    });
  };

  const removeImage = async (index: number) => {
    const img = product.product_images[index];
    if (!img.id.startsWith("new-")) {
      if (!confirm("Delete this image from the database?")) return;
      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", img.id);
      if (error) {
        alert("Error deleting image: " + error.message);
        return;
      }
    }
    const updated = product.product_images.filter((_: any, i: number) => i !== index);
    setProduct({ ...product, product_images: updated });
  };

  const addVariant = () => {
    const newVariant = {
      id: `new-${Date.now()}`,
      size: "",
      price_cents: 2800,
      weight_oz: 5.0,
      active: true,
    };
    setProduct({
      ...product,
      variants: [...(product.variants || []), newVariant],
    });
  };

  const removeVariant = async (index: number) => {
    const variant = product.variants[index];
    if (!variant.id.startsWith("new-")) {
      if (!confirm("Delete this variant from the database?")) return;
      const { error } = await supabase
        .from("variants")
        .delete()
        .eq("id", variant.id);
      if (error) {
        alert("Error deleting variant: " + error.message);
        return;
      }
    }
    const updated = product.variants.filter((_: any, i: number) => i !== index);
    setProduct({ ...product, variants: updated });
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

  if (!isAuthenticated || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-xl text-neutral-600">Product not found</p>
          <Link href="/studio/products" className="btn mt-4">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Product</h1>
            <p className="text-neutral-600">{product.title}</p>
          </div>
          <Link href="/studio/products" className="btn-secondary text-sm">
            ← Back
          </Link>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b-2 border-black">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div className="form-group">
                <label className="label">Product Title *</label>
                <input
                  type="text"
                  className="input"
                  value={product.title}
                  onChange={(e) => setProduct({ ...product, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Slug (URL)</label>
                <input
                  type="text"
                  className="input"
                  value={product.slug}
                  onChange={(e) => setProduct({ ...product, slug: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="textarea"
                  value={product.description || ""}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Print Cost (cents)</label>
                  <input
                    type="number"
                    className="input"
                    value={product.print_cost_cents}
                    onChange={(e) => setProduct({ ...product, print_cost_cents: parseInt(e.target.value) })}
                    min="0"
                  />
                  <p className="text-xs text-neutral-600 mt-1">
                    ${(product.print_cost_cents / 100).toFixed(2)} per print
                  </p>
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select
                    className="select"
                    value={product.active ? "active" : "inactive"}
                    onChange={(e) => setProduct({ ...product, active: e.target.value === "active" })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black">
              <h2 className="text-xl font-bold">
                Product Images ({product.product_images?.length || 0})
              </h2>
              <button
                type="button"
                onClick={addImage}
                className="btn-secondary text-sm"
              >
                + Add Image
              </button>
            </div>

            <div className="space-y-4">
              {product.product_images?.length === 0 && (
                <p className="text-neutral-600 text-sm">No images yet. Click &quot;Add Image&quot; to get started.</p>
              )}
              {product.product_images?.map((img: any, index: number) => (
                <div key={img.id} className="border-2 border-black p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold"
                  >
                    × Remove
                  </button>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="label text-xs">Image URL</label>
                      <input
                        type="url"
                        className="input text-sm"
                        value={img.url}
                        onChange={(e) => updateImage(index, "url", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Alt Text</label>
                      <input
                        type="text"
                        className="input text-sm"
                        value={img.alt || ""}
                        onChange={(e) => updateImage(index, "alt", e.target.value)}
                      />
                    </div>
                  </div>
                  {img.url && (
                    <img 
                      src={img.url} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover border-2 border-black" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black">
              <h2 className="text-xl font-bold">
                Size Variants ({product.variants?.length || 0})
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="btn-secondary text-sm"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {product.variants?.length === 0 && (
                <p className="text-neutral-600 text-sm">No variants yet. Click &quot;Add Variant&quot; to get started.</p>
              )}
              {product.variants?.map((variant: any, index: number) => (
                <div key={variant.id} className="grid grid-cols-4 gap-4 p-4 border-2 border-black relative">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold"
                  >
                    × Remove
                  </button>
                  <div>
                    <label className="label text-xs">Size</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, "size", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Price (cents)</label>
                    <input
                      type="number"
                      className="input text-sm"
                      value={variant.price_cents}
                      onChange={(e) => updateVariant(index, "price_cents", parseInt(e.target.value))}
                    />
                    <p className="text-xs text-neutral-600 mt-1">
                      ${(variant.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="label text-xs">Weight (oz)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input text-sm"
                      value={variant.weight_oz}
                      onChange={(e) => updateVariant(index, "weight_oz", parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Status</label>
                    <select
                      className="select text-sm"
                      value={variant.active ? "active" : "inactive"}
                      onChange={(e) => updateVariant(index, "active", e.target.value === "active")}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn flex-1"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner border-2"></div>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
            <Link href="/studio/products" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
