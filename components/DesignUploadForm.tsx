"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const PRODUCT_TYPES = {
  tee: {
    label: "T-Shirt",
    folder: "BlankTees",
    colors: [
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Cream", filePrefix: "Cream", hex: "#F5F5DC" },
      { name: "Desert Pink", filePrefix: "DesertPink", hex: "#EDD1B0" },
      { name: "Graphite Black", filePrefix: "GrphBlack", hex: "#3E3E3E" },
      { name: "Heavy Metal", filePrefix: "HeavyMetal", hex: "#4A4A4A" },
      { name: "Light Gray", filePrefix: "LightGray", hex: "#D3D3D3" },
      { name: "Military Green", filePrefix: "MilGreen", hex: "#5A5F4A" },
      { name: "Purple Rush", filePrefix: "PurpleRush", hex: "#800080" },
      { name: "Royal", filePrefix: "Royal", hex: "#1E3A8A" },
      { name: "White", filePrefix: "White", hex: "#FFFFFF" },
    ],
    defaultPricing: [
      { size: "S", price: 28.00, weight: 5.0 },
      { size: "M", price: 28.00, weight: 5.5 },
      { size: "L", price: 28.00, weight: 6.0 },
      { size: "XL", price: 32.00, weight: 6.5 },
      { size: "2XL", price: 36.00, weight: 7.0 },
    ],
  },
  crewneck: {
    label: "Crewneck",
    folder: "BlankCrew",
    colors: [
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Graphite Black", filePrefix: "GrphBlack", hex: "#3E3E3E" },
      { name: "Heather Gray", filePrefix: "HthrGray", hex: "#B8B8B8" },
      { name: "Light Olive", filePrefix: "LightOlive", hex: "#A4A869" },
      { name: "Tan", filePrefix: "Tan", hex: "#D2B48C" },
    ],
    defaultPricing: [
      { size: "S", price: 40.00, weight: 8.0 },
      { size: "M", price: 40.00, weight: 8.5 },
      { size: "L", price: 40.00, weight: 9.0 },
      { size: "XL", price: 44.00, weight: 9.5 },
      { size: "2XL", price: 48.00, weight: 10.0 },
    ],
  },
  hoodie: {
    label: "Hoodie",
    folder: "BlankHoodies",
    colors: [
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Black on Black", filePrefix: "BlkOnBlk", hex: "#000000" },
      { name: "Heavy Metal", filePrefix: "HeavyMetal", hex: "#4A4A4A" },
      { name: "Military Green", filePrefix: "MilGreen", hex: "#5A5F4A" },
      { name: "Natural", filePrefix: "Natural", hex: "#F5F5DC" },
    ],
    defaultPricing: [
      { size: "S", price: 45.00, weight: 12.0 },
      { size: "M", price: 45.00, weight: 12.5 },
      { size: "L", price: 45.00, weight: 13.0 },
      { size: "XL", price: 49.00, weight: 13.5 },
      { size: "2XL", price: 53.00, weight: 14.0 },
    ],
  },
};

type ProductTypeKey = keyof typeof PRODUCT_TYPES;

interface ColorSelection {
  [key: string]: boolean;
}

interface DesignPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

type ProductTypePositions = Record<ProductTypeKey, DesignPosition>;

interface DesignUploadFormProps {
  hideActions?: boolean;
  onDesignNameChange?: (name: string) => void;
  onSelectedTypesChange?: (types: Set<string>) => void;
  setAssetGenerator?: (
    generator: () => Promise<
      Record<
        string,
        {
          url: string;
          colorName?: string;
          colorHex?: string;
        }[]
      >
    >
  ) => void;
}

export default function DesignUploadForm({
  hideActions = false,
  onDesignNameChange,
  onSelectedTypesChange,
  setAssetGenerator,
}: DesignUploadFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [designName, setDesignName] = useState("");
  const [description, setDescription] = useState("");
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);
  
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(["tee"]));
  
  const [colorSelections, setColorSelections] = useState<Record<string, ColorSelection>>({
    tee: {},
    crewneck: {},
    hoodie: {},
  });

  // Preview dimensions for positioning UI (scaled down so the garment stays visible)
  const [designPositions, setDesignPositions] = useState<ProductTypePositions>({
    tee: { x: 70, y: 140, width: 120, height: 120, scale: 0.6 },
    crewneck: { x: 70, y: 140, width: 120, height: 120, scale: 0.6 },
    hoodie: { x: 70, y: 140, width: 120, height: 120, scale: 0.6 },
  });

  const [currentEditingType, setCurrentEditingType] = useState<ProductTypeKey>("tee");
  const [previewColorIndex, setPreviewColorIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null);

  const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesignFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setDesignImage(img);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleProductType = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
    onSelectedTypesChange?.(newSet);
  };

  const handleDesignNameChange = (value: string) => {
    setDesignName(value);
    onDesignNameChange?.(value);
  };

  const toggleColor = (type: string, colorPrefix: string) => {
    setColorSelections(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [colorPrefix]: !prev[type][colorPrefix],
      },
    }));
  };

  const updatePosition = (field: keyof DesignPosition, value: number) => {
    setDesignPositions(prev => {
      const current = prev[currentEditingType];
      
      // If updating scale, maintain aspect ratio
      if (field === 'scale' && designImage) {
        const aspectRatio = designImage.width / designImage.height;
        const baseSize = 200; // base size at scale 1
        const newWidth = baseSize * value;
        const newHeight = baseSize * value;
        
        return {
          ...prev,
          [currentEditingType]: {
            ...current,
            scale: value,
            width: aspectRatio >= 1 ? newWidth : newWidth * aspectRatio,
            height: aspectRatio >= 1 ? newHeight / aspectRatio : newHeight,
          },
        };
      }
      
      return {
        ...prev,
        [currentEditingType]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const getBlankImagePath = (type: ProductTypeKey, colorPrefix: string) => {
    const config = PRODUCT_TYPES[type];
    
    if (type === "tee") {
      return `/assets/Blanks/${config.folder}/424Wx635H-11018-${colorPrefix}-12-NL3600${colorPrefix}FlatFront7.jpg`;
    } else if (type === "crewneck") {
      return `/assets/Blanks/${config.folder}/424Wx635H-63783-${colorPrefix}-12-NL9007${colorPrefix}FlatFront.jpg`;
    } else if (type === "hoodie") {
      return `/assets/Blanks/${config.folder}/424Wx635H-11033-${colorPrefix}-12-NL9303${colorPrefix}FlatFront3.jpg`;
    }
    return "";
  };

  const getHoodieStringsPath = (colorPrefix: string) => {
    if (colorPrefix === "BlkOnBlk") {
      return `/assets/Blanks/BlankHoodies/black on black strings.png`;
    }
    return `/assets/Blanks/BlankHoodies/black hoodie strings.png`;
  };

  const compositeImage = async (
    blankImagePath: string,
    position: DesignPosition,
    productType: ProductTypeKey,
    previewImageElement: HTMLImageElement
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log(`🎨 Compositing image for ${productType}`, { position, blankImagePath });
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx || !designImage) {
        reject(new Error("Canvas context or design image not available"));
        return;
      }

      const blankImg = new Image();
      blankImg.crossOrigin = "anonymous";
      
      blankImg.onload = () => {
        canvas.width = blankImg.width;
        canvas.height = blankImg.height;
        
        console.log(`✅ Actual canvas size: ${canvas.width}x${canvas.height}`);
        console.log(`✅ Preview image displayed size: ${previewImageElement.clientWidth}x${previewImageElement.clientHeight}`);
        
        // Calculate scale factor between preview size and actual canvas size
        const scaleFactor = canvas.width / previewImageElement.clientWidth;
        console.log(`✅ Scale factor: ${scaleFactor}`);
        
        // Scale the position values to match the actual canvas size
        const scaledX = position.x * scaleFactor;
        const scaledY = position.y * scaleFactor;
        const scaledWidth = position.width * scaleFactor;
        const scaledHeight = position.height * scaleFactor;
        
        console.log(`✅ Scaled position for canvas: x=${scaledX}, y=${scaledY}, w=${scaledWidth}, h=${scaledHeight}`);
        
        // Layer 1: Draw blank garment (background)
        ctx.drawImage(blankImg, 0, 0, blankImg.width, blankImg.height);
        
        // Layer 2: Draw design on top at the scaled position
        ctx.drawImage(
          designImage, 
          scaledX, 
          scaledY, 
          scaledWidth, 
          scaledHeight
        );
        
        // Layer 3: If hoodie, draw strings on top
        if (productType === "hoodie") {
          const stringsImg = new Image();
          stringsImg.crossOrigin = "anonymous";
          
          stringsImg.onload = () => {
            console.log(`✅ Drawing hoodie strings overlay`);
            ctx.drawImage(stringsImg, 0, 0, canvas.width, canvas.height);
            
            // Convert to blob after all layers are drawn
            canvas.toBlob((blob) => {
              if (blob) {
                console.log(`✅ Composite complete, blob size: ${blob.size} bytes`);
                resolve(URL.createObjectURL(blob));
              } else {
                reject(new Error("Failed to create blob"));
              }
            }, "image/jpeg", 0.9);
          };
          
          stringsImg.onerror = () => {
            console.warn("⚠️ Failed to load hoodie strings, continuing without overlay");
            // Continue without strings if overlay fails
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(URL.createObjectURL(blob));
              } else {
                reject(new Error("Failed to create blob"));
              }
            }, "image/jpeg", 0.9);
          };
          
          stringsImg.src = getHoodieStringsPath(blankImagePath.includes('BlkOnBlk') ? 'BlkOnBlk' : 'Black');
        } else {
          // For non-hoodies, just convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              console.log(`✅ Composite complete (no strings), blob size: ${blob.size} bytes`);
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error("Failed to create blob"));
            }
          }, "image/jpeg", 0.9);
        }
      };
      
      blankImg.onerror = () => {
        console.error(`❌ Failed to load blank image: ${blankImagePath}`);
        reject(new Error(`Failed to load: ${blankImagePath}`));
      };
      blankImg.src = blankImagePath;
    });
  };

  const uploadCompositedImage = async (dataUrl: string, productType: string, color: string): Promise<string> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const fileName = `${Date.now()}-${designName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${productType}-${color}.jpg`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, blob, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data: signed, error: signError } = await supabase.storage
      .from("product-images")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signError) throw signError;
    return signed.signedUrl;
  };

  const generateAssets = async () => {
    if (!designFile || !designImage) {
      throw new Error("Please upload a design image");
    }

    if (selectedTypes.size === 0) {
      throw new Error("Please select at least one product type");
    }

    let hasColorSelection = false;
    selectedTypes.forEach(type => {
      Object.values(colorSelections[type] || {}).forEach(selected => {
        if (selected) hasColorSelection = true;
      });
    });
    if (!hasColorSelection) {
      throw new Error("Please select at least one color for your products");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be signed in");

    const previewImg = document.querySelector('.preview-blank-image') as HTMLImageElement;
    if (!previewImg) throw new Error("Preview image not found");

    const assets: Record<string, { url: string; colorName?: string; colorHex?: string }[]> = {};

    for (const type of Array.from(selectedTypes)) {
      const config = PRODUCT_TYPES[type as ProductTypeKey];
      const position = designPositions[type as ProductTypeKey];
      const selectedColors = colorSelections[type];
      const colorsToProcess = config.colors.filter(color => selectedColors[color.filePrefix]);
      if (colorsToProcess.length === 0) continue;

      assets[type] = [];

      for (let i = 0; i < colorsToProcess.length; i++) {
        const color = colorsToProcess[i];
        const blankImagePath = getBlankImagePath(type as ProductTypeKey, color.filePrefix);
        const compositedDataUrl = await compositeImage(blankImagePath, position, type as ProductTypeKey, previewImg);
        const imageUrl = await uploadCompositedImage(compositedDataUrl, type, color.filePrefix);

        assets[type].push({
          url: imageUrl,
          colorName: color.name,
          colorHex: color.hex,
        });
      }
    }

    return assets;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hideActions) return;
    
    if (!designFile || !designImage) {
      setError("Please upload a design image");
      return;
    }

    if (selectedTypes.size === 0) {
      setError("Please select at least one product type");
      return;
    }

    let hasColorSelection = false;
    selectedTypes.forEach(type => {
      Object.values(colorSelections[type] || {}).forEach(selected => {
        if (selected) hasColorSelection = true;
      });
    });

    if (!hasColorSelection) {
      setError("Please select at least one color for your products");
      return;
    }

    setSubmitting(true);
    setGenerating(true);
    setError("");
    setProgress({ percent: 5, message: "Starting product creation..." });

    const selectedTypeList = Array.from(selectedTypes);
    const totalColors = selectedTypeList.reduce((acc, type) => {
      const config = PRODUCT_TYPES[type as ProductTypeKey];
      const chosen = config.colors.filter((c) => colorSelections[type]?.[c.filePrefix]);
      return acc + chosen.length;
    }, 0);
    const totalVariants = selectedTypeList.reduce((acc, type) => {
      const config = PRODUCT_TYPES[type as ProductTypeKey];
      const chosen = config.colors.filter((c) => colorSelections[type]?.[c.filePrefix]);
      return acc + chosen.length * config.defaultPricing.length;
    }, 0);
    const totalTasks = Math.max(1, totalColors + totalVariants + selectedTypeList.length);
    let completed = 0;

    const bumpProgress = (message: string) => {
      const percent = Math.min(5 + Math.round((completed / totalTasks) * 95), 100);
      setProgress({ percent, message });
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in");

      // Get the preview image element to calculate scale factor
      const previewImg = document.querySelector('.preview-blank-image') as HTMLImageElement;
      if (!previewImg) throw new Error("Preview image not found");

      for (const type of selectedTypeList) {
        const config = PRODUCT_TYPES[type as ProductTypeKey];
        const position = designPositions[type as ProductTypeKey];
        const selectedColors = colorSelections[type];

        const colorsToProcess = config.colors.filter(color => selectedColors[color.filePrefix]);
        if (colorsToProcess.length === 0) continue;

        const slug = `${designName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${type}`;
        const title = `${designName} - ${config.label}`;

        completed += 1;
        bumpProgress(`Creating ${title}...`);

        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({ title, slug, description, print_cost_cents: 300, active: true })
          .select("id")
          .single();

        if (productError) throw productError;

        // Process colors and add them with proper color data
        for (let i = 0; i < colorsToProcess.length; i++) {
          const color = colorsToProcess[i];
          const blankImagePath = getBlankImagePath(type as ProductTypeKey, color.filePrefix);
          const compositedDataUrl = await compositeImage(blankImagePath, position, type as ProductTypeKey, previewImg);
          const imageUrl = await uploadCompositedImage(compositedDataUrl, type, color.filePrefix);

          // 🎨 NOW SAVING COLOR DATA!
          await supabase.from("product_images").insert({
            product_id: product.id,
            url: imageUrl,
            alt: `${title} - ${color.name}`,
            sort: i,
            color_name: color.name,
            color_hex: color.hex,
            is_primary: i === 0, // First color is primary
          });

          completed += 1;
          bumpProgress(`Saved ${title} - ${color.name} image`);
        }

        // Create variants for each size x color combination
        const variantsToInsert: any[] = [];
        config.defaultPricing.forEach(pricingTier => {
          colorsToProcess.forEach(color => {
            variantsToInsert.push({
              product_id: product.id,
              size: pricingTier.size,
              price_cents: Math.round(pricingTier.price * 100),
              weight_oz: pricingTier.weight,
              active: true,
              color_name: color.name,
              color_hex: color.hex,
            });
          });
        });

        await supabase.from("variants").insert(variantsToInsert);

        completed += config.defaultPricing.length * colorsToProcess.length;
        bumpProgress(`Variants saved for ${title}`);
      }

      setProgress({ percent: 100, message: "Products created!" });
      router.push("/studio/products");
    } catch (err: any) {
      setError(err.message || "Failed to create products");
      console.error("Error creating products:", err);
    } finally {
      setSubmitting(false);
      setGenerating(false);
      setTimeout(() => setProgress(null), 1200);
    }
  };

  useEffect(() => {
    if (setAssetGenerator) {
      setAssetGenerator(() => generateAssets);
    }
    // Update whenever key inputs change so generator uses fresh state
  }, [setAssetGenerator, designFile, designImage, selectedTypes, colorSelections, designPositions]);

  const currentConfig = PRODUCT_TYPES[currentEditingType];
  const currentPreviewColor = currentConfig.colors[previewColorIndex];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="alert-error">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold mb-6 pb-4 border-b-2 border-black">Design Information</h2>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Design Name *</label>
            <input
              type="text"
              className="input"
              value={designName}
              onChange={(e) => handleDesignNameChange(e.target.value)}
              placeholder="e.g., Death Before Decaf"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your design..." rows={4} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-6 pb-4 border-b-2 border-black">🎨 Upload Design (PNG)</h2>
        <div className="form-group">
          <label className="label">Design File *</label>
          <input type="file" accept="image/png" onChange={handleDesignUpload} className="input" required />
          <p className="text-xs text-neutral-600 mt-1">Upload a transparent PNG for best results</p>
        </div>
        
        {designImage && (
          <div className="mt-4 border-2 border-black p-4">
            <p className="text-sm font-bold mb-2">Design Preview:</p>
            <img src={designImage.src} alt="Design preview" className="max-w-xs border-2 border-black bg-gray-100" />
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-6 pb-4 border-b border-brand-accent">👕 Select Product Types</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(PRODUCT_TYPES).map(([key, config]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={selectedTypes.has(key)} onChange={() => toggleProductType(key)} className="w-5 h-5" />
              <span className="font-medium">{config.label}</span>
            </label>
          ))}
        </div>
      </div>

      {designImage && selectedTypes.size > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-6 pb-4 border-b border-brand-accent">📐 Adjust Design Position & Preview</h2>
          
          <div className="mb-6">
            <label className="label">Editing Position For:</label>
            <div className="flex gap-2">
              {Array.from(selectedTypes).map(type => (
                <button 
                  key={type} 
                  type="button" 
                  onClick={() => {
                    setCurrentEditingType(type as ProductTypeKey);
                    setPreviewColorIndex(0);
                  }} 
                  className={`px-4 py-2 border border-brand-accent font-bold ${currentEditingType === type ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"}`}
                >
                  {PRODUCT_TYPES[type as ProductTypeKey].label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="mb-6 p-4 bg-neutral-100 border border-brand-accent">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-bold">👁️ Live Preview</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Preview Color:</label>
                <select
                  value={previewColorIndex}
                  onChange={(e) => setPreviewColorIndex(parseInt(e.target.value))}
                  className="select text-sm"
                >
                  {currentConfig.colors.map((color, idx) => (
                    <option key={color.filePrefix} value={idx}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative bg-white border border-brand-accent w-full md:w-auto max-w-xl mx-auto md:mx-0">
                {/* Layer 1: Blank garment */}
                <img
                  src={getBlankImagePath(currentEditingType, currentPreviewColor.filePrefix)}
                  alt={`${currentConfig.label} - ${currentPreviewColor.name}`}
                  className="block preview-blank-image"
                  style={{ maxWidth: "100%", height: "auto" }}
                  onError={(e) => {
                    console.error("Failed to load blank image:", getBlankImagePath(currentEditingType, currentPreviewColor.filePrefix));
                  }}
                />
                {/* Layer 2: Your design */}
                <img
                  src={designImage.src}
                  alt="Your design"
                  className="absolute pointer-events-none"
                  style={{
                    left: `${designPositions[currentEditingType].x}px`,
                    top: `${designPositions[currentEditingType].y}px`,
                    width: `${designPositions[currentEditingType].width}px`,
                    height: `${designPositions[currentEditingType].height}px`,
                  }}
                />
                {/* Layer 3: Hoodie strings overlay (only for hoodies) */}
                {currentEditingType === "hoodie" && (
                  <img
                    src={getHoodieStringsPath(currentPreviewColor.filePrefix)}
                    alt="Hoodie strings overlay"
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ 
                      width: "100%", 
                      height: "auto",
                    }}
                    onError={(e) => {
                      console.warn("Failed to load hoodie strings overlay");
                    }}
                  />
                )}
                <p className="text-xs text-neutral-600 mt-2 px-3 py-2">
                  Adjust sliders to reposition your design. The preview updates in real-time.
                  {currentEditingType === "hoodie" && " (Hoodie strings overlay shown on top)"}
                </p>
              </div>

              <div className="flex-1 w-full md:w-80 bg-white border border-dashed border-brand-accent rounded p-4">
                <h4 className="text-sm font-bold mb-3">Position Controls</h4>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="label">X Position (Left/Right)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="400" 
                      value={designPositions[currentEditingType].x} 
                      onChange={(e) => updatePosition("x", parseInt(e.target.value))} 
                      className="w-full" 
                    />
                    <span className="text-sm text-neutral-600">{designPositions[currentEditingType].x}px</span>
                  </div>
                  <div className="form-group">
                    <label className="label">Y Position (Up/Down)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="600" 
                      value={designPositions[currentEditingType].y} 
                      onChange={(e) => updatePosition("y", parseInt(e.target.value))} 
                      className="w-full" 
                    />
                    <span className="text-sm text-neutral-600">{designPositions[currentEditingType].y}px</span>
                  </div>
                  <div className="form-group">
                    <label className="label">Scale (Size)</label>
                    <input 
                      type="range" 
                      min="0.25" 
                      max="2.5" 
                      step="0.05"
                      value={designPositions[currentEditingType].scale} 
                      onChange={(e) => updatePosition("scale", parseFloat(e.target.value))} 
                      className="w-full" 
                    />
                    <span className="text-sm text-neutral-600">{Math.round(designPositions[currentEditingType].scale * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {Array.from(selectedTypes).map(type => {
        const config = PRODUCT_TYPES[type as ProductTypeKey];
        return (
          <div key={type} className="card">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b-2 border-black">🎨 Select Colors for {config.label}</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Check the colors that look good with your design (use preview above to verify)
              {type === "hoodie" && " • Hoodie strings will be overlaid on all colors"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {config.colors.map(color => (
                <label key={color.filePrefix} className="flex items-center gap-3 cursor-pointer p-3 border-2 border-black hover:bg-gray-50">
                  <input type="checkbox" checked={colorSelections[type]?.[color.filePrefix] || false} onChange={() => toggleColor(type, color.filePrefix)} className="w-5 h-5" />
                  <span className="font-medium">{color.name}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {!hideActions && (
        <div className="flex gap-4">
          {progress && (
            <div className="flex-1">
              <div className="card border-dashed border-2 border-black/40 mb-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{progress.message}</span>
                  <span>{Math.min(progress.percent, 100)}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-black transition-all duration-300"
                    style={{ width: `${Math.min(progress.percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <button type="submit" disabled={submitting || generating} className="btn flex-1">
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner border-2"></div>
                Generating Products...
              </span>
            ) : submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner border-2"></div>
                Creating...
              </span>
            ) : (
              "Create Products"
            )}
          </button>
        </div>
      )}
    </form>
  );
}
