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
      { name: "Bone", filePrefix: "Bone", hex: "#E3DAC9" },
      { name: "Clay", filePrefix: "Clay", hex: "#B98976" },
      { name: "Cream", filePrefix: "Cream", hex: "#F4EED7" },
      { name: "Dark Chocolate", filePrefix: "Dark Chocolate", hex: "#3D2B1F" },
      { name: "Desert Pink", filePrefix: "Desert Pink", hex: "#E1B7A0" },
      { name: "Graphite", filePrefix: "Graphite", hex: "#4A4A4A" },
      { name: "Heather Gray", filePrefix: "Heather Gray", hex: "#BEBEBE" },
      { name: "Heavy Metal", filePrefix: "Heavy Metal", hex: "#4B4B4B" },
      { name: "Light Gray", filePrefix: "Light Gray", hex: "#D3D3D3" },
      { name: "Midnight Navy", filePrefix: "Midnight Navy", hex: "#1A2238" },
      { name: "Military", filePrefix: "Military", hex: "#59644B" },
      { name: "Natural", filePrefix: "Natural", hex: "#F2E8CF" },
      { name: "Sand", filePrefix: "Sand", hex: "#D7C4A0" },
      { name: "Tan", filePrefix: "Tan", hex: "#D2B48C" },
      { name: "White", filePrefix: "White", hex: "#FFFFFF" },
    ],
    defaultPricing: [
      { size: "S", price: 28.99, weight: 5.0 },
      { size: "M", price: 28.99, weight: 5.5 },
      { size: "L", price: 28.99, weight: 6.0 },
      { size: "XL", price: 28.99, weight: 6.5 },
      { size: "2XL", price: 30.99, weight: 7.0 },
      { size: "3XL", price: 31.99, weight: 7.5 },
      { size: "4XL", price: 32.99, weight: 8.0 },
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
      { size: "S", price: 38.99, weight: 8.0 },
      { size: "M", price: 38.99, weight: 8.5 },
      { size: "L", price: 38.99, weight: 9.0 },
      { size: "XL", price: 38.99, weight: 9.5 },
      { size: "2XL", price: 40.99, weight: 10.0 },
      { size: "3XL", price: 41.99, weight: 10.5 },
      { size: "4XL", price: 42.99, weight: 11.0 },
    ],
    supportsAllPreviewModes: true, // Crewnecks support all three preview modes
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
      { size: "S", price: 44.99, weight: 12.0 },
      { size: "M", price: 44.99, weight: 12.5 },
      { size: "L", price: 44.99, weight: 13.0 },
      { size: "XL", price: 44.99, weight: 13.5 },
      { size: "2XL", price: 46.99, weight: 14.0 },
      { size: "3XL", price: 48.99, weight: 14.5 },
      { size: "4XL", price: 48.99, weight: 15.0 },
    ],
    supportsAllPreviewModes: true, // Hoodies support all three preview modes
  },
};

type ProductTypeKey = keyof typeof PRODUCT_TYPES;
type PreviewMode = "front" | "back" | "combined";
type PositionKey = "front" | "back" | "combinedFront" | "combinedBack";

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

type ProductTypePositions = Record<ProductTypeKey, Record<PositionKey, DesignPosition>>;

const createDefaultPosition = (): DesignPosition => ({
  x: 70,
  y: 140,
  width: 120,
  height: 120,
  scale: 0.6,
});

const createDefaultPositionMap = (): Record<PositionKey, DesignPosition> => ({
  front: createDefaultPosition(),
  back: createDefaultPosition(),
  combinedFront: createDefaultPosition(),
  combinedBack: createDefaultPosition(),
});

interface DesignUploadFormProps {
  hideActions?: boolean;
  onDesignNameChange?: (name: string) => void;
  onSelectedTypesChange?: (types: Set<string>) => void;
  previewMode?: PreviewMode;
  onPreviewModeChange?: (mode: PreviewMode) => void;
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
  previewMode: previewModeProp,
  onPreviewModeChange,
  setAssetGenerator,
}: DesignUploadFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [designName, setDesignName] = useState("");
  const [description, setDescription] = useState("");
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);
  const [backDesignFile, setBackDesignFile] = useState<File | null>(null);
  const [backDesignImage, setBackDesignImage] = useState<HTMLImageElement | null>(null);
  
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(["tee"]));
  
  const [colorSelections, setColorSelections] = useState<Record<string, ColorSelection>>({
    tee: {},
    crewneck: {},
    hoodie: {},
  });

  // Preview dimensions for positioning UI (scaled down so the garment stays visible)
  const [designPositions, setDesignPositions] = useState<ProductTypePositions>({
    tee: createDefaultPositionMap(),
    crewneck: createDefaultPositionMap(),
    hoodie: createDefaultPositionMap(),
  });

  const [currentEditingType, setCurrentEditingType] = useState<ProductTypeKey>("tee");
  const [previewColorIndex, setPreviewColorIndex] = useState(0);
  const [activePreviewMode, setActivePreviewMode] = useState<PreviewMode>(previewModeProp || "front");
  const [activeLayer, setActiveLayer] = useState<"front" | "back">("front");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null);

  useEffect(() => {
    if (previewModeProp) {
      setActivePreviewMode(previewModeProp);
      setActiveLayer(previewModeProp === "back" ? "back" : "front");
    }
  }, [previewModeProp]);

  const handlePreviewModeChange = (mode: PreviewMode) => {
    setActivePreviewMode(mode);
    setActiveLayer(mode === "back" ? "back" : "front");
    onPreviewModeChange?.(mode);
  };

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

  const handleBackDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackDesignFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBackDesignImage(img);
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

  const getDesignForLayer = (layer: "front" | "back") => {
    if (layer === "back") {
      return backDesignImage || designImage;
    }
    return designImage;
  };

  const getPositionKeyForMode = (
    mode: PreviewMode = activePreviewMode,
    layer: "front" | "back" = activeLayer
  ): PositionKey => {
    if (mode === "combined") {
      return layer === "front" ? "combinedFront" : "combinedBack";
    }
    return layer;
  };

  const updatePosition = (field: keyof DesignPosition, value: number) => {
    setDesignPositions(prev => {
      const modeForType: PreviewMode = (currentEditingType === "tee" || currentEditingType === "hoodie" || currentEditingType === "crewneck") ? activePreviewMode : "front";
      const positionKey = getPositionKeyForMode(modeForType, activeLayer);
      const currentMap = prev[currentEditingType];
      const current = currentMap[positionKey];
      const designForSizing =
        positionKey === "back" || positionKey === "combinedBack"
          ? getDesignForLayer("back")
          : getDesignForLayer("front");
      
      // If updating scale, maintain aspect ratio
      if (field === 'scale' && designForSizing) {
        const aspectRatio = designForSizing.width / designForSizing.height;
        const baseSize = 200; // base size at scale 1
        const newWidth = baseSize * value;
        const newHeight = baseSize * value;
        
        return {
          ...prev,
          [currentEditingType]: {
            ...currentMap,
            [positionKey]: {
              ...current,
              scale: value,
              width: aspectRatio >= 1 ? newWidth : newWidth * aspectRatio,
              height: aspectRatio >= 1 ? newHeight / aspectRatio : newHeight,
            },
          },
        };
      }
      
      return {
        ...prev,
        [currentEditingType]: {
          ...currentMap,
          [positionKey]: {
            ...current,
            [field]: value,
          },
        },
      };
    });
  };

  const getBlankImagePath = (
    type: ProductTypeKey,
    colorPrefix: string,
    view: "front" | "back" | "frontCombined" | "backCombined" = "front"
  ) => {
    const config = PRODUCT_TYPES[type];
    const encodedPrefix = encodeURIComponent(colorPrefix);
    
    if (type === "tee") {
      const base = `/assets/Blanks/${config.folder}/Tee-${encodedPrefix}-`;
      if (view === "back") return `${base}Back.png`;
      if (view === "frontCombined") return `${base}Front2.png`;
      if (view === "backCombined") return `${base}Back2.png`;
      return `${base}Front.png`;
    } else if (type === "crewneck") {
      const base = `/assets/Blanks/${config.folder}/Crew-${encodedPrefix}-`;
      if (view === "back") return `${base}Back.png`;
      if (view === "frontCombined") return `${base}Front2.png`;
      if (view === "backCombined") return `${base}Back2.png`;
      return `${base}Front.png`;
    } else if (type === "hoodie") {
      const base = `/assets/Blanks/${config.folder}/Hoodie-${encodedPrefix}-`;
      if (view === "back") return `${base}Back.png`;
      if (view === "frontCombined") return `${base}Front2.png`;
      if (view === "backCombined") return `${base}Back2.png`;
      return `${base}Front.png`;
    }
    return "";
  };

  const getHoodieStringsPath = (colorPrefix: string) => {
    if (colorPrefix === "BlkOnBlk") {
      return `/assets/Blanks/BlankHoodies/Hoodie-Black Sting.2png`;
    }
    return `/assets/Blanks/BlankHoodies/Hoodie-White String.png`;
  };

  const toBlobUrl = (canvas: HTMLCanvasElement): Promise<string> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.9
      );
    });

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });

  const compositeImage = async ({
    mode,
    productType,
    previewImageElement,
    frontBasePath,
    backBasePath,
    frontPosition,
    backPosition,
  }: {
    mode: PreviewMode;
    productType: ProductTypeKey;
    previewImageElement: HTMLImageElement;
    frontBasePath: string;
    backBasePath?: string;
    frontPosition: DesignPosition;
    backPosition?: DesignPosition;
  }): Promise<string> => {
    if (!designImage) {
      throw new Error("Design image not available");
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    if (!previewImageElement) {
      throw new Error("Preview image not found");
    }

    if (mode === "combined") {
      if (!backBasePath) {
        throw new Error("Missing back layer for combined preview");
      }

      const [frontBase, backBase] = await Promise.all([
        loadImage(frontBasePath),
        loadImage(backBasePath),
      ]);

      canvas.width = frontBase.width;
      canvas.height = frontBase.height;

      const scaleFactor = canvas.width / previewImageElement.clientWidth;
      const drawDesign = (design: HTMLImageElement | null | undefined, position?: DesignPosition) => {
        if (!design || !position) return;
        const scaledX = position.x * scaleFactor;
        const scaledY = position.y * scaleFactor;
        const scaledWidth = position.width * scaleFactor;
        const scaledHeight = position.height * scaleFactor;
        ctx.drawImage(design, scaledX, scaledY, scaledWidth, scaledHeight);
      };

      if (productType === "hoodie") {
        // Hoodie combined layering: Back2 base → back design → Front2 → front design → strings
        // Layer 1: Back2 base (BOTTOM)
        ctx.drawImage(backBase, 0, 0, backBase.width, backBase.height);
        // Layer 2: Back design overlay
        drawDesign(backDesignImage || designImage, backPosition);
        // Layer 3: Front2
        ctx.drawImage(frontBase, 0, 0, frontBase.width, frontBase.height);
        // Layer 4: Front design overlay
        drawDesign(designImage, frontPosition);
        // Layer 5: Hoodie strings (TOP)
        const colorPrefix = frontBasePath.match(/Hoodie-([^-]+)-/)?.[1] || "Black";
        const stringsImg = await loadImage(getHoodieStringsPath(colorPrefix));
        ctx.drawImage(stringsImg, 0, 0, canvas.width, canvas.height);
      } else if (productType === "crewneck") {
        // Crewneck combined layering: Back2 base → back design → Front2 → front design
        // Layer 1: Back2 base (BOTTOM)
        ctx.drawImage(backBase, 0, 0, backBase.width, backBase.height);
        // Layer 2: Back design overlay
        drawDesign(backDesignImage || designImage, backPosition);
        // Layer 3: Front2
        ctx.drawImage(frontBase, 0, 0, frontBase.width, frontBase.height);
        // Layer 4: Front design overlay
        drawDesign(designImage, frontPosition);
      } else {
        // T-shirt combined layering (existing logic)
        // Layer 1: Front base
        ctx.drawImage(frontBase, 0, 0, frontBase.width, frontBase.height);
        // Layer 2: Front design overlay
        drawDesign(designImage, frontPosition);
        // Layer 3: Back base
        ctx.drawImage(backBase, 0, 0, backBase.width, backBase.height);
        // Layer 4: Back design overlay
        drawDesign(backDesignImage || designImage, backPosition);
      }

      return toBlobUrl(canvas);
    }

    const isBack = mode === "back";
    const basePath = isBack && backBasePath ? backBasePath : frontBasePath;
    const baseImage = await loadImage(basePath);
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;

    const scaleFactor = canvas.width / previewImageElement.clientWidth;
    const position = isBack ? backPosition || frontPosition : frontPosition;
    const design = isBack ? backDesignImage || designImage : designImage;

    ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);
    if (position && design) {
      const scaledX = position.x * scaleFactor;
      const scaledY = position.y * scaleFactor;
      const scaledWidth = position.width * scaleFactor;
      const scaledHeight = position.height * scaleFactor;
      ctx.drawImage(design, scaledX, scaledY, scaledWidth, scaledHeight);
    }

    if (productType === "hoodie" && mode !== "back") {
      const colorPrefix = basePath.match(/Hoodie-([^-]+)-/)?.[1] || "Black";
      const stringsImg = await loadImage(getHoodieStringsPath(colorPrefix));
      ctx.drawImage(stringsImg, 0, 0, canvas.width, canvas.height);
    }

    return toBlobUrl(canvas);
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
      const positionMap = designPositions[type as ProductTypeKey];
      const selectedColors = colorSelections[type];
      const colorsToProcess = config.colors.filter(color => selectedColors[color.filePrefix]);
      if (colorsToProcess.length === 0) continue;

      assets[type] = [];

      for (let i = 0; i < colorsToProcess.length; i++) {
        const color = colorsToProcess[i];
        const modeForType: PreviewMode = (type === "tee" || type === "hoodie" || type === "crewneck") ? activePreviewMode : "front";
        const compositedDataUrl = await compositeImage({
          mode: modeForType,
          productType: type as ProductTypeKey,
          previewImageElement: previewImg,
          frontBasePath: getBlankImagePath(
            type as ProductTypeKey,
            color.filePrefix,
            modeForType === "combined" ? "frontCombined" : "front"
          ),
          backBasePath:
            modeForType === "back"
              ? getBlankImagePath(type as ProductTypeKey, color.filePrefix, "back")
              : modeForType === "combined"
              ? getBlankImagePath(type as ProductTypeKey, color.filePrefix, "backCombined")
              : undefined,
          frontPosition:
            modeForType === "combined" ? positionMap.combinedFront : positionMap.front,
          backPosition:
            modeForType === "combined" ? positionMap.combinedBack : positionMap.back,
        });
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
        const modeForProduct: PreviewMode = (type === "tee" || type === "hoodie" || type === "crewneck") ? activePreviewMode : "front";
        const positionMap = designPositions[type as ProductTypeKey];
        const selectedColors = colorSelections[type];

        const colorsToProcess = config.colors.filter(color => selectedColors[color.filePrefix]);
        if (colorsToProcess.length === 0) continue;

        const slug = `${designName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${type}`;
        const title = `${designName} - ${config.label}`;

        completed += 1;
        bumpProgress(`Creating ${title}...`);

        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({
            title,
            slug,
            description,
            print_cost_cents: 300,
            active: true,
            preview_mode: modeForProduct,
          })
          .select("id")
          .single();

        if (productError) throw productError;

        // Process colors and add them with proper color data
        for (let i = 0; i < colorsToProcess.length; i++) {
          const color = colorsToProcess[i];
          const modeForType: PreviewMode = (type === "tee" || type === "hoodie" || type === "crewneck") ? activePreviewMode : "front";
          const compositedDataUrl = await compositeImage({
            mode: modeForType,
            productType: type as ProductTypeKey,
            previewImageElement: previewImg,
            frontBasePath: getBlankImagePath(
              type as ProductTypeKey,
              color.filePrefix,
              modeForType === "combined" ? "frontCombined" : "front"
            ),
            backBasePath:
              modeForType === "back"
                ? getBlankImagePath(type as ProductTypeKey, color.filePrefix, "back")
                : modeForType === "combined"
                ? getBlankImagePath(type as ProductTypeKey, color.filePrefix, "backCombined")
                : undefined,
            frontPosition:
              modeForType === "combined" ? positionMap.combinedFront : positionMap.front,
            backPosition:
              modeForType === "combined" ? positionMap.combinedBack : positionMap.back,
          });
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
  }, [
    setAssetGenerator,
    designFile,
    designImage,
    backDesignFile,
    backDesignImage,
    selectedTypes,
    colorSelections,
    designPositions,
    activePreviewMode,
  ]);

  const effectivePreviewMode: PreviewMode =
    currentEditingType === "tee" || currentEditingType === "hoodie" || currentEditingType === "crewneck" ? activePreviewMode : "front";
  const currentConfig = PRODUCT_TYPES[currentEditingType];
  const currentPreviewColor = currentConfig.colors[previewColorIndex];
  const currentPositionKey = getPositionKeyForMode(effectivePreviewMode, activeLayer);
  const currentPosition = designPositions[currentEditingType][currentPositionKey];
  const positionMap = designPositions[currentEditingType];
  const combinedFrontPosition = positionMap.combinedFront;
  const combinedBackPosition = positionMap.combinedBack;
  const layerLabel =
    effectivePreviewMode === "combined"
      ? `${activeLayer === "front" ? "Front" : "Back"} layer`
      : effectivePreviewMode === "back"
      ? "Back layer"
      : "Front layer";
  const backDesignUsed = getDesignForLayer("back");

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="alert-error">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold mb-6 pb-4 border-b-2 border-brand-accent text-brand-paper">Design Information</h2>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label text-brand-paper">Design Name *</label>
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
            <label className="label text-brand-paper">Description</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your design..." rows={4} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-6 pb-4 border-b-2 border-brand-accent text-brand-paper">🎨 Upload Design (PNG)</h2>
        <div className="form-group">
          <label className="label text-brand-paper">Design File *</label>
          <input type="file" accept="image/png" onChange={handleDesignUpload} className="input" required />
          <p className="text-xs text-brand-accent mt-1">Upload a transparent PNG for best results</p>
        </div>
        <div className="form-group">
          <label className="label text-brand-paper">Back Design File (optional)</label>
          <input type="file" accept="image/png" onChange={handleBackDesignUpload} className="input" />
          <p className="text-xs text-brand-accent mt-1">
            Back-only and combined previews will use this artwork. If omitted, the front design is reused.
          </p>
        </div>
        
        {designImage && (
          <div className="mt-4 border-2 border-brand-accent p-4">
            <p className="text-sm font-bold mb-2 text-brand-paper">Design Preview:</p>
            <img src={designImage.src} alt="Design preview" className="max-w-xs border-2 border-brand-accent bg-gray-100" />
          </div>
        )}
        {backDesignImage && (
          <div className="mt-4 border-2 border-brand-accent p-4">
            <p className="text-sm font-bold mb-2 text-brand-paper">Back Design Preview:</p>
            <img src={backDesignImage.src} alt="Back design preview" className="max-w-xs border-2 border-brand-accent bg-gray-100" />
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
            <label className="label text-brand-paper">Editing Position For:</label>
            <div className="flex gap-2">
              {Array.from(selectedTypes).map(type => (
                <button 
                  key={type} 
                  type="button" 
                  onClick={() => {
                    setCurrentEditingType(type as ProductTypeKey);
                    setPreviewColorIndex(0);
                    if (type !== "tee" && type !== "hoodie" && type !== "crewneck" && effectivePreviewMode !== "front") {
                      handlePreviewModeChange("front");
                    }
                  }} 
                  className={`px-4 py-2 border border-brand-accent font-bold ${
                    currentEditingType === type
                      ? "bg-brand-blood text-brand-paper"
                      : "bg-transparent text-brand-paper hover:bg-[rgba(203,184,155,0.12)]"
                  }`}
                >
                  {PRODUCT_TYPES[type as ProductTypeKey].label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="mb-6 p-4 bg-[rgba(36,33,27,0.7)] border border-brand-accent text-brand-paper">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-bold text-brand-paper">👁️ Live Preview</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-brand-accent">Preview Mode:</label>
                  {(["front", "back", "combined"] as PreviewMode[]).map((mode) => {
                    const disabled = currentEditingType !== "tee" && currentEditingType !== "hoodie" && currentEditingType !== "crewneck" && mode !== "front";
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handlePreviewModeChange(mode)}
                        disabled={disabled}
                        className={`px-3 py-1 border text-xs font-semibold uppercase tracking-wide ${
                          effectivePreviewMode === mode
                            ? "bg-brand-blood text-brand-paper border-brand-accent"
                            : "border-brand-accent bg-transparent text-brand-paper"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[rgba(203,184,155,0.12)]"}`}
                      >
                        {mode === "front" ? "Front only" : mode === "back" ? "Back only" : "Front + Back"}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-brand-accent">Preview Color:</label>
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
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative bg-[rgba(36,33,27,0.55)] border border-brand-accent w-full md:w-auto max-w-xl mx-auto md:mx-0">
                {effectivePreviewMode === "combined" ? (
                  <>
                    {currentEditingType === "hoodie" ? (
                      <>
                        {/* Hoodie combined: Back2 base → back design → Front2 → front design → strings */}
                        <img
                          src={getBlankImagePath(
                            currentEditingType,
                            currentPreviewColor.filePrefix,
                            "backCombined"
                          )}
                          alt={`${currentConfig.label} - ${currentPreviewColor.name} combined back base`}
                          className="block preview-blank-image"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                        {backDesignUsed && (
                          <img
                            src={backDesignUsed.src}
                            alt="Your design back"
                            className="absolute pointer-events-none"
                            style={{
                              left: `${combinedBackPosition.x}px`,
                              top: `${combinedBackPosition.y}px`,
                              width: `${combinedBackPosition.width}px`,
                              height: `${combinedBackPosition.height}px`,
                            }}
                          />
                        )}
                        <img
                          src={getBlankImagePath(
                            currentEditingType,
                            currentPreviewColor.filePrefix,
                            "frontCombined"
                          )}
                          alt={`${currentConfig.label} - ${currentPreviewColor.name} combined front`}
                          className="absolute top-0 left-0 w-full h-auto pointer-events-none"
                          style={{ maxWidth: "100%" }}
                        />
                        {designImage && (
                          <img
                            src={designImage.src}
                            alt="Your design front"
                            className="absolute pointer-events-none"
                            style={{
                              left: `${combinedFrontPosition.x}px`,
                              top: `${combinedFrontPosition.y}px`,
                              width: `${combinedFrontPosition.width}px`,
                              height: `${combinedFrontPosition.height}px`,
                            }}
                          />
                        )}
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
                      </>
                    ) : currentEditingType === "crewneck" ? (
                      <>
                        {/* Crewneck combined: Back2 base → back design → Front2 → front design */}
                        <img
                          src={getBlankImagePath(
                            currentEditingType,
                            currentPreviewColor.filePrefix,
                            "backCombined"
                          )}
                          alt={`${currentConfig.label} - ${currentPreviewColor.name} combined back base`}
                          className="block preview-blank-image"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                        {backDesignUsed && (
                          <img
                            src={backDesignUsed.src}
                            alt="Your design back"
                            className="absolute pointer-events-none"
                            style={{
                              left: `${combinedBackPosition.x}px`,
                              top: `${combinedBackPosition.y}px`,
                              width: `${combinedBackPosition.width}px`,
                              height: `${combinedBackPosition.height}px`,
                            }}
                          />
                        )}
                        <img
                          src={getBlankImagePath(
                            currentEditingType,
                            currentPreviewColor.filePrefix,
                            "frontCombined"
                          )}
                          alt={`${currentConfig.label} - ${currentPreviewColor.name} combined front`}
                          className="absolute top-0 left-0 w-full h-auto pointer-events-none"
                          style={{ maxWidth: "100%" }}
                        />
                        {designImage && (
                          <img
                            src={designImage.src}
                            alt="Your design front"
                            className="absolute pointer-events-none"
                            style={{
                              left: `${combinedFrontPosition.x}px`,
                              top: `${combinedFrontPosition.y}px`,
                              width: `${combinedFrontPosition.width}px`,
                              height: `${combinedFrontPosition.height}px`,
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        {/* T-shirt combined: Front base → front design → Back base → back design */}
                        <img
                          src={getBlankImagePath(
                            currentEditingType,
                            currentPreviewColor.filePrefix,
                            "frontCombined"
                          )}
                          alt={`${currentConfig.label} - ${currentPreviewColor.name} combined front`}
                          className="block preview-blank-image"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                        {designImage && (
                          <img
                            src={designImage.src}
                            alt="Your design front"
                            className="absolute pointer-events-none"
                            style={{
                              left: `${combinedFrontPosition.x}px`,
                              top: `${combinedFrontPosition.y}px`,
                              width: `${combinedFrontPosition.width}px`,
                              height: `${combinedFrontPosition.height}px`,
                            }}
                          />
                        )}
                        <img
                          src={getBlankImagePath(
                            currentEditingType,
                            currentPreviewColor.filePrefix,
                            "backCombined"
                          )}
                          alt={`${currentConfig.label} - ${currentPreviewColor.name} combined back`}
                          className="absolute top-0 left-0 w-full h-auto pointer-events-none"
                          style={{ maxWidth: "100%" }}
                        />
                        {backDesignUsed && (
                          <img
                            src={backDesignUsed.src}
                            alt="Your design back"
                            className="absolute pointer-events-none"
                            style={{
                              left: `${combinedBackPosition.x}px`,
                              top: `${combinedBackPosition.y}px`,
                              width: `${combinedBackPosition.width}px`,
                              height: `${combinedBackPosition.height}px`,
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <img
                      src={getBlankImagePath(
                        currentEditingType,
                        currentPreviewColor.filePrefix,
                        effectivePreviewMode === "back" ? "back" : "front"
                      )}
                      alt={`${currentConfig.label} - ${currentPreviewColor.name}`}
                      className="block preview-blank-image"
                      style={{ maxWidth: "100%", height: "auto" }}
                      onError={(e) => {
                        console.error(
                          "Failed to load blank image:",
                          getBlankImagePath(
                            currentEditingType,
                            currentPreviewColor.filePrefix,
                            effectivePreviewMode === "back" ? "back" : "front"
                          )
                        );
                      }}
                    />
                    {getDesignForLayer(effectivePreviewMode === "back" ? "back" : "front") && (
                      <img
                        src={getDesignForLayer(
                          effectivePreviewMode === "back" ? "back" : "front"
                        )!.src}
                        alt="Your design"
                        className="absolute pointer-events-none"
                        style={{
                          left: `${currentPosition.x}px`,
                          top: `${currentPosition.y}px`,
                          width: `${currentPosition.width}px`,
                          height: `${currentPosition.height}px`,
                        }}
                      />
                    )}
                    {/* Hoodie strings overlay (only for hoodies on front or combined views) */}
                    {currentEditingType === "hoodie" && effectivePreviewMode !== "back" && (
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
                  </>
                )}
                <p className="text-xs text-brand-accent mt-2 px-3 py-2">
                  Adjust sliders to reposition your design. The preview updates in real-time.
                  {currentEditingType === "hoodie" && effectivePreviewMode === "front" && " (Hoodie strings overlay shown on top)"}
                  {currentEditingType === "hoodie" && effectivePreviewMode === "combined" &&
                    " Hoodie layer order: Back2 base → Back design → Front2 → Front design → Strings (top)."}
                  {currentEditingType === "crewneck" && effectivePreviewMode === "combined" &&
                    " Crewneck layer order: Back2 base → Back design → Front2 → Front design."}
                  {currentEditingType === "tee" && effectivePreviewMode === "combined" &&
                    " Layer order: Front base → Front design → Back base → Back design."}
                  {effectivePreviewMode !== "front" && !backDesignUsed && " Back design not uploaded—reusing front artwork."}
                </p>
              </div>

              <div className="flex-1 w-full md:w-80 bg-[rgba(36,33,27,0.55)] text-brand-paper border border-dashed border-brand-accent rounded p-4">
                <h4 className="text-sm font-bold mb-3 text-brand-paper">Position Controls</h4>
                {effectivePreviewMode !== "front" && (
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveLayer("front")}
                      disabled={effectivePreviewMode === "back"}
                      className={`px-3 py-1 border text-xs font-semibold ${
                        activeLayer === "front"
                          ? "bg-brand-blood text-brand-paper border-brand-accent"
                          : "border-brand-accent bg-transparent text-brand-paper"
                      } ${effectivePreviewMode === "back" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      Front Layer
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLayer("back")}
                      className={`px-3 py-1 border text-xs font-semibold ${
                        activeLayer === "back"
                          ? "bg-brand-blood text-brand-paper border-brand-accent"
                          : "border-brand-accent bg-transparent text-brand-paper"
                      }`}
                    >
                      Back Layer
                    </button>
                  </div>
                )}
                <p className="text-xs text-brand-accent mb-3 font-medium uppercase tracking-wide">
                  Editing: {layerLabel}
                </p>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="label text-brand-paper">X Position (Left/Right)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="400" 
                      value={currentPosition.x} 
                      onChange={(e) => updatePosition("x", parseInt(e.target.value))} 
                      className="w-full" 
                    />
                    <span className="text-sm text-brand-paper">{currentPosition.x}px</span>
                  </div>
                  <div className="form-group">
                    <label className="label text-brand-paper">Y Position (Up/Down)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="600" 
                      value={currentPosition.y} 
                      onChange={(e) => updatePosition("y", parseInt(e.target.value))} 
                      className="w-full" 
                    />
                    <span className="text-sm text-brand-paper">{currentPosition.y}px</span>
                  </div>
                  <div className="form-group">
                    <label className="label text-brand-paper">Scale (Size)</label>
                    <input 
                      type="range" 
                      min="0.25" 
                      max="2.5" 
                      step="0.05"
                      value={currentPosition.scale} 
                      onChange={(e) => updatePosition("scale", parseFloat(e.target.value))} 
                      className="w-full" 
                    />
                    <span className="text-sm text-brand-paper">{Math.round(currentPosition.scale * 100)}%</span>
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
            <h2 className="text-xl font-bold mb-6 pb-4 border-b-2 border-brand-accent text-brand-paper">🎨 Select Colors for {config.label}</h2>
            <p className="text-sm text-brand-accent mb-4">
              Check the colors that look good with your design (use preview above to verify)
              {type === "hoodie" && " • Hoodie strings will be overlaid on all colors"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {config.colors.map(color => (
                <label key={color.filePrefix} className="flex items-center gap-3 cursor-pointer p-3 border-2 border-brand-accent hover:bg-[rgba(203,184,155,0.12)]">
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
              <div className="card border-dashed border-2 border-brand-accent/60 mb-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{progress.message}</span>
                  <span>{Math.min(progress.percent, 100)}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-brand-accent transition-all duration-300"
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
