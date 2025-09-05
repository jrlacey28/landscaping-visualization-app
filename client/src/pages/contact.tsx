import { useTenant } from "@/hooks/use-tenant"
import Header from "@/components/header"
import ContactForm from "@/components/contact-form"

export default function ContactPage() {
  const { tenant } = useTenant()

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black">
      <Header tenant={tenant} />
      
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
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <ContactForm 
                  tenantId={tenant.id}
                  title="Start Your Project"
                  description="Tell us about your business and project needs. We'll get back to you within 24 hours."
                />
              </div>
              
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Why Choose Us?</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h3 className="font-semibold text-white">AI-Powered Precision</h3>
                        <p className="text-slate-300 text-sm">Advanced AI technology delivers photorealistic visualizations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h3 className="font-semibold text-white">Fast Turnaround</h3>
                        <p className="text-slate-300 text-sm">Get stunning results in minutes, not days</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h3 className="font-semibold text-white">Expert Support</h3>
                        <p className="text-slate-300 text-sm">Dedicated team to help you succeed</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Direct Contact</h3>
                  <div className="space-y-4">
                    {tenant.email && (
                      <a
                        href={`mailto:${tenant.email}`}
                        className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-white">Email</div>
                          <div className="text-slate-300 text-sm">{tenant.email}</div>
                        </div>
                      </a>
                    )}
                    {tenant.phone && (
                      <a
                        href={`tel:${tenant.phone}`}
                        className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-white">Phone</div>
                          <div className="text-slate-300 text-sm">{tenant.phone}</div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}