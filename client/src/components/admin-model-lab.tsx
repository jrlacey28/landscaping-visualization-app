import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Download,
  FlaskConical,
  ImageIcon,
  Loader2,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

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
  {
    id: "imagen-4.0-ultra-generate-001",
    label: "Imagen 4 Ultra",
  },
] as const;

type ComparisonResult =
  | {
      modelId: string;
      label: string;
      status: "success";
      durationMs: number;
      imageDataUrl: string;
      mimeType: string;
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
  results: ComparisonResult[];
};

function formatDuration(durationMs: number) {
  if (durationMs < 1_000) return `${durationMs} ms`;
  return `${(durationMs / 1_000).toFixed(1)} sec`;
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
  const [prompt, setPrompt] = useState("");

  const comparisonMutation = useMutation({
    mutationFn: async (comparisonPrompt: string) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/model-comparison",
        { prompt: comparisonPrompt },
      );
      return (await response.json()) as ComparisonResponse;
    },
  });

  const resultsByModel = new Map(
    comparisonMutation.data?.results.map((result) => [
      result.modelId,
      result,
    ]) || [],
  );

  const handleGenerate = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || comparisonMutation.isPending) return;
    comparisonMutation.mutate(trimmedPrompt);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            <CardTitle>Image Model Lab</CardTitle>
          </div>
          <CardDescription>
            Send one identical text prompt to all four image models and compare
            their unmodified results side by side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This test is prompt-only. Imagen 4 Ultra does not accept a
                reference image in this generation API and Google has scheduled
                this model to shut down on August 17, 2026.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-comparison-prompt">Shared prompt</Label>
            <Textarea
              id="model-comparison-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={6_000}
              rows={7}
              placeholder="Describe the image you want every model to generate..."
              disabled={comparisonMutation.isPending}
            />
            <div className="flex flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
              <span>
                The four images are displayed here only; they are not saved to
                client projects.
              </span>
              <span>{prompt.length.toLocaleString()} / 6,000</span>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || comparisonMutation.isPending}
          >
            {comparisonMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating all four...
              </>
            ) : (
              <>
                <FlaskConical className="mr-2 h-4 w-4" />
                Generate 4 comparisons
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

      <div className="grid gap-5 lg:grid-cols-2">
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
                        result.status === "success" ? "default" : "destructive"
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
                          download={`${result.modelId}-${Date.now()}.${result.mimeType.includes("png") ? "png" : "jpg"}`}
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
