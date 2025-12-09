"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      { name: "Bone", filePrefix: "Bone", hex: "#E3DAC9" },
      { name: "Clay", filePrefix: "Clay", hex: "#B98976" },
      { name: "Graphite Black", filePrefix: "Graphite Black", hex: "#3E3E3E" },
      { name: "Heather Gray", filePrefix: "Heather Gray", hex: "#B8B8B8" },
      { name: "Light Olive", filePrefix: "Light Olive", hex: "#A4A869" },
      { name: "Midnight Navy", filePrefix: "Midnight Navy", hex: "#1A2238" },
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
      { name: "Black on Black", filePrefix: "Black_on_Black", hex: "#000000" },
      { name: "Desert Pink", filePrefix: "Desert Pink", hex: "#E1B7A0" },
      { name: "Heavy Metal", filePrefix: "Heavy Metal", hex: "#4A4A4A" },
      { name: "Military Green", filePrefix: "Military Green", hex: "#5A5F4A" },
      { name: "Natural", filePrefix: "Natural", hex: "#F5F5DC" },
      { name: "Oxblood", filePrefix: "Oxblood", hex: "#800020" },
      { name: "White", filePrefix: "White", hex: "#FFFFFF" },
    ],
    defaultPricing: [
      { size: "S", price: 44.99, weight: 12.0 },
      { size: "M", price: 44.99, weight: 12.5 },
      { size: "L", price: 44.99, weight: 13.0 },
      { size: "XL", price: 44.99, weight: 13.5 },
      { size: "2XL", price: 46.99, weight: 14.0 },
      { size: "3XL", price: 47.99, weight: 14.5 },
      { size: "4XL", price: 48.99, weight: 15.0 },
    ],
    supportsAllPreviewModes: true, // Hoodies support all three preview modes
  },
  youth_tee: {
    label: "Youth T-Shirt",
    folder: "Youth/Tees",
    colors: [
      { name: "Cactus", filePrefix: "Cactus", hex: "#6B8E23" },
      { name: "Caribbean Mist", filePrefix: "Caribbean_Mist", hex: "#A7D8DE" },
      { name: "Cement", filePrefix: "Cement", hex: "#9E9E9E" },
      { name: "Daisy Mist", filePrefix: "Daisy_Mist", hex: "#FFF8DC" },
      { name: "Dusty Rose", filePrefix: "Dusty_Rose", hex: "#DCAE96" },
      { name: "Navy Mist", filePrefix: "Navy_Mist", hex: "#4A5C7A" },
      { name: "Pink Lemonade", filePrefix: "Pink_Lemonade", hex: "#FFB6C1" },
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Red", filePrefix: "Red", hex: "#DC143C" },
      { name: "Royal", filePrefix: "Royal", hex: "#4169E1" },
      { name: "Blue", filePrefix: "Blue", hex: "#0000FF" },
    ],
    defaultPricing: [
      { size: "YXS", price: 24.99, weight: 3.5 },
      { size: "YS", price: 24.99, weight: 4.0 },
      { size: "YM", price: 24.99, weight: 4.5 },
      { size: "YL", price: 24.99, weight: 5.0 },
      { size: "YXL", price: 26.99, weight: 5.5 },
    ],
    supportsAllPreviewModes: true,
  },
  youth_hoodie: {
    label: "Youth Hoodie",
    folder: "Youth/Hoodies",
    colors: [
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Daisy", filePrefix: "Daisy", hex: "#FFF8DC" },
      { name: "Dark Heather", filePrefix: "Dark_Heather", hex: "#4A4A4A" },
      { name: "Forest Green", filePrefix: "Forest_Green", hex: "#228B22" },
      { name: "Light Pink", filePrefix: "Light_Pink", hex: "#FFB6C1" },
      { name: "Maroon", filePrefix: "Maroon", hex: "#800000" },
      { name: "Military Green", filePrefix: "Military_Green", hex: "#5A5F4A" },
      { name: "Pink Lemonade", filePrefix: "Pink_Lemonade", hex: "#FFB6C1" },
      { name: "Red", filePrefix: "Red", hex: "#DC143C" },
      { name: "Sport Grey", filePrefix: "Sport_Grey", hex: "#B8B8B8" },
      { name: "Royal", filePrefix: "Royal", hex: "#4169E1" },
      { name: "Sand", filePrefix: "Sand", hex: "#D7C4A0" },
      { name: "White", filePrefix: "White", hex: "#FFFFFF" },
    ],
    defaultPricing: [
      { size: "YXS", price: 38.99, weight: 9.0 },
      { size: "YS", price: 38.99, weight: 9.5 },
      { size: "YM", price: 38.99, weight: 10.0 },
      { size: "YL", price: 38.99, weight: 10.5 },
      { size: "YXL", price: 40.99, weight: 11.0 },
    ],
    supportsAllPreviewModes: true,
  },
  youth_longsleeve: {
    label: "Youth Longsleeve",
    folder: "Youth/Longsleeve",
    colors: [
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Carolina Blue", filePrefix: "Carolina_Blue", hex: "#56A0D3" },
      { name: "Forest Green", filePrefix: "Forest_Green", hex: "#228B22" },
      { name: "Gold", filePrefix: "Gold", hex: "#FFD700" },
      { name: "Irish Green", filePrefix: "Irish_Green", hex: "#009A49" },
      { name: "Navy", filePrefix: "Navy", hex: "#000080" },
      { name: "Purple", filePrefix: "Purple", hex: "#800080" },
      { name: "Red", filePrefix: "Red", hex: "#DC143C" },
      { name: "Royal", filePrefix: "Royal", hex: "#4169E1" },
      { name: "Sport Grey", filePrefix: "Sport_Grey", hex: "#B8B8B8" },
      { name: "White", filePrefix: "White", hex: "#FFFFFF" },
    ],
    defaultPricing: [
      { size: "YXS", price: 28.99, weight: 5.0 },
      { size: "YS", price: 28.99, weight: 5.5 },
      { size: "YM", price: 28.99, weight: 6.0 },
      { size: "YL", price: 28.99, weight: 6.5 },
    ],
    supportsAllPreviewModes: true,
  },
};

type ProductTypeKey = keyof typeof PRODUCT_TYPES;

const MULTI_VIEW_PRODUCT_TYPES: Set<ProductTypeKey> = new Set([
  "tee",
  "hoodie",
  "crewneck",
  "youth_tee",
  "youth_hoodie",
  "youth_longsleeve",
]);

const isMultiViewProduct = (type: ProductTypeKey) => MULTI_VIEW_PRODUCT_TYPES.has(type);
const isHoodieType = (type: ProductTypeKey) => type === "hoodie" || type === "youth_hoodie";

const compositeLayout: Record<
  ProductTypeKey,
  {
    front: { scale: number; x: number; y: number };
    back: { scale: number; x: number; y: number };
  }
> = {
  tee: {
    front: { scale: 0.85, x: -140, y: 0 },
    back: { scale: 1.0, x: 120, y: -20 },
  },
  hoodie: {
    front: { scale: 0.85, x: -130, y: 0 },
    back: { scale: 1.0, x: 110, y: -20 },
  },
  crewneck: {
    front: { scale: 0.85, x: -135, y: 0 },
    back: { scale: 1.0, x: 115, y: -20 },
  },
  youth_tee: {
    front: { scale: 0.85, x: -140, y: 0 },
    back: { scale: 1.0, x: 120, y: -20 },
  },
  youth_hoodie: {
    front: { scale: 0.85, x: -130, y: 0 },
    back: { scale: 1.0, x: 110, y: -20 },
  },
  youth_longsleeve: {
    front: { scale: 0.85, x: -140, y: 0 },
    back: { scale: 1.0, x: 120, y: -20 },
  },
};

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

// Product-specific default design positions
const DESIGN_POSITION_DEFAULTS: Record<ProductTypeKey, { front: DesignPosition; back: DesignPosition }> = {
  tee: {
    front: {
      x: 269,
      y: 100,
      width: 120,
      height: 120,
      scale: 0.6,
    },
    back: {
      x: 80,
      y: 52,
      width: 120,
      height: 120,
      scale: 1.75,
    },
  },
  hoodie: {
    front: {
      x: 244,
      y: 170,
      width: 120,
      height: 120,
      scale: 0.55,
    },
    back: {
      x: 112,
      y: 140,
      width: 120,
      height: 120,
      scale: 1.5,
    },
  },
  crewneck: {
    front: {
      x: 259,
      y: 78,
      width: 120,
      height: 120,
      scale: 0.7,
    },
    back: {
      x: 98,
      y: 58,
      width: 120,
      height: 120,
      scale: 1.55,
    },
  },
  youth_tee: {
    front: {
      x: 269,
      y: 100,
      width: 120,
      height: 120,
      scale: 0.6,
    },
    back: {
      x: 80,
      y: 52,
      width: 120,
      height: 120,
      scale: 1.75,
    },
  },
  youth_hoodie: {
    front: {
      x: 244,
      y: 170,
      width: 120,
      height: 120,
      scale: 0.55,
    },
    back: {
      x: 112,
      y: 140,
      width: 120,
      height: 120,
      scale: 1.5,
    },
  },
  youth_longsleeve: {
    front: {
      x: 269,
      y: 100,
      width: 120,
      height: 120,
      scale: 0.6,
    },
    back: {
      x: 80,
      y: 52,
      width: 120,
      height: 120,
      scale: 1.75,
    },
  },
};

const createDefaultPosition = (): DesignPosition => ({
  x: 70,
  y: 140,
  width: 120,
  height: 120,
  scale: 0.6,
});

const createDefaultPositionMap = (productType: ProductTypeKey): Record<PositionKey, DesignPosition> => ({
  front: DESIGN_POSITION_DEFAULTS[productType].front,
  back: DESIGN_POSITION_DEFAULTS[productType].back,
  combinedFront: DESIGN_POSITION_DEFAULTS[productType].front,
  combinedBack: DESIGN_POSITION_DEFAULTS[productType].back,
});

// Product-specific default group offsets for combined view positioning
const PRODUCT_GROUP_OFFSET_DEFAULTS: Record<ProductTypeKey, { front: { x: number; y: number }; back: { x: number; y: number } }> = {
  tee: {
    front: { x: -248, y: 357 },
    back: { x: 323, y: 0 },
  },
  hoodie: {
    front: { x: -317, y: 426 },
    back: { x: 253, y: 0 },
  },
  crewneck: {
    front: { x: -784, y: 616 },
    back: { x: 634, y: 0 },
  },
  youth_tee: {
    front: { x: -248, y: 357 },
    back: { x: 323, y: 0 },
  },
  youth_hoodie: {
    front: { x: -317, y: 426 },
    back: { x: 253, y: 0 },
  },
  youth_longsleeve: {
    front: { x: -248, y: 357 },
    back: { x: 323, y: 0 },
  },
};

const createDefaultGroupOffset = () => ({ x: 0, y: 0 });

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
  const supabase = useMemo(() => createClient(), []);

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
    youth_tee: {},
    youth_hoodie: {},
    youth_longsleeve: {},
  });

  // Base mockup color for generating front/back images (one per product type)
  const [baseMockupColors, setBaseMockupColors] = useState<Record<string, string>>({
    tee: PRODUCT_TYPES.tee.colors[0].filePrefix,
    crewneck: PRODUCT_TYPES.crewneck.colors[0].filePrefix,
    hoodie: PRODUCT_TYPES.hoodie.colors[0].filePrefix,
    youth_tee: PRODUCT_TYPES.youth_tee.colors[0].filePrefix,
    youth_hoodie: PRODUCT_TYPES.youth_hoodie.colors[0].filePrefix,
    youth_longsleeve: PRODUCT_TYPES.youth_longsleeve.colors[0].filePrefix,
  });

  // Preview dimensions for positioning UI (scaled down so the garment stays visible)
  const [designPositions, setDesignPositions] = useState<ProductTypePositions>({
    tee: createDefaultPositionMap('tee'),
    crewneck: createDefaultPositionMap('crewneck'),
    hoodie: createDefaultPositionMap('hoodie'),
    youth_tee: createDefaultPositionMap('youth_tee'),
    youth_hoodie: createDefaultPositionMap('youth_hoodie'),
    youth_longsleeve: createDefaultPositionMap('youth_longsleeve'),
  });
  const [groupOffsets, setGroupOffsets] = useState<
    Record<ProductTypeKey, { front: { x: number; y: number }; back: { x: number; y: number } }>
  >({
    tee: PRODUCT_GROUP_OFFSET_DEFAULTS.tee,
    crewneck: PRODUCT_GROUP_OFFSET_DEFAULTS.crewneck,
    hoodie: PRODUCT_GROUP_OFFSET_DEFAULTS.hoodie,
    youth_tee: PRODUCT_GROUP_OFFSET_DEFAULTS.youth_tee,
    youth_hoodie: PRODUCT_GROUP_OFFSET_DEFAULTS.youth_hoodie,
    youth_longsleeve: PRODUCT_GROUP_OFFSET_DEFAULTS.youth_longsleeve,
  });

  const [currentEditingType, setCurrentEditingType] = useState<ProductTypeKey>("tee");
  const [previewColorIndex, setPreviewColorIndex] = useState(0);
  const [activePreviewMode, setActivePreviewMode] = useState<PreviewMode>(previewModeProp || "front");
  const [activeLayer, setActiveLayer] = useState<"front" | "back">("front");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [combinedPreviewUrl, setCombinedPreviewUrl] = useState<string | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (previewModeProp) {
      setActivePreviewMode(previewModeProp);
      setActiveLayer(previewModeProp === "back" ? "back" : "front");
    }
  }, [previewModeProp]);
  
  useEffect(() => {
    const handleResize = () => updatePreviewWidth();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  
  const updatePreviewWidth = () => {
    const node = previewImageRef.current;
    if (!node) return;
    const width = node.clientWidth || node.naturalWidth;
    if (width) setPreviewWidth(width);
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

  const updateGroupOffset = (
    productType: ProductTypeKey,
    layer: "front" | "back",
    axis: "x" | "y",
    value: number
  ) => {
    setGroupOffsets((prev) => ({
      ...prev,
      [productType]: {
        ...prev[productType],
        [layer]: {
          ...prev[productType][layer],
          [axis]: value,
        },
      },
    }));
  };

  const getPositionKeyForMode = (
    mode: PreviewMode = activePreviewMode,
    layer: "front" | "back" = activeLayer
  ): PositionKey => {
    // In combined mode, use combinedFront/combinedBack keys
    // In front/back only modes, use front/back keys
    if (mode === "combined") {
      return layer === "front" ? "combinedFront" : "combinedBack";
    }
    return layer;
  };

  const updatePosition = (field: keyof DesignPosition, value: number) => {
    setDesignPositions(prev => {
      const modeForType: PreviewMode = isMultiViewProduct(currentEditingType) ? activePreviewMode : "front";
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
    view: "front" | "back" = "front"
  ) => {
    const config = PRODUCT_TYPES[type];
    const encodedPrefix = encodeURIComponent(colorPrefix);

    switch (type) {
      case "tee": {
        const base = `/assets/Blanks/${config.folder}/Tee-${encodedPrefix}-`;
        return view === "back" ? `${base}Back.png` : `${base}Front.png`;
      }
      case "crewneck": {
        const base = `/assets/Blanks/${config.folder}/Crew-${encodedPrefix}-`;
        return view === "back" ? `${base}Back.png` : `${base}Front.png`;
      }
      case "hoodie": {
        const base = `/assets/Blanks/${config.folder}/Hoodie-${encodedPrefix}-`;
        return view === "back" ? `${base}Back.png` : `${base}Front.png`;
      }
      case "youth_tee": {
        const base = `/assets/Blanks/${config.folder}/Y-Tees-${encodedPrefix}-`;
        return view === "back" ? `${base}Back.png` : `${base}Front.png`;
      }
      case "youth_hoodie": {
        const base = `/assets/Blanks/${config.folder}/Y-Hoodie-${encodedPrefix}-`;
        return view === "back" ? `${base}Back.png` : `${base}Front.png`;
      }
      case "youth_longsleeve": {
        const base = `/assets/Blanks/${config.folder}/Y-Longsleeve-${encodedPrefix}-`;
        return view === "back" ? `${base}Back.png` : `${base}Front.png`;
      }
      default:
        return "";
    }
  };

  const getHoodieStringsPath = (colorPrefix: string) => {
    if (colorPrefix === "Black_on_Black") {
      return `/assets/Blanks/BlankHoodies/Hoodie-Black Sting.png`;
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
        "image/png",
        0.95  // 95% quality for PNGs - slight compression while maintaining quality
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
    previewWidth,
    frontBasePath,
    backBasePath,
    frontPosition,
    backPosition,
    frontGroupOffset,
    backGroupOffset,
  }: {
    mode: PreviewMode;
    productType: ProductTypeKey;
    previewWidth?: number | null;
    frontBasePath: string;
    backBasePath?: string;
    frontPosition: DesignPosition;
    backPosition?: DesignPosition;
    frontGroupOffset?: { x: number; y: number };
    backGroupOffset?: { x: number; y: number };
  }): Promise<string> => {
    if (!designImage) {
      throw new Error("Design image not available");
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    if (mode === "combined") {
      if (!backBasePath) {
        throw new Error("Missing back layer for combined preview");
      }

      const [frontBase, backBase] = await Promise.all([
        loadImage(frontBasePath),
        loadImage(backBasePath),
      ]);

      const layout = compositeLayout[productType] || compositeLayout.tee;
      
      // Scale down to max 2000px width for web-friendly file sizes
      const MAX_WIDTH = 2000;
      const scaleDown = frontBase.width > MAX_WIDTH ? MAX_WIDTH / frontBase.width : 1;

      // When previewWidth is null (production), scaleFactor should be scaleDown
      // When previewWidth is provided (preview), scaleFactor scales from preview to full canvas
      const scaleFactor = previewWidth ? (frontBase.width * scaleDown / previewWidth) : scaleDown;

      // Compute scaled rectangles relative to the top-left origin, then shift so nothing is clipped.
      const rectFor = (img: HTMLImageElement, layer: "front" | "back") => {
        const cfg = layout[layer];
        const width = img.width * cfg.scale * scaleDown;
        const height = img.height * cfg.scale * scaleDown;
        return {
          width,
          height,
          x: (cfg.x + (layer === "front" ? frontGroupOffset?.x || 0 : backGroupOffset?.x || 0)) * scaleDown,
          y: (cfg.y + (layer === "front" ? frontGroupOffset?.y || 0 : backGroupOffset?.y || 0)) * scaleDown,
        };
      };

      const frontRect = rectFor(frontBase, "front");
      const backRect = rectFor(backBase, "back");
      canvas.width = frontBase.width * scaleDown;
      canvas.height = frontBase.height * scaleDown;
      ctx.save();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.clip();

      const drawLayer = (
        base: HTMLImageElement,
        rect: { x: number; y: number; width: number; height: number },
        design: HTMLImageElement | null | undefined,
        position?: DesignPosition
      ) => {
        ctx.drawImage(base, rect.x, rect.y, rect.width, rect.height);
        if (!design || !position) return;
        
        // Calculate the scale of the garment in the combined view
        const garmentScaleX = rect.width / (base.width * scaleDown);
        const garmentScaleY = rect.height / (base.height * scaleDown);
        
        // Position is in preview coordinates, scale it to match the garment's size in combined view
        const designX = rect.x + (position.x * scaleFactor * garmentScaleX);
        const designY = rect.y + (position.y * scaleFactor * garmentScaleY);
        const designW = position.width * scaleFactor * garmentScaleX;
        const designH = position.height * scaleFactor * garmentScaleY;
        ctx.drawImage(design, designX, designY, designW, designH);
      };

      // Layer order: Back base → back design → Front base → front design → (hoodie strings if applicable)
      drawLayer(backBase, backRect, backDesignImage || designImage, backPosition);
      drawLayer(frontBase, frontRect, designImage, frontPosition);

      if (isHoodieType(productType)) {
        const colorPrefix = frontBasePath.match(/Hoodie-([^-]+)-/)?.[1] || "Black";
        const stringsImg = await loadImage(getHoodieStringsPath(colorPrefix));
        ctx.drawImage(stringsImg, frontRect.x, frontRect.y, frontRect.width, frontRect.height);
      }

      ctx.restore();
      return toBlobUrl(canvas);
    }

    const isBack = mode === "back";
    const basePath = isBack && backBasePath ? backBasePath : frontBasePath;
    const baseImage = await loadImage(basePath);
    
    // Scale down to max 2000px width for web-friendly file sizes
    const MAX_WIDTH = 2000;
    const scaleDown = baseImage.width > MAX_WIDTH ? MAX_WIDTH / baseImage.width : 1;
    
    canvas.width = baseImage.width * scaleDown;
    canvas.height = baseImage.height * scaleDown;

    // When previewWidth is null (production), scaleFactor should be scaleDown
    // When previewWidth is provided (preview), scaleFactor scales from preview to full canvas
    const scaleFactor = previewWidth ? (canvas.width / previewWidth) : scaleDown;
    const position = isBack ? backPosition || frontPosition : frontPosition;
    const design = isBack ? backDesignImage || designImage : designImage;

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    if (position && design) {
      const scaledX = position.x * scaleFactor;
      const scaledY = position.y * scaleFactor;
      const scaledWidth = position.width * scaleFactor;
      const scaledHeight = position.height * scaleFactor;
      ctx.drawImage(design, scaledX, scaledY, scaledWidth, scaledHeight);
    }

    if (isHoodieType(productType) && mode !== "back") {
      const colorPrefix = basePath.match(/Hoodie-([^-]+)-/)?.[1] || "Black";
      const stringsImg = await loadImage(getHoodieStringsPath(colorPrefix));
      ctx.drawImage(stringsImg, 0, 0, canvas.width, canvas.height);
    }

    return toBlobUrl(canvas);
  };

  const uploadCompositedImage = async (dataUrl: string, productType: string, color: string, view: string = "combined"): Promise<string> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const fileName = `${Date.now()}-${designName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${productType}-${color}-${view}.png`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, blob, { cacheControl: "3600", upsert: false, contentType: "image/png" });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  };

  const generateAssets = useCallback(async () => {
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

    const previewImg = document.querySelector('.preview-blank-image') as HTMLImageElement | null;
    const previewWidthValue = previewWidth || previewImg?.clientWidth || previewImg?.naturalWidth;
    if (!previewWidthValue) throw new Error("Preview image not found");

    const assets: Record<string, { url: string; colorName?: string; colorHex?: string; view?: string }[]> = {};

    for (const type of Array.from(selectedTypes)) {
      const config = PRODUCT_TYPES[type as ProductTypeKey];
      const positionMap = designPositions[type as ProductTypeKey];
      const selectedColors = colorSelections[type];
      const colorsToProcess = config.colors.filter(color => selectedColors[color.filePrefix]);
      if (colorsToProcess.length === 0) continue;

      assets[type] = [];

      // Get the base mockup color for this product type
      const baseMockupColor = baseMockupColors[type as ProductTypeKey];
      const baseColorObj = config.colors.find(c => c.filePrefix === baseMockupColor);
      
      if (!baseColorObj) {
        throw new Error(`Base mockup color not found for ${type}`);
      }

      // Generate FRONT image using base mockup color - use SAME preview width for consistency
      const frontDataUrl = await compositeImage({
        mode: "front",
        productType: type as ProductTypeKey,
        previewWidth: previewWidthValue,  // Use same scale as preview for consistent positioning
        frontGroupOffset: groupOffsets[type as ProductTypeKey].front,
        backGroupOffset: groupOffsets[type as ProductTypeKey].back,
        frontBasePath: getBlankImagePath(
          type as ProductTypeKey,
          baseMockupColor,
          "front"
        ),
        frontPosition: positionMap.front,
        backPosition: positionMap.back,
      });
      const frontImageUrl = await uploadCompositedImage(frontDataUrl, type, baseMockupColor, "front");

      assets[type].push({
        url: frontImageUrl,
        colorName: baseColorObj.name,
        colorHex: baseColorObj.hex,
        view: "front",
      });

      // Generate BACK image using base mockup color - use SAME preview width for consistency
      const backDataUrl = await compositeImage({
        mode: "back",
        productType: type as ProductTypeKey,
        previewWidth: previewWidthValue,  // Use same scale as preview for consistent positioning
        frontGroupOffset: groupOffsets[type as ProductTypeKey].front,
        backGroupOffset: groupOffsets[type as ProductTypeKey].back,
        frontBasePath: getBlankImagePath(
          type as ProductTypeKey,
          baseMockupColor,
          "front"
        ),
        backBasePath: getBlankImagePath(type as ProductTypeKey, baseMockupColor, "back"),
        frontPosition: positionMap.front,
        backPosition: positionMap.back,
      });
      const backImageUrl = await uploadCompositedImage(backDataUrl, type, baseMockupColor, "back");

      assets[type].push({
        url: backImageUrl,
        colorName: baseColorObj.name,
        colorHex: baseColorObj.hex,
        view: "back",
      });

      // Generate COMBINED views for ALL selected colors
      for (let i = 0; i < colorsToProcess.length; i++) {
        const color = colorsToProcess[i];
        
        // Generate COMBINED views for ALL selected colors - use SAME preview width for consistency
        const combinedDataUrl = await compositeImage({
          mode: "combined",
          productType: type as ProductTypeKey,
          previewWidth: previewWidthValue,  // Use same scale as preview for consistent positioning
          frontGroupOffset: groupOffsets[type as ProductTypeKey].front,
          backGroupOffset: groupOffsets[type as ProductTypeKey].back,
          frontBasePath: getBlankImagePath(
            type as ProductTypeKey,
            color.filePrefix,
            "front"
          ),
          backBasePath: getBlankImagePath(type as ProductTypeKey, color.filePrefix, "back"),
          frontPosition: positionMap.front,
          backPosition: positionMap.back,
        });
        const combinedImageUrl = await uploadCompositedImage(combinedDataUrl, type, color.filePrefix, "combined");

        assets[type].push({
          url: combinedImageUrl,
          colorName: color.name,
          colorHex: color.hex,
          view: "combined",
        });
      }
    }

    return assets;
  }, [
    activeLayer,
    activePreviewMode,
    backDesignFile,
    backDesignImage,
    colorSelections,
    designFile,
    designImage,
    designName,
    designPositions,
    groupOffsets,
    previewWidth,
    selectedTypes,
    supabase,
    baseMockupColors,
  ]);

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
      const previewImg = document.querySelector('.preview-blank-image') as HTMLImageElement | null;
      const previewWidthValue = previewWidth || previewImg?.clientWidth || previewImg?.naturalWidth;
      if (!previewWidthValue) throw new Error("Preview image not found");

      for (const type of selectedTypeList) {
        const config = PRODUCT_TYPES[type as ProductTypeKey];
        const modeForProduct: PreviewMode = isMultiViewProduct(type as ProductTypeKey) ? activePreviewMode : "front";
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
          const modeForType: PreviewMode = isMultiViewProduct(type as ProductTypeKey) ? activePreviewMode : "front";
          const compositedDataUrl = await compositeImage({
            mode: modeForType,
            productType: type as ProductTypeKey,
            previewWidth: previewWidthValue,
            frontGroupOffset: groupOffsets[type as ProductTypeKey].front,
            backGroupOffset: groupOffsets[type as ProductTypeKey].back,
            frontBasePath: getBlankImagePath(
              type as ProductTypeKey,
              color.filePrefix,
              "front"
            ),
            backBasePath:
              modeForType === "back"
                ? getBlankImagePath(type as ProductTypeKey, color.filePrefix, "back")
                : modeForType === "combined"
                ? getBlankImagePath(type as ProductTypeKey, color.filePrefix, "back")
                : undefined,
            frontPosition: positionMap.front,
            backPosition: positionMap.back,
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
      // Keep the asset generator in sync with the latest design + selections
      setAssetGenerator(() => generateAssets);
    }
  }, [generateAssets, setAssetGenerator]);

  const effectivePreviewMode: PreviewMode = isMultiViewProduct(currentEditingType) ? activePreviewMode : "front";
  const currentConfig = PRODUCT_TYPES[currentEditingType];
  const currentPreviewColor = currentConfig.colors[previewColorIndex];
  const currentPositionKey = getPositionKeyForMode(effectivePreviewMode, activeLayer);
  const currentPosition = designPositions[currentEditingType][currentPositionKey];
  const positionMap = designPositions[currentEditingType];
  const layerLabel =
    effectivePreviewMode === "combined"
      ? `${activeLayer === "front" ? "Front" : "Back"} layer`
      : effectivePreviewMode === "back"
      ? "Back layer"
      : "Front layer";
  const backDesignUsed = getDesignForLayer("back");
  const currentGroupOffsets = groupOffsets[currentEditingType];
  
  useEffect(() => {
    if (effectivePreviewMode !== "combined") {
      setCombinedPreviewUrl(null);
      return;
    }
    if (!designImage || !previewWidth) return;

    let cancelled = false;
    const build = async () => {
      try {
        const url = await compositeImage({
          mode: "combined",
          productType: currentEditingType,
          previewWidth,
          frontBasePath: getBlankImagePath(currentEditingType, currentPreviewColor.filePrefix, "front"),
          backBasePath: getBlankImagePath(currentEditingType, currentPreviewColor.filePrefix, "back"),
          frontPosition: positionMap.front,
          backPosition: positionMap.back,
          frontGroupOffset: groupOffsets[currentEditingType].front,
          backGroupOffset: groupOffsets[currentEditingType].back,
        });
        if (!cancelled) setCombinedPreviewUrl(url);
      } catch (err) {
        console.error("Failed to build combined preview", err);
        if (!cancelled) setCombinedPreviewUrl(null);
      }
    };

    build();
    return () => {
      cancelled = true;
    };
  }, [
    effectivePreviewMode,
    designImage,
    backDesignImage,
    previewWidth,
    currentEditingType,
    currentPreviewColor.filePrefix,
    positionMap,
    groupOffsets,
  ]);

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
                    if (!isMultiViewProduct(type as ProductTypeKey) && effectivePreviewMode !== "front") {
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
                    const disabled = !isMultiViewProduct(currentEditingType) && mode !== "front";
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
                    <img
                      src={getBlankImagePath(currentEditingType, currentPreviewColor.filePrefix, "front")}
                      alt="Preview size reference"
                      className="absolute opacity-0 pointer-events-none preview-blank-image"
                      ref={previewImageRef}
                      onLoad={updatePreviewWidth}
                      aria-hidden
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                    <div className="w-full">
                      {combinedPreviewUrl ? (
                        <img
                          src={combinedPreviewUrl}
                          alt="Combined preview"
                          className="block w-full h-auto"
                          onLoad={updatePreviewWidth}
                        />
                      ) : (
                        <div className="aspect-[3/4] w-full flex items-center justify-center text-sm text-brand-accent border border-dashed border-brand-accent/60 bg-[rgba(36,33,27,0.35)]">
                          Combined preview will appear once assets load.
                        </div>
                      )}
                    </div>
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
                      ref={previewImageRef}
                      onLoad={updatePreviewWidth}
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
                    {isHoodieType(currentEditingType) && effectivePreviewMode !== "back" && (
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
                  {isHoodieType(currentEditingType) && effectivePreviewMode === "front" && " (Hoodie strings overlay shown on top)"}
                  {isHoodieType(currentEditingType) && effectivePreviewMode === "combined" &&
                    " Hoodie combined order: Back base → Back design → Front base → Front design → Strings (top)."}
                  {currentEditingType === "crewneck" && effectivePreviewMode === "combined" &&
                    " Crewneck combined order: Back base → Back design → Front base → Front design."}
                  {currentEditingType === "tee" && effectivePreviewMode === "combined" &&
                    " Combined order: Back base → Back design → Front base → Front design."}
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
                {effectivePreviewMode !== "combined" && (
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
                      <input
                        type="number"
                        min={0}
                        max={400}
                        value={currentPosition.x}
                        onChange={(e) => updatePosition("x", parseInt(e.target.value || "0"))}
                        className="input mt-2 w-28"
                      />
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
                      <input
                        type="number"
                        min={0}
                        max={600}
                        value={currentPosition.y}
                        onChange={(e) => updatePosition("y", parseInt(e.target.value || "0"))}
                        className="input mt-2 w-28"
                      />
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
                      <input
                        type="number"
                        min={0.25}
                        max={2.5}
                        step={0.05}
                        value={currentPosition.scale}
                        onChange={(e) => updatePosition("scale", parseFloat(e.target.value || "0.25"))}
                        className="input mt-2 w-28"
                      />
                    </div>
                  </div>
                )}
                {effectivePreviewMode === "combined" && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="label text-brand-paper">Front group X</label>
                      <input
                        type="range"
                        min="-800"
                        max="800"
                        value={currentGroupOffsets.front.x}
                        onChange={(e) => updateGroupOffset(currentEditingType, "front", "x", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <input
                        type="number"
                        min={-800}
                        max={800}
                        value={currentGroupOffsets.front.x}
                        onChange={(e) => updateGroupOffset(currentEditingType, "front", "x", parseInt(e.target.value || "0"))}
                        className="input mt-2 w-28"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label text-brand-paper">Front group Y</label>
                      <input
                        type="range"
                        min="-800"
                        max="800"
                        value={currentGroupOffsets.front.y}
                        onChange={(e) => updateGroupOffset(currentEditingType, "front", "y", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <input
                        type="number"
                        min={-800}
                        max={800}
                        value={currentGroupOffsets.front.y}
                        onChange={(e) => updateGroupOffset(currentEditingType, "front", "y", parseInt(e.target.value || "0"))}
                        className="input mt-2 w-28"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label text-brand-paper">Back group X</label>
                      <input
                        type="range"
                        min="-800"
                        max="800"
                        value={currentGroupOffsets.back.x}
                        onChange={(e) => updateGroupOffset(currentEditingType, "back", "x", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <input
                        type="number"
                        min={-800}
                        max={800}
                        value={currentGroupOffsets.back.x}
                        onChange={(e) => updateGroupOffset(currentEditingType, "back", "x", parseInt(e.target.value || "0"))}
                        className="input mt-2 w-28"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label text-brand-paper">Back group Y</label>
                      <input
                        type="range"
                        min="-800"
                        max="800"
                        value={currentGroupOffsets.back.y}
                        onChange={(e) => updateGroupOffset(currentEditingType, "back", "y", parseInt(e.target.value))}
                        className="w-full"
                      />
                      <input
                        type="number"
                        min={-800}
                        max={800}
                        value={currentGroupOffsets.back.y}
                        onChange={(e) => updateGroupOffset(currentEditingType, "back", "y", parseInt(e.target.value || "0"))}
                        className="input mt-2 w-28"
                      />
                    </div>
                  </div>
                )}
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
            
            {/* Base Mockup Color Selection */}
            <div className="mb-6 p-4 bg-[rgba(36,33,27,0.7)] border-2 border-brand-blood rounded">
              <label className="label text-brand-paper mb-2">
                <span className="flex items-center gap-2">
                  📸 Base Mockup Color
                  <span className="text-xs font-normal text-brand-accent">(Used for front & back images)</span>
                </span>
              </label>
              <p className="text-xs text-brand-accent mb-3">
                Select which color will be used to generate the single front and back product images. All other colors will only get combined views.
              </p>
              <select
                value={baseMockupColors[type as ProductTypeKey]}
                onChange={(e) => setBaseMockupColors(prev => ({
                  ...prev,
                  [type]: e.target.value
                }))}
                className="select w-full max-w-xs"
              >
                {config.colors.map(color => (
                  <option key={color.filePrefix} value={color.filePrefix}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-brand-accent mb-4">
              Check the colors that will be available for purchase (combined view generated for each)
              {isHoodieType(type as ProductTypeKey) && " • Hoodie strings will be overlaid on all colors"}
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
