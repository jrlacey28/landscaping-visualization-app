import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Image,
  Layout,
  Loader2,
  Monitor,
  Palette,
  Phone,
  Trash2,
  Upload,
} from "lucide-react";
import { uploadImageToPublic } from "@/lib/api";
import {
  DEFAULT_EMBED_BACKGROUND_COLOR,
  DEFAULT_EMBED_BACKGROUND_SCHEME,
  EMBED_BACKGROUND_OPTIONS,
  type EmbedBackgroundScheme,
  parseEmbedBackgroundScheme,
} from "@/lib/embed-theme";

interface EmbedCodeGeneratorProps {
  tenant: any;
  accountUserId?: number | null;
}

type ContactType = "phone" | "link";
type VisualizerType =
  | "landscape"
  | "roofing"
  | "pools"
  | "painting"
  | "kitchen"
  | "bathroom"
  | "living-room";

interface EmbedConfig {
  width: string;
  height: string;
  showHeader: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundScheme: EmbedBackgroundScheme;
  backgroundColor: string;
  logoUrl: string;
  companyName: string;
  contactPhone: string;
  contactType: ContactType;
  contactLink: string;
  visualizerType: VisualizerType;
}

const visualizerPaths: Record<VisualizerType, string> = {
  landscape: "/embed",
  roofing: "/embed-roofing",
  pools: "/embed-pools",
  painting: "/embed-painting",
  kitchen: "/embed-kitchen",
  bathroom: "/embed-bathroom",
  "living-room": "/embed-living-room",
};

const visualizerLabels: Record<VisualizerType, string> = {
  landscape: "Landscape Visualizer",
  roofing: "Roofing & Siding Visualizer",
  pools: "Pool Visualizer",
  painting: "Painting Visualizer",
  kitchen: "Kitchen Visualizer",
  bathroom: "Bathroom Visualizer",
  "living-room": "Living Room Visualizer",
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background";

function buildDefaultConfig(tenant: any): EmbedConfig {
  return {
    width: "100%",
    height: "800px",
    showHeader: true,
    primaryColor:
      tenant?.embedPrimaryColor || tenant?.primaryColor || "#2563EB",
    secondaryColor:
      tenant?.embedSecondaryColor || tenant?.secondaryColor || "#1D4ED8",
    backgroundScheme: DEFAULT_EMBED_BACKGROUND_SCHEME,
    backgroundColor: DEFAULT_EMBED_BACKGROUND_COLOR,
    logoUrl: tenant?.logoUrl || "",
    companyName: tenant?.companyName || "DreamBuilder",
    contactPhone: tenant?.contactPhone || tenant?.phone || "",
    contactType: "phone",
    contactLink: tenant?.embedCtaUrl || "",
    visualizerType: "landscape",
  };
}

export default function EmbedCodeGenerator({ tenant, accountUserId }: EmbedCodeGeneratorProps) {
  const [config, setConfig] = useState<EmbedConfig>(() =>
    buildDefaultConfig(tenant),
  );
  const [copied, setCopied] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  useEffect(() => {
    if (!tenant?.slug) return;

    const defaults = buildDefaultConfig(tenant);
    const savedConfig = localStorage.getItem(`embed-config-${tenant.slug}`);

    if (!savedConfig) {
      setConfig(defaults);
      return;
    }

    try {
      const parsed = JSON.parse(savedConfig) as Partial<EmbedConfig>;
      setConfig({
        ...defaults,
        width: parsed.width || defaults.width,
        height: parsed.height || defaults.height,
        showHeader:
          parsed.showHeader !== undefined
            ? parsed.showHeader
            : defaults.showHeader,
        primaryColor: parsed.primaryColor || defaults.primaryColor,
        secondaryColor: parsed.secondaryColor || defaults.secondaryColor,
        backgroundScheme: parseEmbedBackgroundScheme(
          parsed.backgroundScheme,
        ),
        backgroundColor: parsed.backgroundColor || defaults.backgroundColor,
        logoUrl: parsed.logoUrl ?? defaults.logoUrl,
        companyName: parsed.companyName || defaults.companyName,
        contactPhone: parsed.contactPhone || defaults.contactPhone,
        contactType: parsed.contactType || defaults.contactType,
        contactLink: parsed.contactLink ?? defaults.contactLink,
        visualizerType: parsed.visualizerType || defaults.visualizerType,
      });
    } catch (error) {
      console.error("Error parsing saved embed config:", error);
      setConfig(defaults);
    }
  }, [
    tenant?.slug,
    tenant?.companyName,
    tenant?.primaryColor,
    tenant?.secondaryColor,
    tenant?.embedPrimaryColor,
    tenant?.embedSecondaryColor,
    tenant?.phone,
    tenant?.contactPhone,
    tenant?.logoUrl,
    tenant?.embedCtaUrl,
  ]);

  useEffect(() => {
    if (!tenant?.slug) return;

    localStorage.setItem(
      `embed-config-${tenant.slug}`,
      JSON.stringify(config),
    );
  }, [config, tenant?.slug]);

  const baseUrl = window.location.origin;
  const tenantSlug = tenant?.slug || "demo";
  const embedAccountUserId = accountUserId || tenant?.userId || null;

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      tenant: tenantSlug,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      companyName: config.companyName || "",
      contactPhone: config.contactPhone || "",
      contactType: config.contactType,
      contactLink: config.contactLink || "",
      showHeader: config.showHeader.toString(),
      backgroundScheme: config.backgroundScheme,
      backgroundColor: config.backgroundColor,
    });

    if (embedAccountUserId) {
      params.set("accountUserId", String(embedAccountUserId));
    }

    if (config.logoUrl.trim()) {
      params.set("logoUrl", config.logoUrl.trim());
    }

    return `${baseUrl}${visualizerPaths[config.visualizerType]}?${params.toString()}`;
  }, [baseUrl, config, embedAccountUserId, tenantSlug]);

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="${config.width}"
  height="${config.height}"
  frameborder="0"
  style="border: 0; border-radius: 12px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);"
  title="${config.companyName} ${visualizerLabels[config.visualizerType]}"
  allowfullscreen>
</iframe>`;

  const selectedBackgroundOption =
    EMBED_BACKGROUND_OPTIONS.find(
      (option) => option.value === config.backgroundScheme,
    ) || EMBED_BACKGROUND_OPTIONS[0];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsLogoUploading(true);

    try {
      const result = await uploadImageToPublic(file);
      setConfig((current) => ({
        ...current,
        logoUrl: result.imageUrl,
      }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Logo upload failed. Please try another image.");
    } finally {
      setIsLogoUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            Embed Builder
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Configure the client visualizer, then copy the iframe code.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.open(embedUrl, "_blank")}
          className="shrink-0"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Preview
        </Button>
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
        <div className="space-y-6">
          <section>
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Monitor className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold">Visualizer</h4>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="visualizerType">Type</Label>
                <select
                  id="visualizerType"
                  value={config.visualizerType}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      visualizerType: event.target.value as VisualizerType,
                    })
                  }
                  className={selectClassName}
                >
                  <option value="landscape">Landscape Visualizer</option>
                  <option value="roofing">Roofing & Siding Visualizer</option>
                  <option value="pools">Pool Visualizer</option>
                  <option value="painting">Painting Visualizer</option>
                  <option value="kitchen">Kitchen Visualizer</option>
                  <option value="bathroom">Bathroom Visualizer</option>
                  <option value="living-room">Living Room Visualizer</option>
                </select>
              </div>

              <div>
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  value={config.width}
                  onChange={(event) =>
                    setConfig({ ...config, width: event.target.value })
                  }
                  placeholder="100% or 800px"
                />
              </div>

              <div>
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  value={config.height}
                  onChange={(event) =>
                    setConfig({ ...config, height: event.target.value })
                  }
                  placeholder="800px"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2">
                <Switch
                  id="showHeader"
                  checked={config.showHeader}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, showHeader: checked })
                  }
                />
                <Label htmlFor="showHeader" className="text-sm">
                  Show header with logo and company name
                </Label>
              </div>
            </div>
          </section>

          <section className="border-t pt-6">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Image className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold">Branding</h4>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={config.companyName}
                  onChange={(event) =>
                    setConfig({ ...config, companyName: event.target.value })
                  }
                  placeholder="Your Company Name"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="logoUpload">Logo Image</Label>
                <div className="mt-2 flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-slate-50">
                    {config.logoUrl ? (
                      <img
                        src={config.logoUrl}
                        alt="Logo preview"
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <Image className="h-7 w-7 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isLogoUploading}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={isLogoUploading}
                      >
                        <label htmlFor="logoUpload" className="cursor-pointer">
                          {isLogoUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {isLogoUploading ? "Uploading" : "Upload Logo"}
                        </label>
                      </Button>
                      {config.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setConfig((current) => ({
                              ...current,
                              logoUrl: "",
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Upload a PNG, JPG, or SVG logo. The embed will use the uploaded image automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={config.primaryColor}
                  onChange={(event) =>
                    setConfig({ ...config, primaryColor: event.target.value })
                  }
                  className="h-11 p-1"
                />
              </div>

              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={config.secondaryColor}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      secondaryColor: event.target.value,
                    })
                  }
                  className="h-11 p-1"
                />
              </div>
            </div>
          </section>

          <section className="border-t pt-6">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Palette className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold">Background</h4>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="backgroundScheme">Scheme</Label>
                <select
                  id="backgroundScheme"
                  value={config.backgroundScheme}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      backgroundScheme: event.target
                        .value as EmbedBackgroundScheme,
                    })
                  }
                  className={selectClassName}
                >
                  {EMBED_BACKGROUND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedBackgroundOption.description}
                </p>
              </div>

              {config.backgroundScheme === "solid-custom" && (
                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={config.backgroundColor}
                    onChange={(event) =>
                      setConfig({
                        ...config,
                        backgroundColor: event.target.value,
                      })
                    }
                    className="h-11 p-1"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="border-t pt-6">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Phone className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold">Quote Button</h4>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="contactType">Action</Label>
                <select
                  id="contactType"
                  value={config.contactType}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      contactType: event.target.value as ContactType,
                    })
                  }
                  className={selectClassName}
                >
                  <option value="phone">Phone Number</option>
                  <option value="link">Custom Link</option>
                </select>
              </div>

              {config.contactType === "phone" ? (
                <div className="md:col-span-2">
                  <Label htmlFor="contactPhone">Contact Phone Number</Label>
                  <Input
                    id="contactPhone"
                    value={config.contactPhone}
                    onChange={(event) =>
                      setConfig({
                        ...config,
                        contactPhone: event.target.value,
                      })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              ) : (
                <div className="md:col-span-2">
                  <Label htmlFor="contactLink">Contact Link URL</Label>
                  <Input
                    id="contactLink"
                    value={config.contactLink}
                    onChange={(event) =>
                      setConfig({
                        ...config,
                        contactLink: event.target.value,
                      })
                    }
                    placeholder="https://yoursite.com/contact"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Layout className="h-4 w-4 text-blue-600" />
                <Label>Embed Code</Label>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={copyToClipboard}
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={iframeCode}
              readOnly
              className="min-h-[190px] resize-none bg-slate-50 font-mono text-xs leading-relaxed"
            />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <Label>Live Preview</Label>
              <span className="text-xs text-slate-500">
                {visualizerLabels[config.visualizerType]}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border bg-slate-100 p-3">
              <div className="overflow-hidden rounded-md border bg-white">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="520"
                  style={{ border: "none" }}
                  title="Embed Preview"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
