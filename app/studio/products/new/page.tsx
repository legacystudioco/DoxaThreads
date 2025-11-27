 "use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStudioAuth } from "@/lib/studio-auth";
import { createClient } from "@/lib/supabase-client";
import DesignUploadForm from "@/components/DesignUploadForm";

type ProductionCalcKey =
  | "transferCost"
  | "blankCost"
  | "retailSL"
  | "retailXL"
  | "retail2XL"
  | "retail3XL"
  | "retail4XL";

type ProductTypeKey = "tee" | "hoodie" | "crewneck";
type PreviewMode = "front" | "back" | "combined";

const PRODUCT_TYPE_CONFIGS: Record<
  ProductTypeKey,
  {
    label: string;
    defaultVariants: VariantForm[];
    defaultCalc: Record<ProductionCalcKey, number>;
  }
> = {
  tee: {
    label: "T-Shirt",
    defaultVariants: [
      { size: "S", price_dollars: 28.99, weight_oz: 5.0 },
      { size: "M", price_dollars: 28.99, weight_oz: 5.5 },
      { size: "L", price_dollars: 28.99, weight_oz: 6.0 },
      { size: "XL", price_dollars: 28.99, weight_oz: 6.5 },
      { size: "2XL", price_dollars: 30.99, weight_oz: 7.0 },
      { size: "3XL", price_dollars: 31.99, weight_oz: 7.5 },
      { size: "4XL", price_dollars: 32.99, weight_oz: 8.0 },
    ],
    defaultCalc: {
      transferCost: 3.0,
      blankCost: 8.0,
      retailSL: 28.99,
      retailXL: 28.99,
      retail2XL: 30.99,
      retail3XL: 31.99,
      retail4XL: 32.99,
    },
  },
  hoodie: {
    label: "Hoodie",
    defaultVariants: [
      { size: "S", price_dollars: 44.99, weight_oz: 12.0 },
      { size: "M", price_dollars: 44.99, weight_oz: 12.5 },
      { size: "L", price_dollars: 44.99, weight_oz: 13.0 },
      { size: "XL", price_dollars: 44.99, weight_oz: 13.5 },
      { size: "2XL", price_dollars: 46.99, weight_oz: 14.0 },
      { size: "3XL", price_dollars: 48.99, weight_oz: 14.5 },
      { size: "4XL", price_dollars: 48.99, weight_oz: 15.0 },
    ],
    defaultCalc: {
      transferCost: 3.0,
      blankCost: 12.0,
      retailSL: 44.99,
      retailXL: 44.99,
      retail2XL: 46.99,
      retail3XL: 48.99,
      retail4XL: 48.99,
    },
  },
  crewneck: {
    label: "Crewneck",
    defaultVariants: [
      { size: "S", price_dollars: 38.99, weight_oz: 8.0 },
      { size: "M", price_dollars: 38.99, weight_oz: 8.5 },
      { size: "L", price_dollars: 38.99, weight_oz: 9.0 },
      { size: "XL", price_dollars: 38.99, weight_oz: 9.5 },
      { size: "2XL", price_dollars: 40.99, weight_oz: 10.0 },
      { size: "3XL", price_dollars: 41.99, weight_oz: 10.5 },
      { size: "4XL", price_dollars: 42.99, weight_oz: 11.0 },
    ],
    defaultCalc: {
      transferCost: 3.0,
      blankCost: 10.0,
      retailSL: 38.99,
      retailXL: 38.99,
      retail2XL: 40.99,
      retail3XL: 41.99,
      retail4XL: 42.99,
    },
  },
};

export default function NewProductPage() {
  const { isAuthenticated, loading: authLoading } = useStudioAuth();
  const router = useRouter();
  
  // Redirect unauthenticated users to login instead of rendering a blank page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/studio/login');
    }
  }, [authLoading, isAuthenticated, router]);
  
  const baseOrderFee = 5;
  const [designName, setDesignName] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<ProductTypeKey>>(new Set(["tee"]));
  const [activeCalcTab, setActiveCalcTab] = useState<ProductTypeKey>("tee");
  const [assetGenerator, setAssetGenerator] = useState<
    (() => Promise<Record<string, { url: string; colorName?: string; colorHex?: string }[]>>) | null
  >(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("front");

  const [productionCalcByType, setProductionCalcByType] = useState<
    Record<ProductTypeKey, Record<ProductionCalcKey, number>>
  >({
    tee: { ...PRODUCT_TYPE_CONFIGS.tee.defaultCalc },
    hoodie: { ...PRODUCT_TYPE_CONFIGS.hoodie.defaultCalc },
    crewneck: { ...PRODUCT_TYPE_CONFIGS.crewneck.defaultCalc },
  });

  const productionSizeTiers: { label: string; retailKey: ProductionCalcKey }[] = [
    { label: "S–L", retailKey: "retailSL" },
    { label: "XL", retailKey: "retailXL" },
    { label: "2XL", retailKey: "retail2XL" },
    { label: "3XL", retailKey: "retail3XL" },
    { label: "4XL", retailKey: "retail4XL" },
  ];

  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const parseMoneyInput = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const updateProductionCalc = (
    type: ProductTypeKey,
    key: ProductionCalcKey,
    value: number
  ) => {
    setProductionCalcByType((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value,
      },
    }));
  };

  const getRetailPriceForSize = (type: ProductTypeKey, size: string) => {
    const calc = productionCalcByType[type];
    const upper = size.toUpperCase();
    if (["S", "M", "L"].includes(upper)) return calc.retailSL;
    if (upper === "XL") return calc.retailXL;
    if (upper === "2XL") return calc.retail2XL;
    if (upper === "3XL") return calc.retail3XL;
    if (upper === "4XL") return calc.retail4XL;
    return calc.retailSL;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    setError("");
    setProgress({ percent: 5, message: "Starting product creation..." });

    const activeTypes = Array.from(selectedTypes);

    if (activeTypes.length === 0) {
      setSubmitting(false);
      setError("Select at least one product type to create.");
      return;
    }

    if (!designName.trim()) {
      setSubmitting(false);
      setError("Please enter a design name in the Live Editor.");
      return;
    }

    // Ensure user is authenticated for RLS
    const supabase = createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    console.log('🔐 Current user:', user);
    console.log('🔐 User error:', userErr);
    
    if (!user) {
      setSubmitting(false);
      setError("You must be signed in to create a product.");
      return;
    }
    
    console.log('✅ User authenticated:', user.id);

    try {
      if (!assetGenerator) {
        throw new Error("Live Editor is not ready. Please ensure a design is uploaded.");
      }

      setProgress({ percent: 10, message: "Generating product images..." });
      const assetsByType = await assetGenerator();

      let created = 0;

      for (const type of activeTypes) {
        const calc = productionCalcByType[type];
        const config = PRODUCT_TYPE_CONFIGS[type];
        const assets = assetsByType[type] || [];

        const titleBase = designName.trim();
        const title = `${titleBase} | ${config.label}`;
        const slugSource = `${titleBase}-${config.label}`.toLowerCase();
        const slugBase =
          slugSource.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
          `${config.label.toLowerCase()}`;
        const description = "";
        const print_cost_cents = Math.round(
          (calc.blankCost + calc.transferCost + baseOrderFee) * 100
        );
        const modeForProduct: PreviewMode = type === "tee" ? previewMode : "front";

        setProgress({
          percent: 10 + Math.round((created / activeTypes.length) * 60),
          message: `Creating ${PRODUCT_TYPE_CONFIGS[type].label}...`,
        });

        const attemptInsert = async (slug: string) => {
          const supabase = createClient();
          
          // Calculate blank costs for each size based on the production calculator
          const blank_cost_s_cents = Math.round(calc.blankCost * 100);
          const blank_cost_m_cents = Math.round(calc.blankCost * 100);
          const blank_cost_l_cents = Math.round(calc.blankCost * 100);
          const blank_cost_xl_cents = Math.round(calc.blankCost * 100);
          const blank_cost_2xl_cents = Math.round(calc.blankCost * 100);
          const blank_cost_3xl_cents = Math.round(calc.blankCost * 100);
          const blank_cost_4xl_cents = Math.round(calc.blankCost * 100);
          
          return supabase
            .from("products")
            .insert({
              title,
              slug,
              description,
              sku: `${slugBase}-${type}`.toUpperCase(),
              style: config.label,
              print_cost_cents,
              fabric_description: null,
              care_instructions: null,
              decoration_specs: null,
              blank_cost_s_cents,
              blank_cost_m_cents,
              blank_cost_l_cents,
              blank_cost_xl_cents,
              blank_cost_2xl_cents,
              blank_cost_3xl_cents,
              blank_cost_4xl_cents,
              active: true,
              preview_mode: modeForProduct,
            })
            .select("id")
            .single();
        };

        let product;
        let productError;

        const primary = await attemptInsert(slugBase);
        product = primary.data;
        productError = primary.error;

        if (productError && productError.code === "23505") {
          const slugWithSuffix = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
          const retry = await attemptInsert(slugWithSuffix);
          product = retry.data;
          productError = retry.error;
        }

        if (productError) {
          console.error("❌ [products.insert] Full error object:", productError);
          throw new Error(productError.message || "Permission denied creating product (RLS)");
        }

        // Insert product images if any were generated
        if (assets.length) {
          setProgress({
            percent: 45 + Math.round((created / activeTypes.length) * 30),
            message: `Saving images for ${title}...`,
          });

          const imageRows = assets.map((asset, index) => ({
            product_id: product.id,
            url: asset.url,
            alt: `${title}${asset.colorName ? ` - ${asset.colorName}` : ""}`,
            sort: index,
            color_name: asset.colorName,
            color_hex: asset.colorHex,
            is_primary: index === 0,
          }));

          const supabase = createClient();
          const { error: imageError } = await supabase.from("product_images").insert(imageRows);
          if (imageError) {
            console.error("❌ [product_images.insert] Full error object:", imageError);
            throw new Error(imageError.message || "Failed to save product images");
          }
        }

        setProgress({
          percent: 40 + Math.round((created / activeTypes.length) * 40),
          message: `Saving variants for ${title}...`,
        });

        const variantsToInsert = assets.flatMap((asset, colorIndex) =>
          config.defaultVariants.map((v, sizeIndex) => ({
            product_id: product.id,
            size: v.size,
            price_cents: Math.round(getRetailPriceForSize(type, v.size) * 100),
            weight_oz: v.weight_oz,
            active: true,
            sort: colorIndex * config.defaultVariants.length + sizeIndex,
            color_name: asset.colorName,
            color_hex: asset.colorHex,
          }))
        );

        const supabase = createClient();
        const { error: variantsError } = await supabase
          .from("variants")
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
        created += 1;
      }

      setProgress({ percent: 100, message: "Products created!" });
      router.push("/studio/products");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      console.error("Error creating product:", err);
    } finally {
      setSubmitting(false);
      setTimeout(() => setProgress(null), 1000);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 p-6 border border-brand-accent rounded bg-[rgba(36,33,27,0.7)] text-brand-paper">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-brand-paper">Add New Product</h1>
            <p className="text-brand-accent">Create a new product in your catalog</p>
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

        {/* Live Editor */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4 pb-3 border-b-2 border-brand-accent text-brand-paper">
            🎨 Live Editor
          </h2>
          <p className="text-sm text-brand-accent mb-4">
            Use the live editor to visualize designs and color selections. The design name will be used for all product types.
          </p>
          <DesignUploadForm
            hideActions
            onDesignNameChange={setDesignName}
            onSelectedTypesChange={(types) => setSelectedTypes(new Set(types as Set<ProductTypeKey>))}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            setAssetGenerator={setAssetGenerator}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-brand-accent">
              <h2 className="text-xl font-bold text-brand-paper">Preview Mode (Customer View)</h2>
              <span className="badge-outline text-xs bg-transparent text-brand-paper border-brand-accent">Admin only</span>
            </div>
            <p className="text-sm text-brand-accent mb-4">
              Pick which garment preview is surfaced to shoppers. This selection stays in sync with the live editor above.
            </p>
            <div className="flex flex-wrap gap-3">
              {(["front", "back", "combined"] as PreviewMode[]).map((mode) => (
                <button
                  key={`preview-${mode}`}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  className={`px-4 py-2 border-2 text-sm font-semibold ${
                    previewMode === mode
                      ? "bg-brand-blood text-brand-paper border-brand-accent"
                      : "bg-transparent text-brand-paper border-brand-accent"
                  }`}
                >
                  {mode === "front" ? "Front only" : mode === "back" ? "Back only" : "Front + Back combined"}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-brand-accent">
              <h2 className="text-xl font-bold text-brand-paper">Production Cost Calculator</h2>
              <span className="badge-outline text-xs bg-transparent text-brand-paper border-brand-accent">Tabbed by garment</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(PRODUCT_TYPE_CONFIGS) as ProductTypeKey[]).map((type) => (
                <button
                  key={`tab-${type}`}
                  type="button"
                  onClick={() => setActiveCalcTab(type)}
                  className={`px-4 py-2 border-2 border-brand-accent text-sm font-semibold ${
                    activeCalcTab === type ? "bg-brand-blood text-brand-paper" : "bg-transparent text-brand-paper"
                  }`}
                >
                  {PRODUCT_TYPE_CONFIGS[type].label}
                  {!selectedTypes.has(type) && (
                    <span className="ml-2 text-xs text-red-700">(not selected)</span>
                  )}
                </button>
              ))}
            </div>

            {(() => {
              const type = activeCalcTab;
              const calc = productionCalcByType[type];

              return (
                <div className="space-y-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="label text-brand-paper">Blank Cost</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent">$</span>
                          <input
                            type="number"
                            step="0.01"
                            className="input pl-8 text-brand-paper"
                            value={calc.blankCost}
                            onChange={(e) =>
                              updateProductionCalc(type, "blankCost", parseMoneyInput(e.target.value))
                            }
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="label text-brand-paper">Transfer Cost</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent">$</span>
                          <input
                            type="number"
                            step="0.01"
                            className="input pl-8 text-brand-paper"
                            value={calc.transferCost}
                            onChange={(e) =>
                              updateProductionCalc(type, "transferCost", parseMoneyInput(e.target.value))
                            }
                          />
                        </div>
                      </div>

                      <div className="bg-[rgba(203,184,155,0.08)] border-2 border-dashed border-brand-accent p-4 rounded">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-accent mb-1">
                          Base Order Print Cost
                        </p>
                        <p className="text-lg font-bold text-brand-paper">
                          ${baseOrderFee.toFixed(2)}{" "}
                          <span className="text-sm font-medium text-brand-accent">per order</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">
                        Retail pricing (customer-facing)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {productionSizeTiers.map((tier) => (
                          <div className="form-group" key={`${type}-retail-${tier.label}`}>
                            <label className="label text-brand-paper">Retail Price {tier.label}</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent">$</span>
                              <input
                                type="number"
                                step="0.01"
                                className="input pl-8 text-brand-paper"
                                value={calc[tier.retailKey]}
                                onChange={(e) =>
                                  updateProductionCalc(
                                    type,
                                    tier.retailKey,
                                    parseMoneyInput(e.target.value)
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-brand-accent">
                        Updates live as you type for planning only. It will not change the saved product.
                      </p>
                    </div>
                  </div>

                  <div className="border-t-2 border-brand-accent pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-brand-paper">Live Calculations (Qty 1)</h3>
                      <span className="text-xs text-brand-accent">
                        Printer cost = blank + transfer + base order print cost
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold uppercase tracking-wide text-brand-accent mb-2">
                      <span>Size Tier</span>
                      <span className="text-right">Printer Cost</span>
                      <span className="text-right">Retail Price</span>
                      <span className="hidden sm:block text-right">Gross Profit</span>
                      <span className="sm:hidden text-right">Profit</span>
                    </div>

                    <div className="space-y-2">
                      {productionSizeTiers.map((tier) => {
                        const printerCost = calc.blankCost + calc.transferCost + baseOrderFee;
                        const retailPrice = calc[tier.retailKey];
                        const grossProfit = retailPrice - printerCost;

                        return (
                          <div
                            key={`${type}-calc-${tier.label}`}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center text-sm"
                          >
                            <span className="font-semibold">{tier.label}</span>
                            <span className="text-right text-red-700 font-medium">
                              ${printerCost.toFixed(2)}
                            </span>
                            <span className="text-right">${retailPrice.toFixed(2)}</span>
                            <span
                              className={`text-right font-bold ${
                                grossProfit >= 0 ? "text-green-700" : "text-red-700"
                              }`}
                            >
                              ${grossProfit.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Submit */}
          {(submitting || progress) && (
            <div className="card border-dashed border-2 border-brand-accent/60">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{progress?.message || "Processing..."}</span>
                <span>{progress ? `${Math.min(progress.percent, 100)}%` : ""}</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-brand-accent transition-all duration-300"
                  style={{ width: `${progress ? Math.min(progress.percent, 100) : 0}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn flex-1"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner border-2"></div>
                  Creating...
                </span>
              ) : (
                "Create Product"
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
