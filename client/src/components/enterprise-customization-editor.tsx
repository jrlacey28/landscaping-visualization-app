import { useRef, useState } from "react";
import { Bath, Edit3, Home, Layers, Palette, Plus, Settings2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToPublic } from "@/lib/api";
import {
  DEFAULT_EMBED_SERVICE_ACCESS,
  EMBED_SERVICES,
  type EmbedServiceAccess,
  normalizeEmbedServiceAccess,
} from "@/lib/embed-services";
import {
  DEFAULT_EMBED_DEFAULT_OPTION_VISIBILITY,
  EMBED_DEFAULT_OPTION_GROUPS,
  type EmbedDefaultOptionVisibility,
  normalizeEmbedDefaultOptionVisibility,
} from "@/lib/embed-default-visibility";
import { useToast } from "@/hooks/use-toast";

type ReferenceImage = string;

type CustomColor = {
  label: string;
  value?: string;
  hex: string;
  groupLabel?: string;
  prompt?: string;
  referenceImageUrls?: ReferenceImage[];
};

type CustomOption = {
  label: string;
  value?: string;
  prompt?: string;
  swatch?: string;
  groupLabel?: string;
  referenceImageUrls?: ReferenceImage[];
};

type EnterpriseCustomizations = {
  enabledServices?: Partial<EmbedServiceAccess>;
  defaultOptionVisibility?: Partial<EmbedDefaultOptionVisibility>;
  roofColors?: CustomColor[];
  sidingColors?: CustomColor[];
  exteriorOptions?: {
    roof?: CustomOption[];
    siding?: CustomOption[];
    windows?: CustomOption[];
  };
  landscapeOptions?: {
    curbing?: CustomOption[];
    landscape?: CustomOption[];
    patios?: CustomOption[];
  };
  poolOptions?: {
    poolType?: CustomOption[];
    poolSize?: CustomOption[];
    decking?: CustomOption[];
    landscaping?: CustomOption[];
    features?: CustomOption[];
    hotTub?: CustomOption[];
    sauna?: CustomOption[];
  };
  interiorOptions?: {
    bathroom?: CustomOption[];
    kitchen?: CustomOption[];
    painting?: CustomOption[];
    living_room?: CustomOption[];
  };
};

type Props = {
  value: EnterpriseCustomizations | null | undefined;
  onChange: (value: EnterpriseCustomizations) => void;
};

type CategoryKey =
  | "services"
  | "defaultOptions"
  | "roofColors"
  | "sidingColors"
  | "roofDesigns"
  | "sidingDesigns"
  | "windowDesigns"
  | "landscapeCurbingOptions"
  | "landscapeMaterialOptions"
  | "landscapePatioOptions"
  | "poolTypeOptions"
  | "poolSizeOptions"
  | "poolDeckingOptions"
  | "poolLandscapingOptions"
  | "poolFeatureOptions"
  | "poolHotTubOptions"
  | "poolSaunaOptions"
  | "paintingOptions"
  | "kitchenOptions"
  | "bathroomOptions"
  | "livingRoomOptions";

type CategoryConfig = {
  key: CategoryKey;
  label: string;
  description: string;
  singular: string;
  count: number;
  kind: "services" | "defaults" | "color" | "option";
  includeGroup?: boolean;
  includeSwatch?: boolean;
  icon: typeof Palette;
};

const emptyCustomizations: EnterpriseCustomizations = {
  enabledServices: DEFAULT_EMBED_SERVICE_ACCESS,
  defaultOptionVisibility: DEFAULT_EMBED_DEFAULT_OPTION_VISIBILITY,
  roofColors: [],
  sidingColors: [],
  exteriorOptions: {
    roof: [],
    siding: [],
    windows: [],
  },
  landscapeOptions: {
    curbing: [],
    landscape: [],
    patios: [],
  },
  poolOptions: {
    poolType: [],
    poolSize: [],
    decking: [],
    landscaping: [],
    features: [],
    hotTub: [],
    sauna: [],
  },
  interiorOptions: {
    bathroom: [],
    kitchen: [],
    painting: [],
    living_room: [],
  },
};

export function createEmptyEnterpriseCustomizations(): EnterpriseCustomizations {
  return cloneCustomizations(emptyCustomizations);
}

export function normalizeEnterpriseCustomizations(value: unknown): EnterpriseCustomizations {
  if (!value || typeof value !== "object") {
    return createEmptyEnterpriseCustomizations();
  }

  const source = value as EnterpriseCustomizations;

  return {
    enabledServices: normalizeEmbedServiceAccess(source.enabledServices),
    defaultOptionVisibility: normalizeEmbedDefaultOptionVisibility(source.defaultOptionVisibility),
    roofColors: Array.isArray(source.roofColors) ? source.roofColors : [],
    sidingColors: Array.isArray(source.sidingColors) ? source.sidingColors : [],
    exteriorOptions: {
      roof: Array.isArray(source.exteriorOptions?.roof) ? source.exteriorOptions!.roof : [],
      siding: Array.isArray(source.exteriorOptions?.siding) ? source.exteriorOptions!.siding : [],
      windows: Array.isArray(source.exteriorOptions?.windows) ? source.exteriorOptions!.windows : [],
    },
    landscapeOptions: {
      curbing: Array.isArray(source.landscapeOptions?.curbing) ? source.landscapeOptions!.curbing : [],
      landscape: Array.isArray(source.landscapeOptions?.landscape) ? source.landscapeOptions!.landscape : [],
      patios: Array.isArray(source.landscapeOptions?.patios) ? source.landscapeOptions!.patios : [],
    },
    poolOptions: {
      poolType: Array.isArray(source.poolOptions?.poolType) ? source.poolOptions!.poolType : [],
      poolSize: Array.isArray(source.poolOptions?.poolSize) ? source.poolOptions!.poolSize : [],
      decking: Array.isArray(source.poolOptions?.decking) ? source.poolOptions!.decking : [],
      landscaping: Array.isArray(source.poolOptions?.landscaping) ? source.poolOptions!.landscaping : [],
      features: Array.isArray(source.poolOptions?.features) ? source.poolOptions!.features : [],
      hotTub: Array.isArray(source.poolOptions?.hotTub) ? source.poolOptions!.hotTub : [],
      sauna: Array.isArray(source.poolOptions?.sauna) ? source.poolOptions!.sauna : [],
    },
    interiorOptions: {
      bathroom: Array.isArray(source.interiorOptions?.bathroom)
        ? source.interiorOptions!.bathroom
        : Array.isArray((source as any).bathroomOptions)
          ? (source as any).bathroomOptions
          : [],
      kitchen: Array.isArray(source.interiorOptions?.kitchen) ? source.interiorOptions!.kitchen : [],
      painting: Array.isArray(source.interiorOptions?.painting) ? source.interiorOptions!.painting : [],
      living_room: Array.isArray(source.interiorOptions?.living_room) ? source.interiorOptions!.living_room : [],
    },
  };
}

function cloneCustomizations(value: EnterpriseCustomizations): EnterpriseCustomizations {
  return JSON.parse(JSON.stringify(value));
}

export function cleanEnterpriseCustomizations(value: EnterpriseCustomizations): EnterpriseCustomizations {
  const cleanOption = (option: CustomOption): CustomOption | null => {
    const label = option.label?.trim();
    if (!label) return null;

    return {
      label,
      value: option.value?.trim() || undefined,
      prompt: option.prompt?.trim() || undefined,
      swatch: option.swatch?.trim() || undefined,
      groupLabel: option.groupLabel?.trim() || undefined,
      referenceImageUrls: (option.referenceImageUrls || []).map((url) => url.trim()).filter(Boolean),
    };
  };

  const cleanColor = (color: CustomColor): CustomColor | null => {
    const label = color.label?.trim();
    const hex = color.hex?.trim();
    if (!label || !/^#[0-9a-f]{6}$/i.test(hex || "")) return null;

    return {
      label,
      value: color.value?.trim() || undefined,
      hex,
      groupLabel: color.groupLabel?.trim() || undefined,
      prompt: color.prompt?.trim() || undefined,
      referenceImageUrls: (color.referenceImageUrls || []).map((url) => url.trim()).filter(Boolean),
    };
  };

  return {
    enabledServices: normalizeEmbedServiceAccess(value.enabledServices),
    defaultOptionVisibility: normalizeEmbedDefaultOptionVisibility(value.defaultOptionVisibility),
    roofColors: (value.roofColors || []).map(cleanColor).filter(Boolean) as CustomColor[],
    sidingColors: (value.sidingColors || []).map(cleanColor).filter(Boolean) as CustomColor[],
    exteriorOptions: {
      roof: (value.exteriorOptions?.roof || []).map(cleanOption).filter(Boolean) as CustomOption[],
      siding: (value.exteriorOptions?.siding || []).map(cleanOption).filter(Boolean) as CustomOption[],
      windows: (value.exteriorOptions?.windows || []).map(cleanOption).filter(Boolean) as CustomOption[],
    },
    landscapeOptions: {
      curbing: (value.landscapeOptions?.curbing || []).map(cleanOption).filter(Boolean) as CustomOption[],
      landscape: (value.landscapeOptions?.landscape || []).map(cleanOption).filter(Boolean) as CustomOption[],
      patios: (value.landscapeOptions?.patios || []).map(cleanOption).filter(Boolean) as CustomOption[],
    },
    poolOptions: {
      poolType: (value.poolOptions?.poolType || []).map(cleanOption).filter(Boolean) as CustomOption[],
      poolSize: (value.poolOptions?.poolSize || []).map(cleanOption).filter(Boolean) as CustomOption[],
      decking: (value.poolOptions?.decking || []).map(cleanOption).filter(Boolean) as CustomOption[],
      landscaping: (value.poolOptions?.landscaping || []).map(cleanOption).filter(Boolean) as CustomOption[],
      features: (value.poolOptions?.features || []).map(cleanOption).filter(Boolean) as CustomOption[],
      hotTub: (value.poolOptions?.hotTub || []).map(cleanOption).filter(Boolean) as CustomOption[],
      sauna: (value.poolOptions?.sauna || []).map(cleanOption).filter(Boolean) as CustomOption[],
    },
    interiorOptions: {
      bathroom: (value.interiorOptions?.bathroom || []).map(cleanOption).filter(Boolean) as CustomOption[],
      kitchen: (value.interiorOptions?.kitchen || []).map(cleanOption).filter(Boolean) as CustomOption[],
      painting: (value.interiorOptions?.painting || []).map(cleanOption).filter(Boolean) as CustomOption[],
      living_room: (value.interiorOptions?.living_room || []).map(cleanOption).filter(Boolean) as CustomOption[],
    },
  };
}

function ReferenceImagesEditor({
  urls,
  onChange,
}: {
  urls: ReferenceImage[] | undefined;
  onChange: (urls: ReferenceImage[]) => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const normalizedUrls = urls || [];

  const updateUrl = (index: number, value: string) => {
    const next = [...normalizedUrls];
    next[index] = value;
    onChange(next);
  };

  const removeUrl = (index: number) => {
    onChange(normalizedUrls.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadImageToPublic(file);
      if (!result?.imageUrl) {
        throw new Error("Upload did not return an image URL.");
      }
      onChange([...normalizedUrls, result.imageUrl]);
      toast({
        title: "Reference Uploaded",
        description: "The reference image has been added to this option.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload the reference image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Reference Images</Label>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFileUpload(event.target.files?.[0])}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-3 w-3" />
            {isUploading ? "Uploading" : "Upload"}
          </Button>
        </div>
      </div>
      {normalizedUrls.map((url, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={url}
            onChange={(event) => updateUrl(index, event.target.value)}
            placeholder="https://..."
          />
          <Button type="button" size="icon" variant="outline" onClick={() => removeUrl(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange([...normalizedUrls, ""])}
      >
        <Plus className="mr-2 h-3 w-3" />
        Add URL
      </Button>
    </div>
  );
}

function ColorItemEditor({
  color,
  index,
  onChange,
  onRemove,
  includeGroup = false,
}: {
  color: CustomColor;
  index: number;
  onChange: (patch: Partial<CustomColor>) => void;
  onRemove: () => void;
  includeGroup?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-md border bg-background p-3">
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_1fr_128px_auto] md:items-end">
        {includeGroup && (
          <div>
            <Label className="text-xs">Category</Label>
            <Input
              value={color.groupLabel || ""}
              onChange={(event) => onChange({ groupLabel: event.target.value })}
              placeholder="Manufacturer / collection"
            />
          </div>
        )}
        <div>
          <Label className="text-xs">Name</Label>
          <Input
            value={color.label || ""}
            onChange={(event) => onChange({ label: event.target.value })}
            placeholder={index === 0 ? "Genesis Driftwood" : "Color name"}
          />
        </div>
        <div>
          <Label className="text-xs">Swatch</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={color.hex || "#ffffff"}
              onChange={(event) => onChange({ hex: event.target.value })}
            />
          </div>
        </div>
        <Button type="button" size="icon" variant="outline" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <Label className="text-xs">AI Instructions</Label>
        <Textarea
          value={color.prompt || ""}
          onChange={(event) => onChange({ prompt: event.target.value })}
          rows={2}
          placeholder="Match this exact manufacturer color and keep the material realistic."
        />
      </div>
      <ReferenceImagesEditor
        urls={color.referenceImageUrls}
        onChange={(referenceImageUrls) => onChange({ referenceImageUrls })}
      />
    </div>
  );
}

function OptionItemEditor({
  option,
  index,
  onChange,
  onRemove,
  includeGroup = false,
  includeSwatch = false,
}: {
  option: CustomOption;
  index: number;
  onChange: (patch: Partial<CustomOption>) => void;
  onRemove: () => void;
  includeGroup?: boolean;
  includeSwatch?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-md border bg-background p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        {includeGroup && (
          <div>
            <Label className="text-xs">Category</Label>
            <Input
              value={option.groupLabel || ""}
              onChange={(event) => onChange({ groupLabel: event.target.value })}
              placeholder="Wall Tile"
            />
          </div>
        )}
        <div>
          <Label className="text-xs">Choice Name</Label>
          <Input
            value={option.label || ""}
            onChange={(event) => onChange({ label: event.target.value })}
            placeholder={index === 0 ? "Large Format Calacatta Tile" : "Choice name"}
          />
        </div>
        {includeSwatch && (
          <div>
            <Label className="text-xs">Swatch</Label>
            <Input
              value={option.swatch || ""}
              onChange={(event) => onChange({ swatch: event.target.value })}
              placeholder="#d8d2c8"
            />
          </div>
        )}
        <Button type="button" size="icon" variant="outline" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <Label className="text-xs">AI Instructions</Label>
        <Textarea
          value={option.prompt || ""}
          onChange={(event) => onChange({ prompt: event.target.value })}
          rows={3}
          placeholder="Use this exact material/design direction while preserving the original layout."
        />
      </div>
      <ReferenceImagesEditor
        urls={option.referenceImageUrls}
        onChange={(referenceImageUrls) => onChange({ referenceImageUrls })}
      />
    </div>
  );
}

export default function EnterpriseCustomizationEditor({ value, onChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("services");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const customizations = normalizeEnterpriseCustomizations(value);
  const enabledServices = normalizeEmbedServiceAccess(customizations.enabledServices);
  const defaultOptionVisibility = normalizeEmbedDefaultOptionVisibility(customizations.defaultOptionVisibility);

  const update = (patch: EnterpriseCustomizations) => {
    onChange(cloneCustomizations(patch));
  };

  const getColorItems = (categoryKey: CategoryKey) => {
    if (categoryKey === "roofColors") return customizations.roofColors || [];
    if (categoryKey === "sidingColors") return customizations.sidingColors || [];
    return [];
  };

  const getOptionItems = (categoryKey: CategoryKey) => {
    if (categoryKey === "roofDesigns") return customizations.exteriorOptions?.roof || [];
    if (categoryKey === "sidingDesigns") return customizations.exteriorOptions?.siding || [];
    if (categoryKey === "windowDesigns") return customizations.exteriorOptions?.windows || [];
    if (categoryKey === "landscapeCurbingOptions") return customizations.landscapeOptions?.curbing || [];
    if (categoryKey === "landscapeMaterialOptions") return customizations.landscapeOptions?.landscape || [];
    if (categoryKey === "landscapePatioOptions") return customizations.landscapeOptions?.patios || [];
    if (categoryKey === "poolTypeOptions") return customizations.poolOptions?.poolType || [];
    if (categoryKey === "poolSizeOptions") return customizations.poolOptions?.poolSize || [];
    if (categoryKey === "poolDeckingOptions") return customizations.poolOptions?.decking || [];
    if (categoryKey === "poolLandscapingOptions") return customizations.poolOptions?.landscaping || [];
    if (categoryKey === "poolFeatureOptions") return customizations.poolOptions?.features || [];
    if (categoryKey === "poolHotTubOptions") return customizations.poolOptions?.hotTub || [];
    if (categoryKey === "poolSaunaOptions") return customizations.poolOptions?.sauna || [];
    if (categoryKey === "paintingOptions") return customizations.interiorOptions?.painting || [];
    if (categoryKey === "kitchenOptions") return customizations.interiorOptions?.kitchen || [];
    if (categoryKey === "bathroomOptions") return customizations.interiorOptions?.bathroom || [];
    if (categoryKey === "livingRoomOptions") return customizations.interiorOptions?.living_room || [];
    return [];
  };

  const setColorItems = (categoryKey: CategoryKey, colors: CustomColor[]) => {
    if (categoryKey === "roofColors") {
      update({ ...customizations, roofColors: colors });
    }

    if (categoryKey === "sidingColors") {
      update({ ...customizations, sidingColors: colors });
    }
  };

  const setOptionItems = (categoryKey: CategoryKey, options: CustomOption[]) => {
    if (categoryKey === "roofDesigns") {
      update({
        ...customizations,
        exteriorOptions: { ...customizations.exteriorOptions, roof: options },
      });
    }

    if (categoryKey === "sidingDesigns") {
      update({
        ...customizations,
        exteriorOptions: { ...customizations.exteriorOptions, siding: options },
      });
    }

    if (categoryKey === "windowDesigns") {
      update({
        ...customizations,
        exteriorOptions: { ...customizations.exteriorOptions, windows: options },
      });
    }

    if (categoryKey === "landscapeCurbingOptions") {
      update({
        ...customizations,
        landscapeOptions: { ...customizations.landscapeOptions, curbing: options },
      });
    }

    if (categoryKey === "landscapeMaterialOptions") {
      update({
        ...customizations,
        landscapeOptions: { ...customizations.landscapeOptions, landscape: options },
      });
    }

    if (categoryKey === "landscapePatioOptions") {
      update({
        ...customizations,
        landscapeOptions: { ...customizations.landscapeOptions, patios: options },
      });
    }

    if (categoryKey === "poolTypeOptions") {
      update({
        ...customizations,
        poolOptions: { ...customizations.poolOptions, poolType: options },
      });
    }

    if (categoryKey === "poolSizeOptions") {
      update({
        ...customizations,
        poolOptions: { ...customizations.poolOptions, poolSize: options },
      });
    }

    if (categoryKey === "poolDeckingOptions") {
      update({
        ...customizations,
        poolOptions: { ...customizations.poolOptions, decking: options },
      });
    }

    if (categoryKey === "poolLandscapingOptions") {
      update({
        ...customizations,
        poolOptions: { ...customizations.poolOptions, landscaping: options },
      });
    }

    if (categoryKey === "poolFeatureOptions") {
      update({
        ...customizations,
        poolOptions: { ...customizations.poolOptions, features: options },
      });
    }

    if (categoryKey === "poolHotTubOptions") {
      update({
        ...customizations,
        poolOptions: { ...customizations.poolOptions, hotTub: options },
      });
    }

    if (categoryKey === "poolSaunaOptions") {
      update({
        ...customizations,
        poolOptions: { ...customizations.poolOptions, sauna: options },
      });
    }

    if (categoryKey === "bathroomOptions") {
      update({
        ...customizations,
        interiorOptions: { ...customizations.interiorOptions, bathroom: options },
      });
    }

    if (categoryKey === "paintingOptions") {
      update({
        ...customizations,
        interiorOptions: { ...customizations.interiorOptions, painting: options },
      });
    }

    if (categoryKey === "kitchenOptions") {
      update({
        ...customizations,
        interiorOptions: { ...customizations.interiorOptions, kitchen: options },
      });
    }

    if (categoryKey === "livingRoomOptions") {
      update({
        ...customizations,
        interiorOptions: { ...customizations.interiorOptions, living_room: options },
      });
    }
  };

  const categories: CategoryConfig[] = [
    {
      key: "services",
      label: "Embed Services",
      description: "Choose which embed pages this client can use.",
      singular: "service",
      count: Object.values(enabledServices).filter(Boolean).length,
      kind: "services",
      icon: Settings2,
    },
    {
      key: "defaultOptions",
      label: "Original Options",
      description: "Show or hide DreamBuilder's built-in categories and colors for this client's embeds.",
      singular: "original option",
      count: Object.values(defaultOptionVisibility).filter(Boolean).length,
      kind: "defaults",
      icon: Settings2,
    },
    {
      key: "roofColors",
      label: "Roof Colors",
      description: "Manufacturer roof colors that only this client can select.",
      singular: "roof color",
      count: (customizations.roofColors || []).filter((color) => color.label).length,
      kind: "color",
      icon: Palette,
    },
    {
      key: "sidingColors",
      label: "Siding Colors",
      description: "Private siding colors and manufacturer-specific color references.",
      singular: "siding color",
      count: (customizations.sidingColors || []).filter((color) => color.label).length,
      kind: "color",
      icon: Palette,
    },
    {
      key: "roofDesigns",
      label: "Roof Designs",
      description: "Private roof material or design packages for the exterior visualizer.",
      singular: "roof design",
      count: (customizations.exteriorOptions?.roof || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Home,
    },
    {
      key: "sidingDesigns",
      label: "Siding Designs",
      description: "Private siding design packages beyond the standard material list.",
      singular: "siding design",
      count: (customizations.exteriorOptions?.siding || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Layers,
    },
    {
      key: "windowDesigns",
      label: "Window Designs",
      description: "Private window frame, grid, trim, or package options.",
      singular: "window design",
      count: (customizations.exteriorOptions?.windows || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Home,
    },
    {
      key: "landscapeCurbingOptions",
      label: "Landscape Curbing",
      description: "Private curbing choices for the landscape visualizer.",
      singular: "curbing option",
      count: (customizations.landscapeOptions?.curbing || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Layers,
    },
    {
      key: "landscapeMaterialOptions",
      label: "Landscape Materials",
      description: "Private mulch, rock, grass, and landscape material choices.",
      singular: "landscape option",
      count: (customizations.landscapeOptions?.landscape || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Palette,
    },
    {
      key: "landscapePatioOptions",
      label: "Patio Styles",
      description: "Private patio material and finish choices.",
      singular: "patio style",
      count: (customizations.landscapeOptions?.patios || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Home,
    },
    {
      key: "poolTypeOptions",
      label: "Pool Types",
      description: "Private pool shape and install-type choices.",
      singular: "pool type",
      count: (customizations.poolOptions?.poolType || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Layers,
    },
    {
      key: "poolSizeOptions",
      label: "Pool Sizes",
      description: "Private pool size/package choices.",
      singular: "pool size",
      count: (customizations.poolOptions?.poolSize || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Layers,
    },
    {
      key: "poolDeckingOptions",
      label: "Pool Decking",
      description: "Private pool deck materials and finish choices.",
      singular: "decking option",
      count: (customizations.poolOptions?.decking || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Palette,
    },
    {
      key: "poolLandscapingOptions",
      label: "Pool Landscaping",
      description: "Private pool landscaping packages and design directions.",
      singular: "pool landscaping option",
      count: (customizations.poolOptions?.landscaping || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Home,
    },
    {
      key: "poolFeatureOptions",
      label: "Pool Features",
      description: "Private waterfalls, lighting, spas, and feature choices.",
      singular: "pool feature",
      count: (customizations.poolOptions?.features || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Settings2,
    },
    {
      key: "poolHotTubOptions",
      label: "Hot Tubs",
      description: "Private hot tub and swim spa choices.",
      singular: "hot tub option",
      count: (customizations.poolOptions?.hotTub || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Settings2,
    },
    {
      key: "poolSaunaOptions",
      label: "Saunas",
      description: "Private sauna choices for pool/outdoor embeds.",
      singular: "sauna option",
      count: (customizations.poolOptions?.sauna || []).filter((option) => option.label).length,
      kind: "option",
      includeSwatch: true,
      icon: Settings2,
    },
    {
      key: "bathroomOptions",
      label: "Bathroom Options",
      description: "Bath tile, vanity, fixture, and remodel options with reference images.",
      singular: "bathroom option",
      count: (customizations.interiorOptions?.bathroom || []).filter((option) => option.label).length,
      kind: "option",
      includeGroup: true,
      includeSwatch: true,
      icon: Bath,
    },
    {
      key: "paintingOptions",
      label: "Painting Options",
      description: "Private paint colors, finishes, and paint reference options.",
      singular: "painting option",
      count: (customizations.interiorOptions?.painting || []).filter((option) => option.label).length,
      kind: "option",
      includeGroup: true,
      includeSwatch: true,
      icon: Palette,
    },
    {
      key: "kitchenOptions",
      label: "Kitchen Options",
      description: "Private cabinet, counter, backsplash, fixture, and kitchen package options.",
      singular: "kitchen option",
      count: (customizations.interiorOptions?.kitchen || []).filter((option) => option.label).length,
      kind: "option",
      includeGroup: true,
      includeSwatch: true,
      icon: Home,
    },
    {
      key: "livingRoomOptions",
      label: "Living Room Options",
      description: "Private furniture, decor, lighting, built-in, and finish options.",
      singular: "living room option",
      count: (customizations.interiorOptions?.living_room || []).filter((option) => option.label).length,
      kind: "option",
      includeGroup: true,
      includeSwatch: true,
      icon: Home,
    },
  ];

  const selectedCategory = categories.find((category) => category.key === activeCategory) || categories[0];
  const selectedColors = getColorItems(selectedCategory.key);
  const selectedOptions = getOptionItems(selectedCategory.key);
  const selectedItemsCount = selectedCategory.kind === "color" ? selectedColors.length : selectedOptions.length;
  const selectedSupportsGroups = selectedCategory.kind === "color" || selectedCategory.kind === "option";
  const selectedGroups = Array.from(
    new Set(
      (selectedCategory.kind === "color" ? selectedColors : selectedOptions)
        .map((option) => option.groupLabel?.trim())
        .filter(Boolean) as string[],
    ),
  );

  const addItem = () => {
    setEditingIndex(null);

    if (selectedCategory.kind === "color") {
      setColorItems(selectedCategory.key, [
        ...selectedColors,
        { label: "", hex: "#ffffff", groupLabel: selectedGroups[0] || "", referenceImageUrls: [] },
      ]);
      setEditingIndex(selectedColors.length);
      return;
    }

    if (selectedCategory.kind !== "option") {
      return;
    }

    setOptionItems(selectedCategory.key, [
      ...selectedOptions,
      {
        label: "",
        prompt: "",
        groupLabel: selectedSupportsGroups ? selectedGroups[0] || "" : undefined,
        referenceImageUrls: [],
      },
    ]);
    setEditingIndex(selectedOptions.length);
  };

  const updateColorAt = (index: number, patch: Partial<CustomColor>) => {
    setColorItems(
      selectedCategory.key,
      selectedColors.map((color, currentIndex) =>
        currentIndex === index ? { ...color, ...patch } : color,
      ),
    );
  };

  const updateOptionAt = (index: number, patch: Partial<CustomOption>) => {
    setOptionItems(
      selectedCategory.key,
      selectedOptions.map((option, currentIndex) =>
        currentIndex === index ? { ...option, ...patch } : option,
      ),
    );
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b p-4">
        <h3 className="font-semibold">Enterprise Choices Manager</h3>
        <p className="text-sm text-muted-foreground">
          Pick a category, then edit the private options that only this client can use.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b bg-muted/20 p-3 lg:border-b-0 lg:border-r">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Categories
          </div>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const selected = category.key === selectedCategory.key;

              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.key);
                    setEditingIndex(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selected ? "bg-background shadow-sm ring-1 ring-border" : "hover:bg-background/70"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{category.label}</span>
                  </span>
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h4 className="text-base font-semibold">{selectedCategory.label}</h4>
              <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
              {selectedSupportsGroups && selectedGroups.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedGroups.map((group) => (
                    <span key={group} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {group}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {selectedCategory.kind !== "services" && selectedCategory.kind !== "defaults" && (
              <Button type="button" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add {selectedCategory.singular}
              </Button>
            )}
          </div>

          {selectedCategory.kind === "services" ? (
            <div className="divide-y rounded-md border">
              {EMBED_SERVICES.map((service) => (
                <div key={service.key} className="flex items-center justify-between gap-4 p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{service.label}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <Switch
                    checked={enabledServices[service.key]}
                    onCheckedChange={(checked) =>
                      update({
                        ...customizations,
                        enabledServices: {
                          ...enabledServices,
                          [service.key]: checked,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          ) : selectedCategory.kind === "defaults" ? (
            <div className="space-y-4">
              {EMBED_DEFAULT_OPTION_GROUPS.map((group) => (
                <div key={group.label} className="rounded-md border">
                  <div className="border-b bg-muted/20 px-3 py-2">
                    <p className="text-sm font-semibold">{group.label}</p>
                  </div>
                  <div className="divide-y">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-4 p-3">
                        <div className="min-w-0">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch
                          checked={defaultOptionVisibility[item.key]}
                          onCheckedChange={(checked) =>
                            update({
                              ...customizations,
                              defaultOptionVisibility: {
                                ...defaultOptionVisibility,
                                [item.key]: checked,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedItemsCount === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="font-medium">No {selectedCategory.label.toLowerCase()} yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add one to make it available in this client's private embed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCategory.kind === "color"
                ? selectedColors.map((color, index) => (
                    <div key={index} className="rounded-md border">
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="h-5 w-5 shrink-0 rounded-full border shadow-inner"
                            style={{ background: color.hex || "#ffffff" }}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{color.label || "Untitled color"}</p>
                            <p className="text-xs text-muted-foreground">
                              {[color.groupLabel, `${color.referenceImageUrls?.length || 0} reference images`]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setColorItems(
                                selectedCategory.key,
                                selectedColors.filter((_, currentIndex) => currentIndex !== index),
                              );
                              setEditingIndex(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {editingIndex === index && (
                        <div className="border-t bg-muted/20 p-3">
                          <ColorItemEditor
                            color={color}
                            index={index}
                            includeGroup={selectedSupportsGroups}
                            onChange={(patch) => updateColorAt(index, patch)}
                            onRemove={() => {
                              setColorItems(
                                selectedCategory.key,
                                selectedColors.filter((_, currentIndex) => currentIndex !== index),
                              );
                              setEditingIndex(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                : selectedOptions.map((option, index) => (
                    <div key={index} className="rounded-md border">
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{option.label || "Untitled option"}</p>
                          <p className="text-xs text-muted-foreground">
                            {[option.groupLabel, option.swatch, `${option.referenceImageUrls?.length || 0} reference images`]
                              .filter(Boolean)
                              .join(" - ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setOptionItems(
                                selectedCategory.key,
                                selectedOptions.filter((_, currentIndex) => currentIndex !== index),
                              );
                              setEditingIndex(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {editingIndex === index && (
                        <div className="border-t bg-muted/20 p-3">
                          <OptionItemEditor
                            option={option}
                            index={index}
                            includeGroup={selectedSupportsGroups}
                            includeSwatch={selectedCategory.includeSwatch}
                            onChange={(patch) => updateOptionAt(index, patch)}
                            onRemove={() => {
                              setOptionItems(
                                selectedCategory.key,
                                selectedOptions.filter((_, currentIndex) => currentIndex !== index),
                              );
                              setEditingIndex(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
