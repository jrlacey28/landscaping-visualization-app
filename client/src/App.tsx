import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/hooks/use-auth";
import { lazy, Suspense } from "react";

// Immediate imports for fast navigation
import Home from "@/pages/home";
import PricingPage from "@/pages/pricing";
import ContactPage from "@/pages/contact";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard-simple";
import AcceptInvitation from "@/pages/accept-invitation";
import NotFound from "@/pages/not-found";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";

// Lazy imports for heavy components that slow initial load
const RoofingSiding = lazy(() => import("@/pages/roofing-siding"));
const Pools = lazy(() => import("@/pages/pools"));
const Landscape = lazy(() => import("@/pages/landscape"));
const InteriorDesign = lazy(() => import("@/pages/interior-design"));
const Halloween = lazy(() => import("@/pages/halloween"));
const ChristmasLights = lazy(() => import("@/pages/christmas-lights"));
const Admin = lazy(() => import("@/pages/admin"));
const Embed = lazy(() => import("@/pages/embed"));
const EmbedRoofing = lazy(() => import("@/pages/embed-roofing"));
const EmbedPools = lazy(() => import("@/pages/embed-pools"));
const EmbedManager = lazy(() => import("@/pages/embed-manager"));

// Loading component for lazy routes
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
  </div>
);

// Wrap lazy components with Suspense and ErrorBoundary
const LazyRoute = ({ Component }: { Component: React.LazyExoticComponent<() => JSX.Element> }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/roofing-siding" component={() => <LazyRoute Component={RoofingSiding} />} />
      <Route path="/landscape" component={() => <LazyRoute Component={Landscape} />} />
      <Route path="/pools" component={() => <LazyRoute Component={Pools} />} />
      <Route path="/painting" component={() => <LazyRoute Component={InteriorDesign} />} />
      <Route path="/bathroom-redesign" component={() => <LazyRoute Component={InteriorDesign} />} />
      <Route path="/kitchen-redesign" component={() => <LazyRoute Component={InteriorDesign} />} />
      <Route path="/living-room-design" component={() => <LazyRoute Component={InteriorDesign} />} />
      <Route path="/halloween" component={() => <LazyRoute Component={Halloween} />} />
      <Route path="/christmas-lights" component={() => <LazyRoute Component={ChristmasLights} />} />
      <Route path="/admin" component={() => <LazyRoute Component={Admin} />} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/accept-invitation" component={AcceptInvitation} />
      <Route path="/embed" component={() => <LazyRoute Component={Embed} />} />
      <Route path="/embed-roofing" component={() => <LazyRoute Component={EmbedRoofing} />} />
      <Route path="/embed-pools" component={() => <LazyRoute Component={EmbedPools} />} />
      <Route path="/embed-manager" component={() => <LazyRoute Component={EmbedManager} />} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
