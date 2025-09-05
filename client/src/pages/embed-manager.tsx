
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Eye, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tenant } from "@shared/schema";

export default function EmbedManager() {
  const { toast } = useToast();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [embedConfig, setEmbedConfig] = useState({
    primaryColor: "#10b981",
    secondaryColor: "#059669",
    showHeader: true,
    width: "100%",
    height: "800px",
  });

  const { data: allTenants = [] as Tenant[] } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  // Set first tenant as default
  useEffect(() => {
    if (allTenants.length > 0 && !selectedTenant) {
      setSelectedTenant(allTenants[0]);
    }
  }, [allTenants, selectedTenant]);

  const generateEmbedUrl = (embedType: "landscape" | "roofing" | "pools") => {
    if (!selectedTenant) return "";
    
    const baseUrl = window.location.origin;
    const embedPath = embedType === "landscape" ? "/embed" : `/embed-${embedType}`;
    
    const params = new URLSearchParams({
      tenant: selectedTenant.slug,
      companyName: selectedTenant.companyName,
      primaryColor: encodeURIComponent(embedConfig.primaryColor),
      secondaryColor: encodeURIComponent(embedConfig.secondaryColor),
      showHeader: embedConfig.showHeader.toString(),
      contactPhone: encodeURIComponent(selectedTenant.phone || '(555) 123-4567')
    });

    return `${baseUrl}${embedPath}?${params.toString()}`;
  };

  const generateEmbedCode = (embedType: "landscape" | "roofing" | "pools") => {
    const embedUrl = generateEmbedUrl(embedType);
    const title = embedType === "landscape" ? "Landscape Visualizer" : 
                  embedType === "roofing" ? "Roofing & Siding Visualizer" : 
                  "Pool Visualizer";
    
    return `<iframe
  src="${embedUrl}"
  width="${embedConfig.width}"
  height="${embedConfig.height}"
  style="border: none; border-radius: 8px;"
  title="${selectedTenant?.companyName} ${title}"
></iframe>`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const openPreview = (embedType: "landscape" | "roofing" | "pools") => {
    const embedUrl = generateEmbedUrl(embedType);
    window.open(embedUrl, '_blank');
  };

  if (!selectedTenant) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold">Embed Manager</h1>
              <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
                Back to Admin
              </Button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Embed Manager</h1>
            </div>
            <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
              Back to Admin
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Client Selector & Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client-select">Client</Label>
                  <select
                    id="client-select"
                    value={selectedTenant?.id || ''}
                    onChange={(e) => {
                      const tenantId = parseInt(e.target.value);
                      const tenant = allTenants.find(t => t.id === tenantId);
                      setSelectedTenant(tenant || null);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {allTenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedTenant && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm"><strong>Slug:</strong> {selectedTenant.slug}</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedTenant.email}</p>
                    <p className="text-sm"><strong>Phone:</strong> {selectedTenant.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Embed Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={embedConfig.primaryColor}
                    onChange={(e) => setEmbedConfig({ ...embedConfig, primaryColor: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={embedConfig.secondaryColor}
                    onChange={(e) => setEmbedConfig({ ...embedConfig, secondaryColor: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    value={embedConfig.width}
                    onChange={(e) => setEmbedConfig({ ...embedConfig, width: e.target.value })}
                    placeholder="100% or 800px"
                  />
                </div>
                
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={embedConfig.height}
                    onChange={(e) => setEmbedConfig({ ...embedConfig, height: e.target.value })}
                    placeholder="800px"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showHeader"
                    checked={embedConfig.showHeader}
                    onChange={(e) => setEmbedConfig({ ...embedConfig, showHeader: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showHeader" className="text-sm">Show Header</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Embed Types */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="landscape" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="landscape">🌳 Landscape</TabsTrigger>
                <TabsTrigger value="roofing">🏠 Roofing</TabsTrigger>
                <TabsTrigger value="pools">🏊 Pools</TabsTrigger>
              </TabsList>

              {/* Landscape Embed */}
              <TabsContent value="landscape" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        🌳 Landscape Visualizer
                        <Badge variant="secondary">Embed</Badge>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPreview("landscape")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(generateEmbedUrl("landscape"), "URL")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Embed URL</Label>
                      <div className="bg-gray-50 p-3 rounded-md text-sm font-mono break-all">
                        {generateEmbedUrl("landscape")}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Embed Code</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generateEmbedCode("landscape"), "Embed Code")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Code
                        </Button>
                      </div>
                      <textarea
                        className="w-full p-3 bg-gray-50 rounded-md text-sm font-mono"
                        rows={6}
                        readOnly
                        value={generateEmbedCode("landscape")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Roofing Embed */}
              <TabsContent value="roofing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        🏠 Roofing & Siding Visualizer
                        <Badge variant="secondary">Embed</Badge>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPreview("roofing")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(generateEmbedUrl("roofing"), "URL")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Embed URL</Label>
                      <div className="bg-gray-50 p-3 rounded-md text-sm font-mono break-all">
                        {generateEmbedUrl("roofing")}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Embed Code</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generateEmbedCode("roofing"), "Embed Code")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Code
                        </Button>
                      </div>
                      <textarea
                        className="w-full p-3 bg-gray-50 rounded-md text-sm font-mono"
                        rows={6}
                        readOnly
                        value={generateEmbedCode("roofing")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pools Embed */}
              <TabsContent value="pools" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        🏊 Pool Visualizer
                        <Badge variant="secondary">Embed</Badge>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPreview("pools")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(generateEmbedUrl("pools"), "URL")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Embed URL</Label>
                      <div className="bg-gray-50 p-3 rounded-md text-sm font-mono break-all">
                        {generateEmbedUrl("pools")}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Embed Code</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generateEmbedCode("pools"), "Embed Code")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Code
                        </Button>
                      </div>
                      <textarea
                        className="w-full p-3 bg-gray-50 rounded-md text-sm font-mono"
                        rows={6}
                        readOnly
                        value={generateEmbedCode("pools")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
