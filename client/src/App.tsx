import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Pools from "@/pages/pools";
import Landscape from "@/pages/landscape";
import Admin from "@/pages/admin";
import Embed from "@/pages/embed";
import EmbedRoofing from "@/pages/embed-roofing";
import EmbedPools from "@/pages/embed-pools";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/landscape" component={Landscape} />
      <Route path="/pools" component={Pools} />
      <Route path="/admin" component={Admin} />
      <Route path="/embed" component={Embed} />
      <Route path="/embed-roofing" component={EmbedRoofing} />
      <Route path="/embed-pools" component={EmbedPools} />
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