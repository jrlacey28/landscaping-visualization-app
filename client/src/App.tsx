import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";

// Regular imports for instant page navigation
import Home from "@/pages/home";
import Pools from "@/pages/pools";
import Landscape from "@/pages/landscape";
import Admin from "@/pages/admin";
import Embed from "@/pages/embed";
import EmbedRoofing from "@/pages/embed-roofing";
import EmbedPools from "@/pages/embed-pools";
import EmbedManager from "@/pages/embed-manager";
import PricingPage from "@/pages/pricing";
import ContactPage from "@/pages/contact";
import NotFound from "@/pages/not-found";

// Wrap components with error boundaries for better error handling
const SafePools = () => (
  <ErrorBoundary>
    <Pools />
  </ErrorBoundary>
);

const SafeLandscape = () => (
  <ErrorBoundary>
    <Landscape />
  </ErrorBoundary>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/landscape" component={SafeLandscape} />
      <Route path="/pools" component={SafePools} />
      <Route path="/admin" component={Admin} />
      <Route path="/embed" component={Embed} />
      <Route path="/embed-roofing" component={EmbedRoofing} />
      <Route path="/embed-pools" component={EmbedPools} />
      <Route path="/embed-manager" component={EmbedManager} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route component={NotFound} />
    </Switch>
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