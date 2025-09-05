import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

interface ContactFormProps {
  tenantId: number
  title?: string
  description?: string
}

interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  businessName: string
}

export default function ContactForm({ 
  tenantId, 
  title = "Get In Touch", 
  description = "Fill out the form below and we'll get back to you soon." 
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessName: ""
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/leads", {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        businessName: data.businessName
      })
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "We'll get back to you soon.",
      })
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        businessName: ""
      })
      // Invalidate leads query to refresh admin dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] })
    },
    onError: (error) => {
      console.error("Contact form error:", error)
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.businessName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    submitMutation.mutate(formData)
  }

  const handleInputChange = (field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange("lastName")}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={handleInputChange("businessName")}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange("phone")}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}