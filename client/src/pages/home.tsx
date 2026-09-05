import { useEffect, useState } from "react";
import {
  ArrowRight,
  Facebook,
  Image as ImageIcon,
  Instagram,
  LayoutTemplate,
  Linkedin,
  MousePointerClick,
  Sparkles,
  Upload,
  Youtube,
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { Link } from "wouter";
import Header from "@/components/header";
import { PricingCard, type PricingTier } from "@/components/ui/pricing-card";
import { useTenant } from "@/hooks/use-tenant";
import { normalizeEmbedServiceAccess, type EmbedServiceKey } from "@/lib/embed-services";
import homepageVideoPath from "@assets/720 Video Homepage_1758030379692.mp4";
import roofingAfterImage from "@assets/roofing-after.jpg";
import roofingBeforeImage from "@assets/roofing-before.jpg";
import roofingDesign14 from "@assets/roofing-design-14.jpg";
import roofingDesign17 from "@assets/roofing-design-17.jpg";
import roofingDesign18 from "@assets/roofing-design-18.jpg";
import roofingDesign19 from "@assets/roofing-design-19.jpg";
import roofingDesign20 from "@assets/roofing-design-20.jpg";
import roofingDesign21 from "@assets/roofing-design-21.jpg";
import roofingDesign22 from "@assets/roofing-design-22.jpg";

const animatedServiceTexts: Array<{ label: string; key: EmbedServiceKey }> = [
  { label: "Roofs", key: "roofing" },
  { label: "Siding", key: "roofing" },
  { label: "Landscapes", key: "landscape" },
  { label: "Patios", key: "landscape" },
  { label: "Pools", key: "pools" },
  { label: "Kitchens", key: "kitchen" },
  { label: "Bathrooms", key: "bathroom" },
  { label: "Paint", key: "painting" },
];

const designImages = [
  roofingBeforeImage,
  roofingDesign17,
  roofingDesign14,
  roofingDesign18,
  roofingDesign19,
  roofingDesign20,
  roofingDesign21,
  roofingDesign22,
];

const possibilitySteps = [
  { title: "Upload Your Photo", label: "Snap a photo or upload an existing one", icon: Upload },
  { title: "Visualize & Decide", label: "Compare and choose the design they want", icon: ImageIcon },
  { title: "Get a Quote", label: "Turn the chosen design into an estimate request", icon: Sparkles },
];

const services: Array<{ label: string; href: string; key: EmbedServiceKey }> = [
  { label: "Roofing", href: "/roofing-siding", key: "roofing" },
  { label: "Siding", href: "/roofing-siding", key: "roofing" },
  { label: "Landscape", href: "/landscape", key: "landscape" },
  { label: "Patios", href: "/landscape", key: "landscape" },
  { label: "Pools", href: "/pools", key: "pools" },
  { label: "Painting", href: "/painting", key: "painting" },
  { label: "Kitchen Redesign", href: "/kitchen-redesign", key: "kitchen" },
  { label: "Bathroom Redesign", href: "/bathroom-redesign", key: "bathroom" },
  { label: "Living Room Design", href: "/living-room-design", key: "living-room" },
];

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    description: "Try the visualizer with no commitment",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["5 visualizations per month", "Standard sharing options", "Images include watermark"],
    cta: "Start Free Trial",
    ctaLink: "/auth?mode=signup",
  },
  {
    name: "Contractor",
    description: "For small business owners ready to impress clients",
    monthlyPrice: 300,
    yearlyPrice: 3600,
    features: [
      "200 visualizations per month",
      "Basic embed widget",
      "Full-resolution downloads",
      "Priority rendering speeds",
    ],
    cta: "Get Started",
    ctaLink: "price_1TcynuBY2SPm2HvO1Eri2ogI",
  },
  {
    name: "Professional",
    description: "For growing teams and embedded lead capture",
    monthlyPrice: 500,
    yearlyPrice: 6000,
    features: [
      "650 visualizations per month",
      "Team access for up to 3 users",
      "Custom embed widget",
      "Custom quote form and visitor limits",
      "CRM integration via secure webhook",
      "Advanced customization chat",
      "Higher quality image model",
    ],
    cta: "Get Started",
    ctaLink: "price_1SGN4YBY2SPm2HvOrpREWCn1",
  },
  {
    name: "Enterprise",
    description: "For organizations scaling visual sales across teams and locations",
    priceLabel: "Custom pricing",
    features: [
      "Everything in Professional",
      "Higher visualization volume",
      "White-label app and widget",
      "CRM integration and lead delivery workflows",
      "Custom training integrations",
      "Advanced storage and tracking",
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
  },
];

export default function Home() {
  const { tenant } = useTenant("demo");
  const serviceAccess = normalizeEmbedServiceAccess((tenant as any)?.embedCustomizations?.enabledServices);
  const visibleServices = services.filter((service) => serviceAccess[service.key]);
  const visibleAnimatedTexts = animatedServiceTexts
    .filter((item) => serviceAccess[item.key])
    .map((item) => item.label);
  const rotatingServiceTexts = visibleAnimatedTexts.length > 0 ? visibleAnimatedTexts : ["Designs"];
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0);
  const [loadedDesignImages, setLoadedDesignImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % rotatingServiceTexts.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [rotatingServiceTexts.length]);

  useEffect(() => {
    setCurrentTextIndex((current) => current % rotatingServiceTexts.length);
  }, [rotatingServiceTexts.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDesignIndex((prev) => {
        const next = (prev + 1) % designImages.length;

        return loadedDesignImages[next] ? next : prev;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [loadedDesignImages]);

  useEffect(() => {
    designImages.forEach((src, index) => {
      const image = new Image();
      image.src = src;
      image.onload = () => {
        setLoadedDesignImages((current) => ({ ...current, [index]: true }));
      };
    });
  }, []);

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#111827] text-white">
      <Header tenant={effectiveTenant} />

      <main>
        <section className="px-4 pb-8 pt-9 sm:px-6 lg:px-8 lg:pb-9 lg:pt-12">
          <div className="mx-auto grid max-w-[88rem] items-center gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="min-w-0">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl md:text-7xl">
                Show it before they book it
              </h1>

              <div className="mt-4 flex min-h-[3.25rem] items-center md:min-h-[4rem]">
                <span
                  className="animate-service-word bg-gradient-to-r from-sky-200 via-blue-300 to-indigo-200 bg-clip-text pb-1 text-4xl font-bold leading-tight text-transparent sm:text-5xl md:text-6xl"
                  key={currentTextIndex}
                >
                  {rotatingServiceTexts[currentTextIndex]}
                </span>
              </div>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Turn uploaded photos into project previews, then capture estimate requests from people who already saw what they want
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth?mode=signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/demo-embed"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300/30 px-6 py-3 font-semibold text-white transition hover:bg-blue-400/10"
                >
                  Try Embedded Page
                  <MousePointerClick className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="min-w-0">
              <div className="overflow-hidden rounded-xl border border-blue-300/15 bg-blue-950/40 p-2 shadow-2xl shadow-black/30">
                <div className="aspect-video overflow-hidden rounded-lg bg-[#0b1220]">
                  <video className="h-full w-full object-cover" autoPlay loop muted playsInline preload="auto">
                    <source src={homepageVideoPath} type="video/mp4" />
                    Video unavailable
                  </video>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="mx-auto inline-flex rounded-full bg-blue-500/15 px-6 py-2 text-sm font-bold uppercase tracking-wide text-blue-300">
                HOW IT WORKS
              </p>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-white md:text-6xl">
                From Photo to Quote in{" "}
                <span className="bg-gradient-to-r from-blue-200 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  3 Easy Steps
                </span>
              </h2>
              <p className="mt-5 text-lg text-slate-300">See beautiful results, get estimates, and win more projects</p>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
              {possibilitySteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div key={step.title} className="flex flex-col items-center text-center">
                    <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-full border border-blue-400 bg-transparent text-sm font-bold text-blue-300">
                      {index + 1}
                    </span>
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-300/25">
                      <Icon className="h-10 w-10 text-blue-400" />
                    </div>
                    <h3 className="mt-5 text-2xl font-bold text-white">{step.title}</h3>
                    <p className="mt-2 max-w-xs text-lg leading-8 text-slate-300">{step.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-14 rounded-xl bg-blue-950/45 p-3 shadow-2xl shadow-black/25 ring-1 ring-blue-300/10">
              <div className="grid overflow-hidden rounded-lg bg-[#0b1220] md:grid-cols-2">
                <div className="relative aspect-[16/9] border-b border-blue-300/10 md:border-b-0 md:border-r md:border-blue-300/10">
                  <img src={roofingBeforeImage} alt="Before roofing visualizer preview" className="h-full w-full object-cover object-[50%_95%]" />
                  <span className="absolute left-5 top-5 rounded-lg bg-[#111827]/85 px-4 py-2 text-sm font-bold uppercase text-white">
                    Before
                  </span>
                </div>

                <div className="relative aspect-[16/9]">
                  <img src={roofingAfterImage} alt="After roofing visualizer preview" className="h-full w-full object-cover object-[50%_95%]" />
                  <span className="absolute left-5 top-5 rounded-lg bg-[#111827]/85 px-4 py-2 text-sm font-bold uppercase text-blue-100">
                    After
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="embed-demo" className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">24/7 website sales tool</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
                Drop a{" "}
                <span className="bg-gradient-to-r from-blue-200 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  visualizer
                </span>{" "}
                right onto your site
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                Turn browsers into estimate requests while they are still excited
              </p>
              <div className="mt-7 flex justify-center">
                <Link
                  href="/demo-embed"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300/30 px-6 py-3 font-semibold text-white transition hover:bg-blue-400/10"
                >
                  Try Embedded Page
                  <MousePointerClick className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl rounded-xl bg-blue-950/50 p-3 shadow-2xl shadow-black/30 ring-1 ring-blue-300/15 lg:ml-auto">
              <div className="overflow-hidden rounded-lg bg-[#0c1528]">
                <div className="flex items-center gap-2 border-b border-blue-300/10 bg-blue-900/25 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <div className="ml-2 h-7 flex-1 rounded-md bg-[#111827] px-3 py-1.5 text-xs text-blue-100/70">
                    yourcompany.com/visualizer
                  </div>
                </div>

                <div className="bg-[#0b1220] p-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white">
                      <LayoutTemplate className="h-4 w-4" />
                      Your Logo Here
                    </div>
                    <h3 className="mt-4 text-center text-2xl font-bold leading-tight text-white">
                      <span className="bg-gradient-to-r from-blue-200 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                        Roofing
                      </span>{" "}
                      Visualizer
                    </h3>
                    <p className="mt-2 text-center text-xs text-blue-100/70">Upload a photo choose options generate a preview</p>
                  </div>

                  <div className="mx-auto mt-4 max-w-lg space-y-3">
                    <div className="rounded-lg bg-blue-950/55 p-2 ring-1 ring-blue-300/15">
                      <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-md bg-[#111827]">
                        <img
                          src={roofingBeforeImage}
                          alt="Upload project photo preview"
                          className="absolute inset-0 h-full w-full object-cover object-[50%_72%]"
                        />
                        <div className="absolute inset-0 bg-[#111827]/35" />
                        <div className="relative text-center drop-shadow-lg">
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-blue-950/55 p-3 ring-1 ring-blue-300/15">
                      <p className="text-sm font-semibold text-white">Choose your style</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          { label: "Roof", active: false },
                          { label: "Siding", active: false },
                          { label: "Windows", active: false },
                          { label: "Surprise", active: false },
                        ].map((style) => (
                          <div key={style.label} className="min-h-14 rounded-md border border-slate-500/70 bg-slate-500/55 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white">{style.label}</span>
                              <span
                                className={`flex h-4 w-7 items-center rounded-full p-0.5 ${style.active ? "bg-blue-500" : "bg-slate-600"
                                  }`}
                              >
                                <span
                                  className={`h-3 w-3 rounded-full bg-white ${style.active ? "translate-x-3" : "translate-x-0"
                                    }`}
                                />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white">
                      Generate preview
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-xl shadow-2xl shadow-black/30 ring-1 ring-blue-300/15">
            <div className="relative flex min-h-[34rem] items-end overflow-hidden p-6 md:p-10">
              {designImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt="Rotating roofing and siding design preview"
                  className={`absolute inset-0 h-full w-full object-cover object-[50%_76%] ${
                    currentDesignIndex === index ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setLoadedDesignImages((current) => ({ ...current, [index]: true }))}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/95 via-[#111827]/70 to-[#111827]/10" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#111827]/85 to-transparent" />
              <div className="relative max-w-4xl pb-6">
                <h2 className="pb-2 text-4xl font-bold leading-[1.12] text-white md:text-6xl">
                  1 Photo
                  <span className="block whitespace-nowrap bg-gradient-to-r from-blue-200 via-sky-300 to-blue-500 bg-clip-text pb-2 text-transparent">
                    Thousands of Designs
                  </span>
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-200">
                  One upload becomes every option they need to say yes
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-10">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#111827] to-transparent md:w-40" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#111827] to-transparent md:w-40" />
          <div className="service-conveyor flex w-max gap-10">
            {[...visibleServices, ...visibleServices].map((service, index) => (
              <Link
                key={`${service.label}-${index}`}
                href={service.href}
                className="text-2xl font-semibold text-white transition hover:text-blue-200 md:text-3xl"
              >
                {service.label}
              </Link>
            ))}
          </div>
        </section>

        <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-bold text-white md:text-5xl">Choose your plan</h2>
              <p className="mt-4 text-lg text-slate-300">Start simple Add volume when you need it</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {pricingTiers.map((tier) => (
                <PricingCard key={tier.name} tier={tier} paymentFrequency="Monthly" />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-5">
              <div className="h-px flex-1 bg-blue-300/20" />
              <h2 className="text-4xl font-bold text-white md:text-5xl">Let the picture make the pitch</h2>
              <div className="h-px flex-1 bg-blue-300/20" />
            </div>
            <p className="mt-5 text-lg text-slate-300">Start free Upgrade when ready</p>
            <Link
              href="/auth?mode=signup"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-7 py-3 font-semibold text-white transition hover:bg-blue-400"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-blue-300/10 bg-[#111827]">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-6 md:flex-row md:items-center md:justify-between md:space-y-0">
            <Link href="/" className="flex items-center justify-center space-x-3 transition hover:opacity-80 md:justify-start">
              <svg className="h-10 w-10 text-white" viewBox="0 0 128.37 135.86" fill="currentColor">
                <path
                  fill="#fff"
                  d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"
                />
                <path
                  fill="#fff"
                  d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"
                />
              </svg>
              <div>
                <p className="font-semibold text-white">{effectiveTenant.companyName}</p>
                <p className="text-sm text-slate-400">Powered by Solst LLC</p>
              </div>
            </Link>

            <div className="flex items-center justify-center space-x-6 text-sm">
              <Link href="/terms" className="text-slate-400 transition hover:text-white">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-slate-400 transition hover:text-white">
                Privacy Policy
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-4 md:justify-end">
              <a href="https://www.facebook.com/profile.php?id=61581152150848" className="text-slate-400 transition hover:text-blue-300" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/@DreamBuilderAI" className="text-slate-400 transition hover:text-blue-300" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/dreambuilderai/?igsh=Nmt1NnVoeGxvNXEx&utm_source=qr#" className="text-slate-400 transition hover:text-blue-300" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 transition hover:text-blue-300" aria-label="TikTok">
                <SiTiktok className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/dream-builder-ai/" className="text-slate-400 transition hover:text-blue-300" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
