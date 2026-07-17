import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const quoteFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  location: z.string().min(2, "Please enter your city and state"),
  projectDetails: z.string().min(10, "Please describe what you're looking for"),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface QuoteLeadFormProps {
  onClose: () => void;
  service: string;
  selectedStyles: any;
  originalImageUrl?: string | null;
  generatedImageUrl?: string | null;
  tenantId?: number | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  logoUrl?: string | null;
  successRedirectUrl?: string | null;
}

function normalizeBrandColor(color: string | undefined, fallback: string) {
  const normalized = String(color || "").trim();
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
}

function colorWithAlpha(color: string, alpha: number) {
  const value = Number.parseInt(color.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function getContrastTextColor(color: string) {
  const value = Number.parseInt(color.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return (red * 299 + green * 587 + blue * 114) / 1000 > 165 ? "#0f172a" : "#ffffff";
}

const inputClassName =
  "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:ring-slate-300";

export default function QuoteLeadForm({
  onClose,
  service,
  selectedStyles,
  originalImageUrl,
  generatedImageUrl,
  tenantId,
  title,
  description,
  submitLabel,
  primaryColor = "#2563eb",
  secondaryColor = "#1d4ed8",
  companyName,
  logoUrl,
  successRedirectUrl,
}: QuoteLeadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const resolvedPrimaryColor = normalizeBrandColor(primaryColor, "#2563eb");
  const resolvedSecondaryColor = normalizeBrandColor(secondaryColor, resolvedPrimaryColor);
  const primaryTextColor = getContrastTextColor(resolvedPrimaryColor);
  const previewImageUrl = generatedImageUrl || originalImageUrl;
  const hasGeneratedPreview = Boolean(generatedImageUrl);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      projectDetails: "",
    },
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const leadData: any = {
        ...data,
        leadType: "quote",
        service,
        selectedStyles,
        originalImageUrl,
        generatedImageUrl,
        tenantId: tenantId || 1,
      };

      return apiRequest("POST", "/api/leads", leadData);
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Submitted!",
        description: "We'll contact you within 24 hours with your free quote.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      onClose();
      if (successRedirectUrl) {
        window.open(successRedirectUrl, "_blank", "noopener,noreferrer");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const serviceDisplay = service === "roofing-siding" ? "Roofing & Siding" :
    service === "pools" ? "Pool Installation" :
    service === "painting" ? "Painting" :
    service === "bathroom-redesign" ? "Bathroom Redesign" :
    service === "kitchen-redesign" ? "Kitchen Redesign" :
    service === "living-room-design" ? "Living Room Design" :
    "Landscaping";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5">
      <Card
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border bg-white text-slate-950 shadow-2xl"
        style={{ borderColor: colorWithAlpha(resolvedPrimaryColor, 0.4) }}
      >
        <div className="h-1.5 w-full" style={{ backgroundColor: resolvedPrimaryColor }} />
        <CardHeader className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              {logoUrl ? (
                <div className="flex h-14 min-w-20 max-w-44 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white px-2 shadow-sm">
                  <img src={logoUrl} alt={`${companyName || "Company"} logo`} className="max-h-12 max-w-full object-contain" />
                </div>
              ) : (
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: resolvedPrimaryColor, color: primaryTextColor }}
                >
                  <Send className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: resolvedPrimaryColor }}>
                  {companyName || "Project quote"}
                </p>
                <CardTitle className="text-lg leading-tight text-slate-950 sm:text-xl">
                  {title || `Get Your Free ${serviceDisplay} Quote`}
                </CardTitle>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close quote form"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={previewImageUrl ? "grid lg:grid-cols-[0.9fr_1.1fr]" : ""}>
            {previewImageUrl && (
              <aside
                className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r sm:p-6"
                style={{ backgroundColor: colorWithAlpha(resolvedSecondaryColor, 0.055) }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Included with your request</p>
                    <h3 className="font-semibold text-slate-950">{hasGeneratedPreview ? "Your generated design" : "Your project photo"}</h3>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundColor: resolvedSecondaryColor, color: getContrastTextColor(resolvedSecondaryColor) }}>
                    <ImageIcon className="h-4 w-4" />
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <img src={previewImageUrl} alt={hasGeneratedPreview ? "Generated project design" : "Uploaded project"} className="aspect-[4/3] w-full object-cover" />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  This design and your project details will be sent together so the team can prepare a more helpful quote.
                </p>
              </aside>
            )}

            <section className="p-5 sm:p-6">
              <p className="mb-5 text-sm leading-6 text-slate-600">
                {description || "Share your contact information and a few project details. The team will receive your design with this request."}
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => submitQuoteMutation.mutate(data))} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">First name</FormLabel>
                        <FormControl><Input placeholder="John" className={inputClassName} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Last name</FormLabel>
                        <FormControl><Input placeholder="Doe" className={inputClassName} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Email</FormLabel>
                        <FormControl><Input type="email" placeholder="john@example.com" className={inputClassName} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Phone number</FormLabel>
                        <FormControl><Input type="tel" placeholder="(555) 123-4567" className={inputClassName} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Project location</FormLabel>
                      <FormControl><Input placeholder="City, State" className={inputClassName} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="projectDetails" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Tell us about your project</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Project goals, timeline, questions, or anything else the team should know..."
                          className={`min-h-[88px] ${inputClassName}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onClose} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitQuoteMutation.isPending}
                      className="font-semibold shadow-lg"
                      style={{ backgroundColor: resolvedPrimaryColor, color: primaryTextColor }}
                    >
                      {submitQuoteMutation.isPending ? "Submitting..." : (
                        <><Send className="mr-2 h-4 w-4" />{submitLabel || "Get Free Quote"}</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
