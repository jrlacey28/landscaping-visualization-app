import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Home, Waves } from "lucide-react";
import type { Tenant } from "@shared/schema";

interface HeaderProps {
  tenant: Tenant;
}

export default function Header({ tenant }: HeaderProps) {
  const [location] = useLocation();
  const currentService = location === "/pools" ? "pools" : "roofing";

  return (
    <header className="relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21l9-18 9 18H3z M12 2v19"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {tenant.companyName}
              </h1>
              <p className="text-sm text-slate-300">Powered by Solst LLC</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            {/* Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:bg-white hover:text-black transition-colors flex items-center gap-1"
                >
                  Services
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg"
                align="center"
              >
                <DropdownMenuItem asChild>
                  <Link 
                    href="/"
                    className="relative select-none rounded-sm text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors font-medium bg-[#ffffff] text-[#000000]"
                  >
                    <Home className="h-4 w-4" />
                    <div>
                      <div className="font-medium text-[#000000]">Roofing & Siding</div>
                      <div className="text-xs text-slate-500">AI home exterior visualization</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href="/pools"
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                      currentService === "pools" 
                        ? "bg-blue-100 text-blue-800 font-medium" 
                        : "hover:bg-blue-50"
                    }`}
                  >
                    <Waves className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Pool Visualization</div>
                      <div className="text-xs text-slate-500">AI pool design visualization</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href="#gallery"
              className="text-slate-300 hover:text-blue-400 transition-colors"
            >
              Gallery
            </a>
            <a
              href="#contact"
              className="text-slate-300 hover:text-blue-400 transition-colors"
            >
              Contact
            </a>
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
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors">
                    <Home className="h-4 w-4" />
                    Roofing & Siding
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pools" className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50">
                    <Waves className="h-4 w-4" />
                    Pool Visualization
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="#gallery" className="w-full">Gallery</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="#contact" className="w-full">Contact</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}