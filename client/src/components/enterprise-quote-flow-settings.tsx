import { useEffect, useState } from "react";
import { Loader2, Save, Send, Webhook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type QuoteFlowSettings = {
  embedRequireQuoteAfterLimit: boolean;
  embedVisitorLimit: number;
  embedCtaText: string;
  embedCtaPhone: string;
  embedCtaUrl: string;
  embedQuoteDestinationType: "email" | "phone" | "link";
  embedQuoteRecipientEmail: string;
  embedQuoteSuccessRedirectUrl: string;
  embedQuoteGateTitle: string;
  embedQuoteGateMessage: string;
  embedQuoteFormTitle: string;
  embedQuoteFormMessage: string;
  embedQuoteIncludeImages: boolean;
  embedQuoteCrmEnabled: boolean;
  embedQuoteCrmWebhookUrl: string;
};

function settingsFromTenant(tenant: any): QuoteFlowSettings {
  return {
    embedRequireQuoteAfterLimit: Boolean(tenant?.embedRequireQuoteAfterLimit),
    embedVisitorLimit: Math.max(Number(tenant?.embedVisitorLimit ?? 3), 0),
    embedCtaText: tenant?.embedCtaText || "Get Free Quote",
    embedCtaPhone: tenant?.embedCtaPhone || tenant?.contactPhone || tenant?.phone || "",
    embedCtaUrl: tenant?.embedCtaUrl || "",
    embedQuoteDestinationType: tenant?.embedQuoteDestinationType || "email",
    embedQuoteRecipientEmail: tenant?.embedQuoteRecipientEmail || tenant?.email || "",
    embedQuoteSuccessRedirectUrl: tenant?.embedQuoteSuccessRedirectUrl || "",
    embedQuoteGateTitle: tenant?.embedQuoteGateTitle || "Ready for a free quote?",
    embedQuoteGateMessage:
      tenant?.embedQuoteGateMessage ||
      "You've reached the free visualization limit. Request a quote to keep planning your project.",
    embedQuoteFormTitle: tenant?.embedQuoteFormTitle || "Get your free quote",
    embedQuoteFormMessage:
      tenant?.embedQuoteFormMessage ||
      "Send your project details and the team will follow up with a quote.",
    embedQuoteIncludeImages: tenant?.embedQuoteIncludeImages !== false,
    embedQuoteCrmEnabled: tenant?.embedCustomizations?.quoteCrm?.enabled === true,
    embedQuoteCrmWebhookUrl: tenant?.embedCustomizations?.quoteCrm?.webhookUrl || "",
  };
}

export default function EnterpriseQuoteFlowSettings({ tenant }: { tenant: any }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<QuoteFlowSettings>(() => settingsFromTenant(tenant));
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingCrm, setIsTestingCrm] = useState(false);

  useEffect(() => {
    setSettings(settingsFromTenant(tenant));
  }, [tenant]);

  const update = <K extends keyof QuoteFlowSettings>(key: K, value: QuoteFlowSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await apiRequest(
        "PATCH",
        "/api/tenant/my-tenant/quote-flow",
        settings,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const updatedTenant = await response.json();
      setSettings(settingsFromTenant(updatedTenant));
      await queryClient.invalidateQueries({ queryKey: ["/api/tenant/my-tenant"] });
      window.dispatchEvent(new CustomEvent("dreambuilder:quote-flow-saved"));
      toast({
        title: "Quote flow saved",
        description: "Your embedded visualizers will use these settings immediately.",
      });
    } catch (error: any) {
      toast({
        title: "Could not save quote flow",
        description: error.message || "Please check the settings and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testCrmConnection = async () => {
    if (!settings.embedQuoteCrmWebhookUrl.trim()) {
      toast({
        title: "CRM webhook required",
        description: "Enter the HTTPS webhook URL supplied by your CRM or automation provider.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingCrm(true);
    try {
      const token = localStorage.getItem("auth_token");
      await apiRequest(
        "POST",
        "/api/tenant/my-tenant/quote-crm/test",
        { webhookUrl: settings.embedQuoteCrmWebhookUrl },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      toast({
        title: "CRM connection works",
        description: "Your webhook accepted the DreamBuilder test quote.",
      });
    } catch (error: any) {
      toast({
        title: "CRM connection failed",
        description: error.message || "The webhook did not accept the test quote.",
        variant: "destructive",
      });
    } finally {
      setIsTestingCrm(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitor Quote Flow</CardTitle>
        <CardDescription>
          Control the free visitor limit, quote prompt, form copy, and the single lead destination used by every enterprise embed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-md border p-3 md:col-span-2">
            <div>
              <Label htmlFor="accountQuoteGate">Require a quote after the free limit</Label>
              <p className="text-xs text-muted-foreground">
                Completed visualizations count toward the visitor limit; failed edits do not.
              </p>
            </div>
            <Switch
              id="accountQuoteGate"
              checked={settings.embedRequireQuoteAfterLimit}
              onCheckedChange={(checked) => update("embedRequireQuoteAfterLimit", checked)}
            />
          </div>

          <div>
            <Label htmlFor="accountVisitorLimit">Free visualizations per visitor</Label>
            <Input
              id="accountVisitorLimit"
              type="number"
              min={0}
              max={100}
              value={settings.embedVisitorLimit}
              onChange={(event) => update("embedVisitorLimit", Math.max(Number(event.target.value) || 0, 0))}
            />
          </div>
          <div>
            <Label htmlFor="accountQuoteButton">Quote button text</Label>
            <Input
              id="accountQuoteButton"
              value={settings.embedCtaText}
              onChange={(event) => update("embedCtaText", event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="accountQuoteDestination">Quote destination</Label>
            <select
              id="accountQuoteDestination"
              value={settings.embedQuoteDestinationType}
              onChange={(event) =>
                update("embedQuoteDestinationType", event.target.value as QuoteFlowSettings["embedQuoteDestinationType"])
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="email">Popup form + email</option>
              <option value="phone">Phone call</option>
              <option value="link">External link</option>
            </select>
          </div>

          {settings.embedQuoteDestinationType === "email" && (
            <div>
              <Label htmlFor="accountQuoteEmail">Quote recipient email</Label>
              <Input
                id="accountQuoteEmail"
                type="email"
                value={settings.embedQuoteRecipientEmail}
                onChange={(event) => update("embedQuoteRecipientEmail", event.target.value)}
                placeholder="quotes@company.com"
              />
            </div>
          )}
          {settings.embedQuoteDestinationType === "phone" && (
            <div>
              <Label htmlFor="accountQuotePhone">Quote phone number</Label>
              <Input
                id="accountQuotePhone"
                type="tel"
                value={settings.embedCtaPhone}
                onChange={(event) => update("embedCtaPhone", event.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          )}
          {settings.embedQuoteDestinationType === "link" && (
            <div>
              <Label htmlFor="accountQuoteLink">External quote URL</Label>
              <Input
                id="accountQuoteLink"
                type="url"
                value={settings.embedCtaUrl}
                onChange={(event) => update("embedCtaUrl", event.target.value)}
                placeholder="https://company.com/free-quote"
              />
            </div>
          )}
          <div>
            <Label htmlFor="accountSuccessRedirect">Form success redirect (optional)</Label>
            <Input
              id="accountSuccessRedirect"
              type="url"
              value={settings.embedQuoteSuccessRedirectUrl}
              onChange={(event) => update("embedQuoteSuccessRedirectUrl", event.target.value)}
              placeholder="https://company.com/thank-you"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="accountGateTitle">Limit prompt title</Label>
            <Input
              id="accountGateTitle"
              value={settings.embedQuoteGateTitle}
              onChange={(event) => update("embedQuoteGateTitle", event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="accountFormTitle">Quote form title</Label>
            <Input
              id="accountFormTitle"
              value={settings.embedQuoteFormTitle}
              onChange={(event) => update("embedQuoteFormTitle", event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="accountGateMessage">Limit prompt message</Label>
            <Textarea
              id="accountGateMessage"
              rows={3}
              value={settings.embedQuoteGateMessage}
              onChange={(event) => update("embedQuoteGateMessage", event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="accountFormMessage">Quote form message</Label>
            <Textarea
              id="accountFormMessage"
              rows={3}
              value={settings.embedQuoteFormMessage}
              onChange={(event) => update("embedQuoteFormMessage", event.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <Label htmlFor="accountIncludeImage">Attach the latest visualization</Label>
            <p className="text-xs text-muted-foreground">
              Include the visitor's latest completed design in email notifications.
            </p>
          </div>
          <Switch
            id="accountIncludeImage"
            checked={settings.embedQuoteIncludeImages}
            onCheckedChange={(checked) => update("embedQuoteIncludeImages", checked)}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <Webhook className="h-5 w-5" />
              </span>
              <div>
                <Label htmlFor="accountCrmEnabled" className="text-base">CRM delivery</Label>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                  Send every submitted quote to a CRM webhook. Compatible with Zapier, Make, CRM workflows, and custom HTTPS endpoints.
                </p>
              </div>
            </div>
            <Switch
              id="accountCrmEnabled"
              checked={settings.embedQuoteCrmEnabled}
              onCheckedChange={(checked) => update("embedQuoteCrmEnabled", checked)}
            />
          </div>

          {settings.embedQuoteCrmEnabled && (
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <div>
                <Label htmlFor="accountCrmWebhook">CRM webhook URL</Label>
                <Input
                  id="accountCrmWebhook"
                  type="url"
                  value={settings.embedQuoteCrmWebhookUrl}
                  onChange={(event) => update("embedQuoteCrmWebhookUrl", event.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  CRM delivery runs after the popup quote form is submitted. Phone and external-link destinations bypass the form.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={testCrmConnection}
                  disabled={isTestingCrm}
                  className="shrink-0"
                >
                  {isTestingCrm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isTestingCrm ? "Sending test..." : "Send test quote"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button type="button" onClick={save} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Quote Flow"}
        </Button>
      </CardContent>
    </Card>
  );
}
