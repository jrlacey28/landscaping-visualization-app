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
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                viewBox="0 0 129 133.08"
                fill="currentColor"
              >
                <path fill="#fff" d="M127.96,67.85L64.71,4.39,1.05,67.84c-1.4,1.4-1.41,3.67,0,5.07,1.4,1.4,3.67,1.41,5.07,0l11.8-11.77v68.36c0,1.98,1.6,3.58,3.58,3.58h25.08c1.98,0,3.58-1.6,3.58-3.58v-28.67c0-3.96,3.21-7.17,7.17-7.17h14.33c3.96,0,7.17,3.21,7.17,7.17v28.67c0,1.98,1.6,3.58,3.58,3.58h25.08c1.98,0,3.58-1.6,3.58-3.58V61.08l11.8,11.83c1.4,1.4,3.67,1.41,5.07,0,1.4-1.4,1.41-3.67,0-5.07h.02Z"/>
                <path fill="#fff" d="M108.72,0c-1.61,12.38-2.91,13.68-15.29,15.29,12.38,1.61,13.68,2.91,15.29,15.29,1.61-12.38,2.91-13.68,15.29-15.29-12.38-1.61-13.68-2.91-15.29-15.29Z"/>
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
                    className="group relative select-none rounded-sm text-sm outline-none hover:bg-slate-100 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors font-medium bg-[#ffffff] text-[#000000]"
                  >
                    <Home className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Roofing & Siding</div>
                      <div className="text-xs text-slate-500 group-hover:text-white">AI home exterior visualization</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href="/pools"
                    className="group relative select-none rounded-sm text-sm outline-none hover:bg-slate-100 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors font-medium bg-[#ffffff] text-[#000000]"
                  >
                    <Waves className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Pool Visualization</div>
                      <div className="text-xs text-slate-500 group-hover:text-white">AI pool design visualization</div>
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
                  <Link href="/" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors">
                    <Home className="h-4 w-4" />
                    Roofing & Siding
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pools" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100">
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