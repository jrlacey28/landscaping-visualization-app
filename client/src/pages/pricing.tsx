"use client"

import * as React from "react"
import { PricingCard, type PricingTier } from "@/components/ui/pricing-card"
import { Tab } from "@/components/ui/pricing-tab"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useTenant } from "@/hooks/use-tenant"
import { cn } from "@/lib/utils"
import Header from "@/components/header"

interface PricingSectionProps {
  title: string
  subtitle: string
  tiers: PricingTier[]
  frequencies: string[]
}

function PricingSection({
  title,
  subtitle,
  tiers,
  frequencies,
}: PricingSectionProps) {
  const [selectedFrequency, setSelectedFrequency] = React.useState(frequencies[0])

  return (
    <section className="flex flex-col items-center gap-16 py-10">
      <div className="space-y-7 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold text-white">{title}</h1>
          <p className="text-slate-300">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full max-w-7xl gap-6 justify-center items-stretch">
        {tiers.map((tier, index) => (
          <div 
            key={tier.name}
            className={cn(
              "flex-shrink-0 w-full",
              tier.popular ? "lg:w-[35%]" : "lg:w-[32.5%]"
            )}
          >
            <PricingCard
              tier={tier}
              paymentFrequency={selectedFrequency}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

const faqItems = [
  {
    question: 'How does the AI visualization work?',
    answer: 'Our AI technology analyzes your uploaded property image and applies the selected design styles using advanced machine learning algorithms to create realistic visualizations.',
  },
  {
    question: 'Can I try the service before purchasing?',
    answer: 'Yes! We offer a free trial that allows you to generate up to 3 visualizations so you can experience the quality of our AI-powered design tools.',
  },
  {
    question: 'What image formats do you support?',
    answer: 'We support JPG, PNG, and HEIC formats. For best results, use high-resolution images taken in good lighting conditions.',
  },
  {
    question: 'How long does it take to generate a visualization?',
    answer: 'Most visualizations are generated within 10-30 seconds. Processing time may vary based on image complexity, current system load, and signal strength.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. You will continue to have access to your plan features until the end of your billing cycle.',
  },
]

export default function PricingPage() {
  const { tenant } = useTenant()

  const pricingTiers: PricingTier[] = [
    {
      name: "Free",
      description: "Try our service with no commitment",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "5 visualizations per month",
        "All AI-powered design tools",
        "Basic templates",
        "Standard sharing options"
      ],
      cta: "Start Free Trial",
      ctaLink: "/auth"
    },
    {
      name: "Basic",
      description: "Perfect for small businesses getting started",
      monthlyPrice: 20,
      yearlyPrice: 240,
      features: [
        "50 visualizations per month",
        "All AI-powered design tools",
        "Premium templates", 
        "Email support",
        "Standard sharing options"
      ],
      cta: "Get Started",
      ctaLink: "/auth?plan=price_1S5X1sBY2SPm2HvOuDHNzsIp"
    },
    {
      name: "Pro",
      description: "Ideal for growing businesses",
      monthlyPrice: 100,
      yearlyPrice: 1200,
      popular: true,
      features: [
        "Everything in Basic, plus:",
        "Unlimited visualizations",
        "Custom embed widgets",
        "White-label branding",
        "Priority support",
        "Advanced customization"
      ],
      cta: "Get Started",
      ctaLink: "/auth?plan=price_1S5X2XBY2SPm2HvO2he9Unto"
    }
  ]

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
        <PricingSection
          title="Pricing"
          subtitle="Select the perfect plan for your business needs. All plans include our core AI visualization features."
          tiers={pricingTiers}
          frequencies={["Monthly"]}
        />
      </main>

      {/* FAQ Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold text-white mb-8">Frequently Asked Questions</h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="bg-transparent p-8">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-none">
                  <AccordionTrigger className="text-white text-left hover:no-underline hover:text-blue-300 py-4 text-2xl font-medium [&>svg]:text-white">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="text-slate-300 mt-6 text-center">
              Can't find what you're looking for? Contact our{' '}
              <a href="mailto:support@company.com" className="text-blue-400 font-medium hover:underline">
                customer support team
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}