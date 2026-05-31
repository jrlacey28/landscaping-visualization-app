import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Eye, Folder, ImageIcon, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { downloadImageWithWatermark } from "@/lib/download-utils";
import { apiRequest } from "@/lib/queryClient";

type GenerationService = "roofing-siding" | "interior" | "pools" | "landscape" | "halloween" | "christmas-lights";

interface GenerationProject {
  id: number;
  name: string;
  address?: string | null;
  notes?: string | null;
  coverImageUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  generationCount: number;
  lastSavedAt?: string | null;
}

interface GenerationAssignment {
  id: number;
  projectId: number;
  projectName: string;
  createdAt?: string | null;
}

interface SavedGeneration {
  id: string;
  visualizationId: number;
  service: GenerationService;
  serviceLabel: string;
  status: string;
  originalImageUrl?: string | null;
  generatedImageUrl?: string | null;
  hasOriginalImage?: boolean;
  hasGeneratedImage?: boolean;
  hasImage?: boolean;
  createdAt?: string | null;
  styles: string[];
  assignments: GenerationAssignment[];
}

interface GenerationImages {
  originalImageUrl?: string | null;
  generatedImageUrl?: string | null;
}

interface GenerationThumbnail {
  thumbnailImageUrl?: string | null;
}

interface GenerationsResponse {
  generations: SavedGeneration[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  partial?: boolean;
}

const NO_PROJECT_VALUE = "none";
const MAX_VISIBLE_STYLES = 2;
const MAX_VISIBLE_ASSIGNMENTS = 2;
const GENERATIONS_PAGE_SIZE = 10;

const serviceOptions: Array<{ value: "all" | GenerationService; label: string }> = [
  { value: "all", label: "All services" },
  { value: "roofing-siding", label: "Roofing & Siding" },
  { value: "interior", label: "Interior" },
  { value: "pools", label: "Pools" },
  { value: "landscape", label: "Landscape" },
  { value: "halloween", label: "Halloween" },
  { value: "christmas-lights", label: "Christmas Lights" },
];

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCount(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function humanReadableStatus(status: string) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function toFileSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getGenerationImageUrl(images?: GenerationImages | null) {
  return images?.generatedImageUrl || images?.originalImageUrl || "";
}

function generationHasImage(generation: SavedGeneration) {
  return Boolean(
    generation.hasImage ??
      generation.hasGeneratedImage ??
      generation.hasOriginalImage ??
      generation.generatedImageUrl ??
      generation.originalImageUrl
  );
}

function getGenerationFileName(generation: SavedGeneration) {
  const service = toFileSlug(generation.serviceLabel || generation.service);
  return `dreambuilder-${service || "generation"}-${generation.visualizationId}.jpg`;
}

export default function SavedGenerations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [serviceFilter, setServiceFilter] = useState<"all" | GenerationService>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [previewGeneration, setPreviewGeneration] = useState<SavedGeneration | null>(null);
  const [previewImages, setPreviewImages] = useState<GenerationImages | null>(null);
  const [newProject, setNewProject] = useState({ name: "", address: "", notes: "" });
  const [selectedProjects, setSelectedProjects] = useState<Record<string, string>>({});
  const [generationImages, setGenerationImages] = useState<Record<string, GenerationImages>>({});
  const [generationThumbnails, setGenerationThumbnails] = useState<Record<string, string>>({});
  const [loadingImageIds, setLoadingImageIds] = useState<Record<string, boolean>>({});
  const [loadingThumbnailIds, setLoadingThumbnailIds] = useState<Record<string, boolean>>({});
  const requestedThumbnailIds = useRef(new Set<string>());

  const projectsQuery = useQuery<{ projects: GenerationProject[] }>({
    queryKey: ["generation-projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/generation-projects", undefined, {
        headers: authHeaders(),
      });
      return response.json();
    },
  });

  const generationsQuery = useQuery<GenerationsResponse>({
    queryKey: ["generations", serviceFilter, projectFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serviceFilter !== "all") params.set("service", serviceFilter);
      if (projectFilter !== "all") params.set("projectId", projectFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(GENERATIONS_PAGE_SIZE));

      const queryString = params.toString();
      const response = await apiRequest("GET", `/api/generations${queryString ? `?${queryString}` : ""}`, undefined, {
        headers: authHeaders(),
      });
      return response.json();
    },
  });

  const projects = projectsQuery.data?.projects || [];
  const generations = generationsQuery.data?.generations || [];
  const totalGenerations = generationsQuery.data?.total ?? generations.length;
  const totalPages = generationsQuery.data?.totalPages ?? 1;
  const serverPage = generationsQuery.data?.page ?? currentPage;
  const isLoading = projectsQuery.isLoading || generationsQuery.isLoading;
  const hasError = projectsQuery.isError || generationsQuery.isError;

  useEffect(() => {
    setCurrentPage(1);
  }, [serviceFilter, projectFilter]);

  useEffect(() => {
    if (!generationsQuery.data) return;
    if (currentPage !== serverPage) {
      setCurrentPage(serverPage);
    }
  }, [currentPage, generationsQuery.data, serverPage]);

  useEffect(() => {
    let cancelled = false;

    const loadVisibleThumbnails = async () => {
      for (const generation of generations) {
        if (
          cancelled ||
          !generationHasImage(generation) ||
          generationThumbnails[generation.id] ||
          requestedThumbnailIds.current.has(generation.id)
        ) {
          continue;
        }

        requestedThumbnailIds.current.add(generation.id);
        setLoadingThumbnailIds((current) => ({ ...current, [generation.id]: true }));

        try {
          const response = await apiRequest(
            "GET",
            `/api/generations/${generation.service}/${generation.visualizationId}/thumbnail`,
            undefined,
            { headers: authHeaders() }
          );
          const data = (await response.json()) as GenerationThumbnail;
          if (!cancelled && data.thumbnailImageUrl) {
            setGenerationThumbnails((current) => ({ ...current, [generation.id]: data.thumbnailImageUrl || "" }));
          }
        } catch (error) {
          console.error("Generation thumbnail not loaded:", error);
        } finally {
          setLoadingThumbnailIds((current) => {
            const next = { ...current };
            delete next[generation.id];
            return next;
          });
        }
      }
    };

    void loadVisibleThumbnails();

    return () => {
      cancelled = true;
    };
  }, [generations]);

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generation-projects", newProject, {
        headers: authHeaders(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["generation-projects"] });
      setNewProject({ name: "", address: "", notes: "" });
      setProjectDialogOpen(false);
      toast({
        title: "Project created",
        description: "New generations can be added to it now.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Project not created",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveGenerationMutation = useMutation({
    mutationFn: async ({ projectId, generation }: { projectId: string; generation: SavedGeneration }) => {
      const response = await apiRequest(
        "POST",
        `/api/generation-projects/${projectId}/generations`,
        {
          service: generation.service,
          visualizationId: generation.visualizationId,
        },
        { headers: authHeaders() }
      );
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["generation-projects"] });
      queryClient.invalidateQueries({ queryKey: ["generations"] });
      setSelectedProjects((current) => {
        const next = { ...current };
        delete next[variables.generation.id];
        return next;
      });
      toast({
        title: "Added to project",
        description: "The generation is saved in your dashboard.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation not saved",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeGenerationMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const response = await apiRequest("DELETE", `/api/project-generations/${assignmentId}`, undefined, {
        headers: authHeaders(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generation-projects"] });
      queryClient.invalidateQueries({ queryKey: ["generations"] });
      toast({
        title: "Removed from project",
        description: "The generation remains in your library.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not remove generation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = (event: FormEvent) => {
    event.preventDefault();
    createProjectMutation.mutate();
  };

  const fetchGenerationImages = async (generation: SavedGeneration) => {
    const cachedImages = generationImages[generation.id];
    if (cachedImages) {
      return cachedImages;
    }

    setLoadingImageIds((current) => ({ ...current, [generation.id]: true }));

    try {
      const response = await apiRequest(
        "GET",
        `/api/generations/${generation.service}/${generation.visualizationId}/image`,
        undefined,
        { headers: authHeaders() }
      );
      const images = (await response.json()) as GenerationImages;
      setGenerationImages((current) => ({ ...current, [generation.id]: images }));
      return images;
    } finally {
      setLoadingImageIds((current) => {
        const next = { ...current };
        delete next[generation.id];
        return next;
      });
    }
  };

  const handlePreviewGeneration = async (generation: SavedGeneration) => {
    setPreviewGeneration(generation);
    setPreviewImages(null);

    try {
      const images = await fetchGenerationImages(generation);
      setPreviewImages(images);
    } catch (error) {
      setPreviewGeneration(null);
      toast({
        title: "Preview not loaded",
        description: error instanceof Error ? error.message : "The image could not be loaded.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadGeneration = async (generation: SavedGeneration) => {
    let images: GenerationImages;
    try {
      images = await fetchGenerationImages(generation);
    } catch (error) {
      toast({
        title: "Download not started",
        description: error instanceof Error ? error.message : "The image could not be loaded.",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = getGenerationImageUrl(images);
    if (!imageUrl) {
      toast({
        title: "Image not available",
        description: "This generation does not have an image to download yet.",
        variant: "destructive",
      });
      return;
    }

    await downloadImageWithWatermark({
      imageUrl,
      fileName: getGenerationFileName(generation),
      user,
      subscription: user?.subscription,
    });
  };

  const previewImageUrl = getGenerationImageUrl(previewImages);
  const isPreviewImageLoading = previewGeneration ? Boolean(loadingImageIds[previewGeneration.id]) : false;
  const pageStart = totalGenerations === 0 ? 0 : (serverPage - 1) * GENERATIONS_PAGE_SIZE + 1;
  const pageEnd = Math.min(serverPage * GENERATIONS_PAGE_SIZE, totalGenerations);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="border-b p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-blue-600" />
                Previous Generations
              </CardTitle>
              <CardDescription>
                {formatCount(projects.length, "project")} / {formatCount(totalGenerations, "visible generation")}
              </CardDescription>
            </div>

            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                  <DialogDescription>Save generations under a specific property.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project name</Label>
                    <Input
                      id="project-name"
                      value={newProject.name}
                      onChange={(event) => setNewProject((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Oak Ridge Exterior"
                      maxLength={120}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-address">Address</Label>
                    <Input
                      id="project-address"
                      value={newProject.address}
                      onChange={(event) => setNewProject((current) => ({ ...current, address: event.target.value }))}
                      placeholder="123 Maple Street"
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-notes">Notes</Label>
                    <Textarea
                      id="project-notes"
                      value={newProject.notes}
                      onChange={(event) => setNewProject((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Client preferences or scope"
                      maxLength={1000}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createProjectMutation.isPending || !newProject.name.trim()}>
                      {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Project
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Service</Label>
              <Select value={serviceFilter} onValueChange={(value) => setServiceFilter(value as "all" | GenerationService)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">View</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All generations</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed bg-white">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : hasError ? (
            <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed bg-white text-sm text-gray-500">
              Could not load generations.
            </div>
          ) : generations.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed bg-white text-sm text-gray-500">
              No generations match these filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="divide-y">
                {generations.map((generation) => {
                  const assignedProjectIds = new Set(generation.assignments.map((assignment) => assignment.projectId));
                  const availableProjects = projects.filter((project) => !assignedProjectIds.has(project.id));
                  const storedProjectId = selectedProjects[generation.id] || "";
                  const selectedProjectId = availableProjects.some((project) => String(project.id) === storedProjectId)
                    ? storedProjectId
                    : "";
                  const projectSelectLabel =
                    projects.length === 0
                      ? "No projects yet"
                      : availableProjects.length === 0
                        ? "Already saved"
                        : "Add to project";
                  const savedEverywhere = projects.length > 0 && availableProjects.length === 0;
                  const imageUrl = generationThumbnails[generation.id] || getGenerationImageUrl(generationImages[generation.id]);
                  const canLoadImage = generationHasImage(generation) || Boolean(imageUrl);
                  const isImageLoading = Boolean(loadingImageIds[generation.id]);
                  const isThumbnailLoading = Boolean(loadingThumbnailIds[generation.id]);
                  const styles = generation.styles.filter(Boolean);
                  const visibleStyles = styles.slice(0, MAX_VISIBLE_STYLES);
                  const visibleAssignments = generation.assignments.slice(0, MAX_VISIBLE_ASSIGNMENTS);
                  const hiddenAssignmentCount = Math.max(generation.assignments.length - MAX_VISIBLE_ASSIGNMENTS, 0);
                  const isSavingThisGeneration =
                    saveGenerationMutation.isPending &&
                    saveGenerationMutation.variables?.generation.id === generation.id;

                  return (
                    <article
                      key={generation.id}
                      className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 p-3 xl:grid-cols-[104px_minmax(0,1fr)_minmax(440px,540px)] xl:items-center"
                    >
                      <button
                        type="button"
                        className="group relative h-20 w-[88px] overflow-hidden rounded-md bg-gray-100 text-left ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-default md:w-[104px]"
                        disabled={!canLoadImage || isImageLoading}
                        onClick={() => void handlePreviewGeneration(generation)}
                        title="Preview image"
                      >
                        {imageUrl ? (
                          <>
                            <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                              <Eye className="h-5 w-5 text-white" />
                            </span>
                          </>
                        ) : isThumbnailLoading ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-7 w-7 text-gray-400" />
                          </div>
                        )}
                        <span className="sr-only">Preview image</span>
                      </button>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="max-w-full truncate text-sm font-medium text-gray-900">
                            {generation.serviceLabel}
                          </p>
                          <span className="text-xs text-gray-500">{formatDate(generation.createdAt)}</span>
                          {generation.status !== "completed" && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                              {humanReadableStatus(generation.status)}
                            </span>
                          )}
                        </div>

                        {(visibleStyles.length > 0 || visibleAssignments.length > 0) && (
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            {visibleStyles.map((style) => (
                              <span key={style} className="max-w-[180px] truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {style}
                              </span>
                            ))}
                            {styles.length > MAX_VISIBLE_STYLES && (
                              <span className="text-xs text-gray-500">+{styles.length - MAX_VISIBLE_STYLES}</span>
                            )}
                            {visibleAssignments.map((assignment) => (
                              <span
                                key={assignment.id}
                                className="inline-flex max-w-[180px] items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-800"
                              >
                                <span className="truncate">{assignment.projectName}</span>
                                <button
                                  type="button"
                                  title="Remove from project"
                                  className="rounded-sm p-0.5 hover:bg-blue-100 disabled:opacity-50"
                                  disabled={removeGenerationMutation.isPending}
                                  onClick={() => removeGenerationMutation.mutate(assignment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            {hiddenAssignmentCount > 0 && (
                              <span className="text-xs text-gray-500">+{hiddenAssignmentCount} projects</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 grid gap-2 sm:grid-cols-[auto_minmax(180px,1fr)_auto] xl:col-span-1 xl:w-full xl:justify-self-end">
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                                disabled={!canLoadImage || isImageLoading}
                                onClick={() => void handlePreviewGeneration(generation)}
                              >
                                {isImageLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">Preview image</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Preview image</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                                disabled={!canLoadImage || isImageLoading}
                                onClick={() => void handleDownloadGeneration(generation)}
                              >
                                {isImageLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                                <span className="sr-only">Download image</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download image</TooltipContent>
                          </Tooltip>
                        </div>

                        <Select
                          value={selectedProjectId || NO_PROJECT_VALUE}
                          onValueChange={(value) =>
                            setSelectedProjects((current) => {
                              const next = { ...current };
                              if (value === NO_PROJECT_VALUE) {
                                delete next[generation.id];
                              } else {
                                next[generation.id] = value;
                              }
                              return next;
                            })
                          }
                          disabled={availableProjects.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_PROJECT_VALUE}>{projectSelectLabel}</SelectItem>
                            {availableProjects.map((project) => (
                              <SelectItem key={project.id} value={String(project.id)}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            if (!selectedProjectId) return;
                            saveGenerationMutation.mutate({ projectId: selectedProjectId, generation });
                          }}
                          disabled={!selectedProjectId || saveGenerationMutation.isPending}
                          variant={savedEverywhere ? "outline" : "default"}
                        >
                          {isSavingThisGeneration ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : savedEverywhere ? null : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          {savedEverywhere ? "Saved" : "Add"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {!isLoading && !hasError && totalGenerations > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {pageStart}-{pageEnd} of {totalGenerations}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={serverPage <= 1 || generationsQuery.isFetching}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="min-w-24 text-center">
                  Page {serverPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={serverPage >= totalPages || generationsQuery.isFetching}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(previewGeneration)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewGeneration(null);
            setPreviewImages(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle>{previewGeneration?.serviceLabel || "Generation"}</DialogTitle>
            <DialogDescription>
              {previewGeneration ? formatDate(previewGeneration.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-black p-2 sm:p-4">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt=""
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md object-contain"
              />
            ) : isPreviewImageLoading ? (
              <div className="flex min-h-72 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
          </div>

          <DialogFooter className="border-t p-4">
            <Button
              type="button"
              disabled={!previewGeneration || isPreviewImageLoading || !previewImageUrl}
              onClick={() => previewGeneration && void handleDownloadGeneration(previewGeneration)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
