import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Building2, ImagePlus, Monitor, Palette, Sparkles, Upload } from "lucide-react";
import { Link } from "wouter";

import Header from "@/components/header";
import {
  DEMO_EMBED_TRIAL_LIMIT,
  DEMO_EMBED_TRIAL_MESSAGE,
  readDemoEmbedTrialUsage,
} from "@/hooks/use-demo-embed-trial";
import { useTenant } from "@/hooks/use-tenant";

type BackgroundMode = "solid-custom" | "brand-gradient" | "home-blue" | "white";

const backgroundModes: Array<{ value: BackgroundMode; label: string }> = [
  { value: "home-blue", label: "Home blue" },
  { value: "brand-gradient", label: "Brand gradient" },
  { value: "solid-custom", label: "Solid" },
  { value: "white", label: "White" },
];

const demoServices = [
  { id: "roofing-siding", label: "Roofing & Siding", path: "/embed-roofing" },
  { id: "landscape", label: "Landscape", path: "/embed" },
  { id: "pools", label: "Pools", path: "/embed-pools" },
  { id: "painting", label: "Painting", path: "/embed-painting" },
  { id: "kitchen", label: "Kitchen", path: "/embed-kitchen" },
  { id: "bathroom", label: "Bathroom", path: "/embed-bathroom" },
  { id: "living-room", label: "Living Room", path: "/embed-living-room" },
] as const;

const hexOrFallback = (value: string, fallback: string) =>
  /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

export default function DemoEmbedPage() {
  const { tenant } = useTenant("demo");
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("home-blue");
  const [backgroundColor, setBackgroundColor] = useState("#111827");
  const [accentColor, setAccentColor] = useState("#3b82f6");
  const [companyName, setCompanyName] = useState("Your Company");
  const [selectedService, setSelectedService] = useState<(typeof demoServices)[number]>(demoServices[0]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [trialUsage, setTrialUsage] = useState(() => readDemoEmbedTrialUsage());

  useEffect(() => {
    const syncUsage = () => setTrialUsage(readDemoEmbedTrialUsage());
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== DEMO_EMBED_TRIAL_MESSAGE) return;
      syncUsage();
    };

    window.addEventListener("storage", syncUsage);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("storage", syncUsage);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, [logoUrl]);

  const effectiveTenant = tenant || {
    id: 1,
    userId: null,
    slug: "demo",
    companyName: "DreamBuilder",
    logoUrl: null,
    primaryColor: "#2563EB",
    secondaryColor: "#2563EB",
    phone: null,
    email: null,
    address: null,
    description: "Professional AI-powered visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: 0,
    contactPhone: null,
    embedEnabled: false,
    embedCtaText: "Get Your Free Quote",
    embedCtaPhone: null,
    embedCtaUrl: null,
    embedPrimaryColor: "#2563EB",
    embedSecondaryColor: "#2563EB",
    lastResetDate: new Date(),
    createdAt: new Date(),
  };

  const safeBackgroundColor = hexOrFallback(backgroundColor, "#111827");
  const safeAccentColor = hexOrFallback(accentColor, "#3b82f6");
  const displayCompanyName = companyName.trim() || "Your Company";
  const remaining = Math.max(DEMO_EMBED_TRIAL_LIMIT - trialUsage, 0);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      tenant: "demo",
      companyName: displayCompanyName,
      primaryColor: safeAccentColor,
      secondaryColor: safeAccentColor,
      backgroundScheme: backgroundMode,
      backgroundColor: safeBackgroundColor,
      showHeader: "true",
      demoTrial: "1",
    });

    if (logoUrl) params.set("logoUrl", logoUrl);
    return `${selectedService.path}?${params.toString()}`;
  }, [backgroundMode, displayCompanyName, logoUrl, safeAccentColor, safeBackgroundColor, selectedService.path]);

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <Header tenant={effectiveTenant} />

      <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-[94rem]">
          <div className="grid gap-8 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">Live embed demo</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
                Make it yours. Then make it work.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Add your name and logo, choose a service, and use the same visualizer your customers will see.
              </p>

              <div className="mt-6 rounded-xl border border-blue-300/15 bg-blue-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {remaining > 0 ? `${remaining} free demo ${remaining === 1 ? "try" : "tries"} remaining` : "Free demo complete"}
                    </p>
                    <p className="mt-1 text-sm text-blue-100/75">
                      Completed designs count across every service on this browser.
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold">
                    {trialUsage}/{DEMO_EMBED_TRIAL_LIMIT}
                  </span>
                </div>
                {remaining === 0 && (
                  <p className="mt-3 text-sm text-blue-100">
                    Your next Generate click will open pricing, or you can{" "}
                    <Link href="/pricing?from=embed-demo" className="font-semibold underline underline-offset-4">
                      view plans now
                    </Link>
                    .
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-5 rounded-xl bg-blue-950/35 p-5 ring-1 ring-blue-300/10">
                <div>
                  <label htmlFor="demo-company-name" className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Building2 className="h-4 w-4" />
                    Company name
                  </label>
                  <input
                    id="demo-company-name"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="mt-3 h-12 w-full rounded-xl border border-blue-300/20 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-300"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <ImagePlus className="h-4 w-4" />
                    Logo
                  </label>
                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed border-blue-300/25 bg-[#111827] px-4 py-4 text-sm text-slate-300 transition hover:border-blue-300/60">
                    <span>{logoUrl ? "Logo loaded — choose another" : "Upload your logo"}</span>
                    <Upload className="h-5 w-5 text-blue-200" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>

                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Monitor className="h-4 w-4" />
                    Visualizer
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {demoServices.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedService(service)}
                        className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                          selectedService.id === service.id
                            ? "bg-blue-500 text-white"
                            : "bg-[#111827] text-slate-300 ring-1 ring-blue-300/10 hover:bg-blue-900/40"
                        }`}
                      >
                        {service.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                    <Palette className="h-4 w-4" />
                    Background style
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {backgroundModes.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setBackgroundMode(mode.value)}
                        className={`rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          backgroundMode === mode.value
                            ? "bg-blue-500 text-white"
                            : "bg-[#111827] text-slate-300 ring-1 ring-blue-300/10 hover:bg-blue-900/40"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-blue-100">
                    Button color
                    <input
                      type="color"
                      value={safeAccentColor}
                      onChange={(event) => setAccentColor(event.target.value)}
                      className="mt-3 h-12 w-full rounded-lg border border-blue-300/20 bg-transparent p-1"
                    />
                  </label>
                  <label className="text-sm font-semibold text-blue-100">
                    Background color
                    <input
                      type="color"
                      value={safeBackgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      className="mt-3 h-12 w-full rounded-lg border border-blue-300/20 bg-transparent p-1"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-blue-950/35 p-3 shadow-2xl shadow-black/30 ring-1 ring-blue-300/10">
              <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-blue-200" />
                <span className="h-3 w-3 rounded-full bg-blue-300" />
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <div className="ml-3 h-8 flex-1 truncate rounded-md bg-black/25 px-3 py-1.5 text-sm text-white/70">
                  {displayCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourcompany"}.com/visualizer
                </div>
              </div>
              <iframe
                key={embedUrl}
                src={embedUrl}
                title={`${displayCompanyName} ${selectedService.label} visualizer demo`}
                className="block h-[52rem] w-full border-0 bg-transparent"
                allow="clipboard-write"
              />
              <div className="flex items-center justify-center gap-2 border-t border-blue-300/10 bg-[#0b1220] px-4 py-3 text-xs text-blue-100/70">
                <Sparkles className="h-4 w-4 text-blue-300" />
                This is the live customer embed, including upload, styles, generation, quote gate, and DreamBuilder branding.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
