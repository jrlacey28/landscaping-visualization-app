import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useToast } from "../hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "../lib/queryClient"

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
      // Invalidate leads queries to refresh admin dashboard for all tenants
      queryClient.invalidateQueries({ 
        queryKey: [`/api/tenants/${tenantId}/leads`] 
      })
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
    <div className="w-full max-w-lg mx-auto backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-300">{description}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-slate-200">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20"
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-slate-200">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange("lastName")}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20"
                placeholder="Enter your last name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-slate-200">Business Name *</Label>
            <Input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={handleInputChange("businessName")}
              required
              className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20"
              placeholder="Enter your business name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
              className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20"
              placeholder="Enter your email address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-200">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange("phone")}
              className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20"
              placeholder="Enter your phone number"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Sending..." : "Send Message"}
          </Button>
        </form>
    </div>
  )
}