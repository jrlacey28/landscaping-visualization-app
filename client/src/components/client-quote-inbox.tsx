import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarDays,
  ExternalLink,
  ImageIcon,
  Inbox,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";

type QuoteLeadResponse = {
  tenant: {
    id: number;
    companyName: string;
  };
  leads: Lead[];
};

function serviceLabel(service: string | null) {
  const labels: Record<string, string> = {
    "roofing-siding": "Exterior",
    pools: "Pool",
    landscape: "Landscape",
    interior: "Interior",
    painting: "Painting",
    bathroom: "Bathroom",
    kitchen: "Kitchen",
    "living-room": "Living Room",
  };

  return labels[service || ""] || service?.replace(/[-_]/g, " ") || "Quote";
}

function selectionSummary(selectedStyles: unknown) {
  if (!selectedStyles || typeof selectedStyles !== "object" || Array.isArray(selectedStyles)) return [];

  return Object.entries(selectedStyles as Record<string, any>)
    .flatMap(([category, selection]) => {
      if (!selection) return [];
      if (typeof selection === "string") return [`${category}: ${selection}`];
      if (typeof selection !== "object" || selection.enabled === false) return [];

      const value = selection.type || selection.style || selection.design || selection.value;
      return value ? [`${category}: ${value}`] : [];
    })
    .slice(0, 4);
}

export default function ClientQuoteInbox() {
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<QuoteLeadResponse>({
    queryKey: ["/api/tenant/my-tenant/quote-leads"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await apiRequest(
        "GET",
        "/api/tenant/my-tenant/quote-leads",
        undefined,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      return response.json();
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const leads = data?.leads || [];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thisMonth = leads.filter((lead) => lead.createdAt && new Date(lead.createdAt) >= startOfMonth).length;
  const withDesign = leads.filter((lead) => lead.generatedImageUrl || lead.originalImageUrl).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Quote Leads</h2>
          <p className="text-sm text-gray-600">
            Customer requests submitted through your embedded visualizers.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">All quotes</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{leads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">This month</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{thisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">With designs</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{withDesign}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-700">Quotes could not be loaded</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : "Please try again."}</CardDescription>
          </CardHeader>
        </Card>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Inbox className="h-7 w-7" />
            </span>
            <h3 className="font-semibold text-gray-950">No quote requests yet</h3>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              New popup-form submissions will appear here for the account owner and every active team member.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {leads.map((lead) => {
            const previewImageUrl = lead.generatedImageUrl || lead.originalImageUrl;
            const selections = selectionSummary(lead.selectedStyles);

            return (
              <Card key={lead.id} className="overflow-hidden">
                <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="relative min-h-44 bg-slate-100 sm:min-h-full">
                    {previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        alt={`Design submitted by ${lead.firstName} ${lead.lastName}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-950">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <Badge variant="secondary" className="mt-2 capitalize">
                          {serviceLabel(lead.service)}
                        </Badge>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : "Recently"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-2 hover:text-gray-950 hover:underline">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-2 hover:text-gray-950 hover:underline">
                          <Phone className="h-4 w-4 shrink-0" />
                          {lead.phone}
                        </a>
                      )}
                      {lead.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {lead.location}
                        </p>
                      )}
                    </div>

                    {lead.projectDetails && (
                      <p className="mt-4 border-t pt-3 text-sm leading-6 text-gray-700">{lead.projectDetails}</p>
                    )}

                    {selections.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selections.map((selection) => (
                          <span key={selection} className="rounded-md bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                            {selection.replace(/[_-]/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Your project quote request")}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Email customer
                        </a>
                      </Button>
                      {previewImageUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a href={previewImageUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View design
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
