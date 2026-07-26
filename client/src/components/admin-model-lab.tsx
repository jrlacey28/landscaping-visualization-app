import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FlaskConical,
  ImageIcon,
  Loader2,
} from "lucide-react";
import type { Tenant } from "@shared/schema";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const MODELS = [
  {
    id: "gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image",
  },
  {
    id: "gemini-3.1-flash-image",
    label: "Gemini 3.1 Flash Image",
  },
  {
    id: "gemini-3-pro-image",
    label: "Gemini 3 Pro Image",
  },
] as const;

type ComparisonCase = {
  id: string;
  visualizationId: number;
  service: string;
  serviceLabel: string;
  status: string;
  createdAt: string | null;
  styles: string[];
};

type ComparisonResult =
  | {
      modelId: string;
      label: string;
      status: "success";
      durationMs: number;
      imageDataUrl: string;
      mimeType: string;
      prompt: string;
    }
  | {
      modelId: string;
      label: string;
      status: "error";
      durationMs: number;
      error: string;
    };

type ComparisonResponse = {
  generatedAt: string;
  tenant: {
    id: number;
    companyName: string;
    slug: string;
  };
  caseId: string;
  service: string;
  serviceLabel: string;
  referenceImageCount: number;
  prompt: string;
  promptMatchesAcrossModels: boolean;
  results: ComparisonResult[];
};

function formatDuration(durationMs: number) {
  if (durationMs < 1_000) return `${durationMs} ms`;
  return `${(durationMs / 1_000).toFixed(1)} sec`;
}

function formatCaseDate(createdAt: string | null) {
  if (!createdAt) return "Unknown date";
  return new Date(createdAt).toLocaleString();
}

function getRequestError(error: Error) {
  const jsonStart = error.message.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const body = JSON.parse(error.message.slice(jsonStart));
      if (typeof body.error === "string") return body.error;
    } catch {
      // Fall through to the original request error.
    }
  }
  return error.message;
}

export default function AdminModelLab() {
  const [tenantId, setTenantId] = useState("");
  const [caseId, setCaseId] = useState("");

  const tenantsQuery = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const casesQuery = useQuery<{ cases: ComparisonCase[] }>({
    queryKey: ["/api/admin/model-comparison/cases", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/admin/model-comparison/cases?tenantId=${encodeURIComponent(tenantId)}`,
      );
      return response.json();
    },
  });

  const comparisonMutation = useMutation({
    mutationFn: async ({
      selectedTenantId,
      selectedCaseId,
    }: {
      selectedTenantId: number;
      selectedCaseId: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/model-comparison",
        {
          tenantId: selectedTenantId,
          caseId: selectedCaseId,
        },
      );
      return (await response.json()) as ComparisonResponse;
    },
  });

  const cases = casesQuery.data?.cases || [];
  const selectedCase = cases.find((entry) => entry.id === caseId);
  const resultsByModel = new Map(
    comparisonMutation.data?.results.map((result) => [
      result.modelId,
      result,
    ]) || [],
  );
  const completedResultCount =
    comparisonMutation.data?.results.filter(
      (result) => result.status === "success",
    ).length || 0;
  const sourceImageUrl =
    tenantId && caseId
      ? `/api/admin/model-comparison/source?tenantId=${encodeURIComponent(tenantId)}&caseId=${encodeURIComponent(caseId)}`
      : "";

  const resetComparison = () => {
    comparisonMutation.reset();
  };

  const handleTenantChange = (value: string) => {
    setTenantId(value);
    setCaseId("");
    resetComparison();
  };

  const handleCaseChange = (value: string) => {
    setCaseId(value);
    resetComparison();
  };

  const handleGenerate = () => {
    const selectedTenantId = Number(tenantId);
    if (
      !Number.isInteger(selectedTenantId) ||
      !caseId ||
      comparisonMutation.isPending
    ) {
      return;
    }
    comparisonMutation.mutate({
      selectedTenantId,
      selectedCaseId: caseId,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            <CardTitle>Client Model Lab</CardTitle>
          </div>
          <CardDescription>
            Replay a real client generation through three Gemini models using
            the same source image, service selections, production prompt
            builder, and current client reference images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
            These tests do not consume client usage or save duplicate
            generations. Select a previous generation to reuse its source photo
            and choices; the client&apos;s current prompts and references are
            loaded when the comparison starts.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model-lab-client">Client</Label>
              <select
                id="model-lab-client"
                value={tenantId}
                onChange={(event) => handleTenantChange(event.target.value)}
                disabled={
                  tenantsQuery.isLoading || comparisonMutation.isPending
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select a client...</option>
                {(tenantsQuery.data || []).map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.companyName} ({tenant.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-lab-case">Saved generation to replay</Label>
              <select
                id="model-lab-case"
                value={caseId}
                onChange={(event) => handleCaseChange(event.target.value)}
                disabled={
                  !tenantId ||
                  casesQuery.isLoading ||
                  comparisonMutation.isPending
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">
                  {casesQuery.isLoading
                    ? "Loading generations..."
                    : "Select a generation..."}
                </option>
                {cases.map((testCase) => (
                  <option key={testCase.id} value={testCase.id}>
                    {testCase.serviceLabel} —{" "}
                    {formatCaseDate(testCase.createdAt)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tenantId && !casesQuery.isLoading && cases.length === 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              This client has no saved generations to replay. First create one
              generation through their visualizer, then return here.
            </div>
          )}

          {casesQuery.isError && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
              {getRequestError(casesQuery.error)}
            </div>
          )}

          {selectedCase && (
            <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-[220px_1fr]">
              <img
                src={sourceImageUrl}
                alt="Saved source used for the comparison"
                className="h-40 w-full rounded-md bg-muted object-contain"
              />
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">{selectedCase.serviceLabel}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCaseDate(selectedCase.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.styles.length > 0 ? (
                    selectedCase.styles.map((style) => (
                      <Badge key={style} variant="secondary">
                        {style}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Production fallback prompt and saved service settings
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!tenantId || !caseId || comparisonMutation.isPending}
          >
            {comparisonMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running three production prompts...
              </>
            ) : (
              <>
                <FlaskConical className="mr-2 h-4 w-4" />
                Compare 3 Gemini models
              </>
            )}
          </Button>

          {comparisonMutation.isError && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
              {getRequestError(comparisonMutation.error)}
            </div>
          )}
        </CardContent>
      </Card>

      {comparisonMutation.data && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Exact test inputs</CardTitle>
                <CardDescription>
                  {comparisonMutation.data.tenant.companyName} ·{" "}
                  {comparisonMutation.data.serviceLabel} ·{" "}
                  {comparisonMutation.data.referenceImageCount} client
                  reference{" "}
                  {comparisonMutation.data.referenceImageCount === 1
                    ? "image"
                    : "images"}
                </CardDescription>
              </div>
              <Badge
                variant={
                  comparisonMutation.data.promptMatchesAcrossModels
                    ? "default"
                    : completedResultCount === MODELS.length
                      ? "destructive"
                      : "secondary"
                }
              >
                {comparisonMutation.data.promptMatchesAcrossModels ? (
                  <>
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Same prompt verified
                  </>
                ) : completedResultCount < MODELS.length ? (
                  "Prompt verification incomplete"
                ) : (
                  "Prompt mismatch detected"
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <details className="rounded-md border bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                View exact production prompt
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">
                {comparisonMutation.data.prompt}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        {MODELS.map((model) => {
          const result = resultsByModel.get(model.id);

          return (
            <Card key={model.id} className="overflow-hidden">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-lg">{model.label}</CardTitle>
                  {result && (
                    <Badge
                      variant={
                        result.status === "success"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {result.status === "success" ? "Completed" : "Failed"}
                    </Badge>
                  )}
                </div>
                <CardDescription className="break-all font-mono text-xs">
                  {model.id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonMutation.isPending ? (
                  <div className="flex aspect-square items-center justify-center rounded-md bg-muted">
                    <div className="space-y-2 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      <p className="text-sm">Generating...</p>
                    </div>
                  </div>
                ) : result?.status === "success" ? (
                  <div className="space-y-3">
                    <img
                      src={result.imageDataUrl}
                      alt={`Result generated by ${result.label}`}
                      className="aspect-square w-full rounded-md bg-muted object-contain"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(result.durationMs)}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={result.imageDataUrl}
                          download={`${result.modelId}-${Date.now()}.jpg`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : result?.status === "error" ? (
                  <div className="flex aspect-square items-center justify-center rounded-md border border-red-200 bg-red-50 p-6">
                    <div className="space-y-2 text-center">
                      <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
                      <p className="font-medium text-red-900">
                        This model did not produce an image
                      </p>
                      <p className="text-sm text-red-800">{result.error}</p>
                      <p className="text-xs text-red-700">
                        {formatDuration(result.durationMs)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-md border border-dashed bg-muted/30">
                    <div className="space-y-2 text-center text-muted-foreground">
                      <ImageIcon className="mx-auto h-8 w-8" />
                      <p className="text-sm">Result will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
