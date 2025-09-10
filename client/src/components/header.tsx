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
import { ChevronDown, Home, Waves, TreePine, User, LogOut } from "lucide-react";
import type { Tenant } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  tenant: Tenant;
}

export default function Header({ tenant }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const currentService = location === "/pools" ? "pools" : "roofing";

  return (
    <header className="relative z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <svg
              className="w-12 h-12 text-white"
              viewBox="0 0 128.37 135.86"
              fill="currentColor"
            >
              <path fill="#fff" d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"/>
              <path fill="#fff" d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"/>
            </svg>
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
                <DropdownMenuItem asChild>
                  <Link 
                    href="/landscape"
                    className="group relative select-none rounded-sm text-sm outline-none hover:bg-slate-100 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors font-medium bg-[#ffffff] text-[#000000]"
                  >
                    <TreePine className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Landscape Design</div>
                      <div className="text-xs text-slate-500 group-hover:text-white">AI landscape visualization</div>
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
                <DropdownMenuItem asChild>
                  <Link href="/landscape" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100">
                    <TreePine className="h-4 w-4" />
                    Landscape Design
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="#gallery" className="w-full">Gallery</a>
                </DropdownMenuItem>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}