import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Facebook, Youtube, Instagram } from "lucide-react";
import Header from "@/components/header";
import { useTenant } from "@/hooks/use-tenant";
import { useLocation, Link } from "wouter";

export default function Home() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [, setLocation] = useLocation();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [hoverText, setHoverText] = useState("Visualize");
  
  const animatedTexts = ["Roof", "Siding", "Landscape", "Patio", "Pool"];
  const hoverTexts = [
    "A new pool",
    "Different color siding", 
    "Beautiful curbing",
    "Stunning landscape",
    "Modern patio"
  ];

  // Cycle through animated texts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % animatedTexts.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const handleRandomHover = () => {
    const randomText = hoverTexts[Math.floor(Math.random() * hoverTexts.length)];
    setHoverText(randomText);
  };

  const handleMouseLeave = () => {
    setHoverText("Visualize");
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Create fallback tenant if API call fails
  const effectiveTenant = tenant || {
    id: 1,
    userId: null,
    slug: "demo",
    companyName: "DreamBuilder",
    logoUrl: null,
    primaryColor: "#2563EB", 
    secondaryColor: "#059669",
    phone: null,
    email: null,
    address: null,
    description: "Professional AI-powered landscaping visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: null,
    contactPhone: null,
    embedEnabled: false,
    embedCtaText: null,
    embedCtaPhone: null,
    embedCtaUrl: null,
    embedPrimaryColor: null,
    embedSecondaryColor: null,
    createdAt: new Date(),
  };

  const brandColors = {
    "--primary": effectiveTenant.primaryColor,
    "--secondary": effectiveTenant.secondaryColor,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black">
      {/* Header */}
      <Header tenant={effectiveTenant} />
      
      {/* Hero Section */}
      <section className="py-12 pb-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-2">
            Visualize your new...
          </h1>
          <div className="h-16 flex items-center justify-center mb-2">
            <span 
              className="text-4xl md:text-6xl font-bold text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-red-400 bg-clip-text animate-slide-down"
              key={currentTextIndex}
            >
              {animatedTexts[currentTextIndex]}
            </span>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <div className="aspect-video bg-slate-700 rounded-xl flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-600 flex items-center justify-center">
                  <Sparkles className="h-8 w-8" />
                </div>
                <p className="text-base font-semibold">Demo video coming soon</p>
                <p className="text-xs opacity-75">Watch AI transform homes in seconds</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Button
            size="lg"
            className="text-2xl px-20 py-6 w-full max-w-md bg-gradient-to-r from-blue-500 via-purple-600 to-red-500 hover:from-blue-600 hover:via-purple-700 hover:to-red-600 text-white font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            onMouseEnter={handleRandomHover}
            onMouseLeave={handleMouseLeave}
            onClick={() => setLocation('/roofing-siding')}
          >
            <Sparkles className="h-6 w-6 mr-3" />
            {hoverText}
          </Button>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-6 md:flex md:flex-row md:justify-between md:items-center md:space-y-0">
            {/* Left side - Logo and company */}
            <Link 
              href="/"
              className="flex items-center justify-center md:justify-start space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 128.37 135.86"
                fill="currentColor"
              >
                <path fill="#fff" d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"/>
                <path fill="#fff" d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"/>
              </svg>
              <div>
                <p className="text-white font-semibold">{effectiveTenant.companyName}</p>
                <p className="text-slate-400 text-sm">
                Powered by Solst LLC
                </p>
              </div>
            </Link>


            {/* Right side - Social icons */}
            <div className="flex items-center justify-center space-x-4 md:justify-end">
              <a
                href="#"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}