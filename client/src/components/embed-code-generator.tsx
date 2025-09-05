
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Copy, CheckCircle } from "lucide-react";

interface EmbedCodeGeneratorProps {
  tenant: any;
}

export default function EmbedCodeGenerator({ tenant }: EmbedCodeGeneratorProps) {
  const [config, setConfig] = useState({
    width: "100%",
    height: "100%",
    showHeader: true,
    primaryColor: tenant.primaryColor || "#10b981",
    secondaryColor: tenant.secondaryColor || "#059669",
    companyName: tenant.companyName,
    contactPhone: tenant.contactPhone || tenant.phone || "",
    visualizerType: "landscape" as "landscape" | "roofing" | "pools"
  });
  
  const [copied, setCopied] = useState(false);
  
  const baseUrl = window.location.origin;
  
  // Choose the right URL based on visualizer type
  const getEmbedUrl = () => {
    const params = new URLSearchParams({
      tenant: tenant.slug,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      companyName: config.companyName,
      contactPhone: config.contactPhone,
      showHeader: config.showHeader.toString()
    });

    switch (config.visualizerType) {
      case 'landscape':
        return `${baseUrl}/embed?${params.toString()}`;
      case 'roofing':
        return `${baseUrl}/embed-roofing?${params.toString()}`;
      case 'pools':
        return `${baseUrl}/embed-pools?${params.toString()}`;
      default:
        return `${baseUrl}/embed?${params.toString()}`;
    }
  };

  const embedUrl = getEmbedUrl();
  
  const iframeCode = `<iframe 
  src="${embedUrl}"
  width="${config.width}"
  height="${config.height}"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);"
  allowfullscreen>
</iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Customize Your Embed</h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <Label htmlFor="visualizerType">Visualizer Type</Label>
            <select
              id="visualizerType"
              value={config.visualizerType}
              onChange={(e) => setConfig({ ...config, visualizerType: e.target.value as "landscape" | "roofing" | "pools" })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="landscape">Landscape Visualizer</option>
              <option value="roofing">Roofing & Siding Visualizer</option>
              <option value="pools">Pool Visualizer</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              value={config.width}
              onChange={(e) => setConfig({ ...config, width: e.target.value })}
              placeholder="100% or 800px"
            />
          </div>
          
          <div>
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              value={config.height}
              onChange={(e) => setConfig({ ...config, height: e.target.value })}
              placeholder="100% or 800px"
            />
          </div>
          
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input
              id="primaryColor"
              type="color"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <Input
              id="secondaryColor"
              type="color"
              value={config.secondaryColor}
              onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              placeholder="Your Company Name"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="contactPhone">Contact Phone for Quote Button</Label>
            <Input
              id="contactPhone"
              value={config.contactPhone}
              onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          
          <div className="md:col-span-2 flex items-center space-x-2">
            <Switch
              id="showHeader"
              checked={config.showHeader}
              onCheckedChange={(checked) => setConfig({ ...config, showHeader: checked })}
            />
            <Label htmlFor="showHeader">Show header with company name</Label>
          </div>
        </div>
        
        <div className="mb-4">
          <Label>Embed Code</Label>
          <div className="relative">
            <Textarea
              value={iframeCode}
              readOnly
              className="font-mono text-sm bg-gray-50 min-h-[120px] resize-none"
            />
            <Button
              size="sm"
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
              variant={copied ? "default" : "outline"}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-blue-50">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="bg-white rounded border" style={{ height: "300px" }}>
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: "4px" }}
              title="Embed Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
