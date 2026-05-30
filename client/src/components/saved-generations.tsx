import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Filter, Folder, FolderPlus, ImageIcon, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
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
  originalImageUrl: string;
  generatedImageUrl?: string | null;
  createdAt?: string | null;
  styles: string[];
  assignments: GenerationAssignment[];
}

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

function statusVariant(status: string) {
  if (status === "completed") return "default" as const;
  if (status === "failed") return "destructive" as const;
  return "secondary" as const;
}

export default function SavedGenerations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceFilter, setServiceFilter] = useState<"all" | GenerationService>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", address: "", notes: "" });
  const [selectedProjects, setSelectedProjects] = useState<Record<string, string>>({});

  const projectsQuery = useQuery<{ projects: GenerationProject[] }>({
    queryKey: ["generation-projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/generation-projects", undefined, {
        headers: authHeaders(),
      });
      return response.json();
    },
  });

  const generationsQuery = useQuery<{ generations: SavedGeneration[] }>({
    queryKey: ["generations", serviceFilter, projectFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serviceFilter !== "all") params.set("service", serviceFilter);
      if (projectFilter !== "all") params.set("projectId", projectFilter);

      const queryString = params.toString();
      const response = await apiRequest("GET", `/api/generations${queryString ? `?${queryString}` : ""}`, undefined, {
        headers: authHeaders(),
      });
      return response.json();
    },
  });

  const projects = projectsQuery.data?.projects || [];
  const generations = generationsQuery.data?.generations || [];

  const completedCount = useMemo(
    () => generations.filter((generation) => generation.status === "completed").length,
    [generations]
  );

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generation-projects", newProject, {
        headers: authHeaders(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generation-projects"] });
      setNewProject({ name: "", address: "", notes: "" });
      setProjectDialogOpen(false);
      toast({
        title: "Project created",
        description: "The project is ready for saved generations.",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generation-projects"] });
      queryClient.invalidateQueries({ queryKey: ["generations"] });
      toast({
        title: "Generation saved",
        description: "The generation was added to the project.",
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
        description: "The generation is no longer saved to that project.",
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

  const isLoading = projectsQuery.isLoading || generationsQuery.isLoading;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-600" />
              Saved Projects
            </CardTitle>
            <CardDescription>Projects, filters, and saved generations</CardDescription>
          </div>
          <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                  <Button
                    type="submit"
                    disabled={createProjectMutation.isPending || !newProject.name.trim()}
                  >
                    {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border bg-white p-3">
            <p className="text-xs font-medium uppercase text-gray-500">Projects</p>
            <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
          </div>
          <div className="rounded-md border bg-white p-3">
            <p className="text-xs font-medium uppercase text-gray-500">Visible</p>
            <p className="text-2xl font-semibold text-gray-900">{generations.length}</p>
          </div>
          <div className="rounded-md border bg-white p-3">
            <p className="text-xs font-medium uppercase text-gray-500">Completed</p>
            <p className="text-2xl font-semibold text-gray-900">{completedCount}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => setProjectFilter(String(project.id))}
                className="flex min-h-24 items-center gap-3 rounded-md border bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="h-16 w-16 flex-none overflow-hidden rounded-md bg-gray-100">
                  {project.coverImageUrl ? (
                    <img src={project.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{project.name}</p>
                  {project.address && <p className="truncate text-sm text-gray-500">{project.address}</p>}
                  <p className="text-sm text-gray-500">{project.generationCount} saved</p>
                </div>
              </button>
            ))}
            {projects.length === 0 && (
              <div className="flex min-h-24 items-center gap-3 rounded-md border border-dashed bg-white p-3 text-gray-500">
                <FolderPlus className="h-5 w-5" />
                <span className="text-sm">No projects yet</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Service
            </Label>
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

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Project
            </Label>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
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
          <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : generations.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed text-sm text-gray-500">
            No generations match these filters.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {generations.map((generation) => {
              const selectedProjectId = selectedProjects[generation.id] || "";
              const alreadyAssignedProjectIds = new Set(generation.assignments.map((assignment) => assignment.projectId));
              const availableProjects = projects.filter((project) => !alreadyAssignedProjectIds.has(project.id));
              const imageUrl = generation.generatedImageUrl || generation.originalImageUrl;

              return (
                <article key={generation.id} className="overflow-hidden rounded-md border bg-white">
                  <div className="grid gap-0 sm:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="aspect-[4/3] bg-gray-100 sm:h-full sm:min-h-52">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col gap-4 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{generation.serviceLabel}</Badge>
                        <Badge variant={statusVariant(generation.status)}>{humanReadableStatus(generation.status)}</Badge>
                      </div>

                      <div className="min-w-0 space-y-2">
                        <p className="flex items-center gap-2 text-sm text-gray-500">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(generation.createdAt)}
                        </p>
                        {generation.styles.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {generation.styles.slice(0, 4).map((style) => (
                              <span key={style} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                {style}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto space-y-3">
                        {generation.assignments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {generation.assignments.map((assignment) => (
                              <span
                                key={assignment.id}
                                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800"
                              >
                                {assignment.projectName}
                                <button
                                  type="button"
                                  title="Remove from project"
                                  className="rounded-sm p-0.5 hover:bg-blue-100"
                                  onClick={() => removeGenerationMutation.mutate(assignment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <Select
                            value={selectedProjectId}
                            onValueChange={(value) => setSelectedProjects((current) => ({ ...current, [generation.id]: value }))}
                            disabled={availableProjects.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={availableProjects.length ? "Project" : "Saved"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProjects.map((project) => (
                                <SelectItem key={project.id} value={String(project.id)}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!selectedProjectId) return;
                              saveGenerationMutation.mutate({ projectId: selectedProjectId, generation });
                            }}
                            disabled={!selectedProjectId || saveGenerationMutation.isPending}
                          >
                            {saveGenerationMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function humanReadableStatus(status: string) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
