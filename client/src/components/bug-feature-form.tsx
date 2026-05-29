import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bug, Lightbulb, Send } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const feedbackFormSchema = z.object({
  type: z.enum(["bug", "feature"]),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details (at least 20 characters)"),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

export default function BugFeatureForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      type: "bug",
      title: "",
      description: "",
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      // Auto-fill user info
      const leadData = {
        firstName: user?.user.firstName || "User",
        lastName: user?.user.lastName || "",
        email: user?.user.email || "",
        phone: "",
        projectDetails: `[${data.type.toUpperCase()}] ${data.title}\n\n${data.description}`,
        leadType: "bugs_features",
        service: data.type, // Store whether it's a bug or feature
        tenantId: 1, // Always associate with tenant 1 for admin visibility
      };
      
      return apiRequest("POST", "/api/leads", leadData);
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. We'll review it soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: FeedbackFormData) => {
    setIsSubmitting(true);
    submitFeedbackMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-orange-500" />
          Report a Bug or Request a Feature
        </CardTitle>
        <CardDescription>
          Help us improve! Let us know about any issues you're experiencing or features you'd like to see.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bug">
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4 text-red-500" />
                          Bug Report
                        </div>
                      </SelectItem>
                      <SelectItem value="feature">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          Feature Request
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={form.watch("type") === "bug" ? "Brief description of the issue" : "What feature would you like?"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={
                        form.watch("type") === "bug" 
                          ? "Please describe the bug:\n- What were you trying to do?\n- What happened instead?\n- Steps to reproduce the issue"
                          : "Please describe the feature:\n- What problem would it solve?\n- How would you use it?\n- Any specific requirements?"
                      }
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
