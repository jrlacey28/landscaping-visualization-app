import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";

// Lazy load components for better performance
const Home = lazy(() => import("@/pages/home"));
const Pools = lazy(() => import("@/pages/pools"));
const Landscape = lazy(() => import("@/pages/landscape"));
const Admin = lazy(() => import("@/pages/admin"));
const Embed = lazy(() => import("@/pages/embed"));
const EmbedRoofing = lazy(() => import("@/pages/embed-roofing"));
const EmbedPools = lazy(() => import("@/pages/embed-pools"));
const EmbedManager = lazy(() => import("@/pages/embed-manager"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const ContactPage = lazy(() => import("@/pages/contact"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    }>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/landscape" component={Landscape} />
        <Route path="/pools" component={Pools} />
        <Route path="/admin" component={Admin} />
        <Route path="/embed" component={Embed} />
        <Route path="/embed-roofing" component={EmbedRoofing} />
        <Route path="/embed-pools" component={EmbedPools} />
        <Route path="/embed-manager" component={EmbedManager} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/contact" component={ContactPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;