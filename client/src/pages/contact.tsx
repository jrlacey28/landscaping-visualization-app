import { useTenant } from "@/hooks/use-tenant"
import Header from "@/components/header"
import ContactForm from "@/components/contact-form"

export default function ContactPage() {
  const { tenant } = useTenant()

  // Create fallback tenant if API call fails
  const effectiveTenant = tenant || {
    id: 1,
    slug: "demo",
    companyName: "DreamBuilder",
    logoUrl: "",
    primaryColor: "#2563EB", 
    secondaryColor: "#059669",
    phone: "(555) 123-4567",
    email: "info@dreambuilder.com",
    address: "123 Main St, Anytown USA",
    description: "Professional AI-powered landscaping visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: 0,
    createdAt: new Date(),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black">
      <Header tenant={effectiveTenant} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Hero Section */}
        <section className="text-center py-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Ready to transform your property with AI-powered visualizations? 
            Let's discuss your project and find the perfect solution for your needs.
          </p>
        </section>

        {/* Contact Form Section */}
        <section className="pb-20">
          <div className="max-w-2xl mx-auto">
            <ContactForm 
              tenantId={effectiveTenant.id}
              title="Start Your Project"
              description="Tell us about your business and project needs. We'll get back to you within 24 hours."
            />
          </div>
        </section>
      </main>
    </div>
  )
}