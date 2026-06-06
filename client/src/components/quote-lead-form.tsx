import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X, Send } from "lucide-react";
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
  service: string; // landscape, roofing-siding, pools
  selectedStyles: any;
  originalImageUrl?: string | null;
  generatedImageUrl?: string | null;
  tenantId?: number | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  successRedirectUrl?: string | null;
}

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
  successRedirectUrl,
}: QuoteLeadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        service: service,
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

  const onSubmit = (data: QuoteFormData) => {
    submitQuoteMutation.mutate(data);
  };

  // Format service name for display
  const serviceDisplay = service === "roofing-siding" ? "Roofing & Siding" :
                         service === "pools" ? "Pool Installation" :
                         service === "painting" ? "Painting" :
                         service === "bathroom-redesign" ? "Bathroom Redesign" :
                         service === "kitchen-redesign" ? "Kitchen Redesign" :
                         service === "living-room-design" ? "Living Room Design" :
                         "Landscaping";

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-blue-300/30 bg-blue-950/70 text-white shadow-2xl shadow-blue-950/40 backdrop-blur-md">
        <CardHeader className="border-b border-blue-300/20 bg-blue-500/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-white">
              <Send className="h-5 w-5 text-blue-300 mr-3" />
              {title || `Get Your Free ${serviceDisplay} Quote`}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-200 hover:bg-blue-400/20 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-slate-300 mb-6">
            {description || "Fill out the form below and we'll provide you with a free, no-obligation quote based on your visualization."}
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City, State"
                          className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="projectDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">What are you looking for?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe your project needs, timeline, and any specific requirements..."
                        className="min-h-[100px] bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="border-white/30 bg-transparent text-slate-100 hover:bg-white/10 hover:text-white">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitQuoteMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-950/40 transition-all"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                >
                  {submitQuoteMutation.isPending ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {submitLabel || "Get Free Quote"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
