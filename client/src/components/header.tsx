import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bath, ChefHat, ChevronDown, Home, LogOut, Paintbrush, Sofa, TreePine, User, Waves } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { normalizeEmbedServiceAccess, type EmbedServiceKey } from "@/lib/embed-services";

interface HeaderProps {
  tenant: {
    companyName: string;
    embedCustomizations?: unknown;
  };
  compactMobile?: boolean;
}

const mainSiteServices: Array<{
  key: EmbedServiceKey;
  href: string;
  label: string;
  description: string;
  icon: typeof Home;
}> = [
  {
    key: "roofing",
    href: "/roofing-siding",
    label: "Roofing & Siding",
    description: "AI home exterior visualization",
    icon: Home,
  },
  {
    key: "pools",
    href: "/pools",
    label: "Pool Visualization",
    description: "AI pool design visualization",
    icon: Waves,
  },
  {
    key: "landscape",
    href: "/landscape",
    label: "Landscape Design",
    description: "AI landscape visualization",
    icon: TreePine,
  },
  {
    key: "painting",
    href: "/painting",
    label: "Painting",
    description: "Indoor room paint visualization",
    icon: Paintbrush,
  },
  {
    key: "bathroom",
    href: "/bathroom-redesign",
    label: "Bathroom Redesign",
    description: "AI bathroom remodel concepts",
    icon: Bath,
  },
  {
    key: "kitchen",
    href: "/kitchen-redesign",
    label: "Kitchen Redesign",
    description: "AI kitchen remodel concepts",
    icon: ChefHat,
  },
  {
    key: "living-room",
    href: "/living-room-design",
    label: "Living Room Design",
    description: "AI living room concepts",
    icon: Sofa,
  },
];

export default function Header({ tenant, compactMobile = false }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const serviceAccess = normalizeEmbedServiceAccess(
    (tenant.embedCustomizations as any)?.enabledServices,
  );
  const visibleServices = mainSiteServices.filter((service) => serviceAccess[service.key]);

  return (
    <header className="relative z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${compactMobile ? "py-4 sm:py-6" : "py-6"}`}>
          <Link href="/" className={`flex items-center hover:opacity-80 transition-opacity cursor-pointer ${compactMobile ? "space-x-2 sm:space-x-3" : "space-x-3"}`}>
            {/* Logo */}
            <svg
              className={`${compactMobile ? "w-10 h-10 sm:w-12 sm:h-12" : "w-12 h-12"} text-white`}
              viewBox="0 0 128.37 135.86"
              fill="currentColor"
            >
              <path fill="#fff" d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"/>
              <path fill="#fff" d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"/>
            </svg>
            <div>
              <h1 className={`${compactMobile ? "text-xl sm:text-2xl" : "text-2xl"} font-bold text-white`}>
                {tenant.companyName}
              </h1>
              <p className={`${compactMobile ? "text-xs sm:text-sm" : "text-sm"} text-slate-300`}>Powered by Solst LLC</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            {/* Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:bg-transparent hover:text-blue-400 transition-colors flex items-center gap-1 px-0"
                >
                  Services
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg"
                align="center"
              >
                {visibleServices.map((service) => {
                  const Icon = service.icon;
                  return (
                    <DropdownMenuItem key={service.key} asChild>
                      <Link
                        href={service.href}
                        className="group relative flex cursor-pointer select-none items-center gap-3 rounded-sm bg-white px-3 py-2 text-sm font-medium text-black outline-none transition-colors hover:bg-slate-100 hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{service.label}</div>
                          <div className="text-xs text-slate-500 group-hover:text-white">{service.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href="/pricing"
              className="text-slate-300 hover:text-blue-400 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/contact"
              className="text-slate-300 hover:text-blue-400 transition-colors"
            >
              Contact
            </a>
            
            {/* Auth Section */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-slate-300 hover:bg-white hover:text-slate-800 flex items-center space-x-2 rounded-xl transition-colors">
                    <User className="h-4 w-4" />
                    <span>{user.user.firstName}</span>
                    {user.usage && (
                      <Badge variant="secondary" className="ml-1 bg-blue-600 text-white">
                        {user.usage.planName}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                className="px-4 py-1 text-sm border-2 border-slate-300 text-slate-300 hover:border-white hover:bg-white hover:text-slate-800 rounded-xl bg-transparent transition-colors font-medium"
                onClick={() => setLocation('/auth')}
              >
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile menu button - simplified for now */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-blue-400"
                >
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-48 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg"
                align="end"
              >
                {visibleServices.map((service) => {
                  const Icon = service.icon;
                  return (
                    <DropdownMenuItem key={service.key} asChild>
                      <Link href={service.href} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100">
                        <Icon className="h-4 w-4" />
                        {service.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="flex items-center px-3 py-2 hover:bg-slate-100">
                    Pricing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact" className="flex items-center px-3 py-2 hover:bg-slate-100">
                    Contact
                  </Link>
                </DropdownMenuItem>
                
                {/* Authentication section for mobile */}
                <DropdownMenuSeparator />
                {user ? (
                  <>
                    <DropdownMenuItem onClick={() => setLocation('/dashboard')} className="px-3 py-2">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard ({user.user.firstName})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="px-3 py-2">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => setLocation('/auth')} className="px-3 py-2">
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
