import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Code2, Settings } from "lucide-react";
import EmbedCodeGenerator from "@/components/embed-code-generator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Tenant } from "@shared/schema";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export default function EmbedManager() {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const { data: allTenants = [] as Tenant[], isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  useEffect(() => {
    if (selectedTenantId || allTenants.length === 0) return;
    setSelectedTenantId(allTenants[0].id);
  }, [allTenants, selectedTenantId]);

  const selectedTenant =
    allTenants.find((tenant) => tenant.id === selectedTenantId) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black">
      <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                Embed Manager
              </h1>
              <p className="text-xs text-slate-300">
                Dedicated visualizer embed editor
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = "/admin")}
            className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-200">
            <Code2 className="h-4 w-4" />
            <span className="text-sm font-medium">Website Embed Code</span>
          </div>
          <h2 className="text-3xl font-bold text-white">
            Build and preview client embeds
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Select a client, adjust branding and background options, then copy
            the generated iframe.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-lg border border-white/10 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center gap-2 text-slate-950">
              <Building2 className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold">Client</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="client-select">Select Client</Label>
                <select
                  id="client-select"
                  value={selectedTenantId || ""}
                  onChange={(event) =>
                    setSelectedTenantId(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  className={selectClassName}
                  disabled={isLoading || allTenants.length === 0}
                >
                  {allTenants.length === 0 ? (
                    <option value="">
                      {isLoading ? "Loading clients..." : "No clients found"}
                    </option>
                  ) : (
                    allTenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.companyName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedTenant && (
                <div className="space-y-2 border-t pt-4 text-sm text-slate-600">
                  <div>
                    <span className="font-medium text-slate-900">Slug:</span>{" "}
                    {selectedTenant.slug}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Email:</span>{" "}
                    {selectedTenant.email || "Not set"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Phone:</span>{" "}
                    {selectedTenant.contactPhone ||
                      selectedTenant.phone ||
                      "Not set"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Logo:</span>{" "}
                    {selectedTenant.logoUrl ? "Available" : "Not set"}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {selectedTenant ? (
            <EmbedCodeGenerator tenant={selectedTenant} />
          ) : (
            <div className="rounded-lg border border-white/10 bg-white p-8 text-center shadow-xl">
              <p className="text-sm text-slate-600">
                {isLoading
                  ? "Loading clients..."
                  : "Create or select a client to build an embed."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
