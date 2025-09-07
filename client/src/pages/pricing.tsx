"use client"

import * as React from "react"
import { PricingCard, type PricingTier } from "@/components/ui/pricing-card"
import { Tab } from "@/components/ui/pricing-tab"
import { useTenant } from "@/hooks/use-tenant"
import { cn } from "@/lib/utils"
import Header from "@/components/header"
import ContactForm from "@/components/contact-form"

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
          <h1 className="text-4xl font-medium md:text-5xl text-white">{title}</h1>
          <p className="text-slate-300">{subtitle}</p>
        </div>
        <div className="mx-auto flex w-fit rounded-full bg-transparent border border-slate-600 p-1">
          {frequencies.map((freq) => (
            <Tab
              key={freq}
              text={freq}
              selected={selectedFrequency === freq}
              setSelected={setSelectedFrequency}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-7xl gap-6 justify-center items-stretch">
        {tiers.map((tier, index) => (
          <div 
            key={tier.name}
            className={cn(
              "flex-shrink-0",
              tier.popular ? "w-[40%]" : "w-[30%]"
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

export default function PricingPage() {
  const { tenant } = useTenant()

  const pricingTiers: PricingTier[] = [
    {
      name: "Basic",
      description: "Perfect for small businesses getting started",
      monthlyPrice: 50,
      yearlyPrice: 500,
      features: [
        "Up to 50 visualizations per month",
        "Basic AI-powered design suggestions",
        "Email support",
        "Standard templates",
        "Basic analytics"
      ],
      cta: "Get Started",
      ctaLink: "#contact"
    },
    {
      name: "Pro",
      description: "Ideal for growing businesses",
      monthlyPrice: 100,
      yearlyPrice: 1000,
      popular: true,
      features: [
        "Up to 200 visualizations per month",
        "Advanced AI design engine",
        "Priority email & chat support",
        "Custom branding options",
        "Advanced analytics & reporting"
      ],
      cta: "Start Free Trial",
      ctaLink: "#contact"
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      monthlyPrice: 350,
      yearlyPrice: 3500,
      features: [
        "Unlimited visualizations",
        "White-label solution",
        "Dedicated account manager",
        "24/7 phone & email support",
        "Custom AI model training"
      ],
      cta: "Contact Sales",
      ctaLink: "#contact"
    }
  ]

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
        <PricingSection
          title="Choose Your Plan"
          subtitle="Select the perfect plan for your business needs. All plans include our core AI visualization features."
          tiers={pricingTiers}
          frequencies={["Monthly", "Yearly (Save 20%)"]}
        />
      </main>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-slate-300 mb-8">
              Contact us today to discuss your needs and get a custom quote.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <ContactForm 
              tenantId={tenant.id}
              title="Get Your Quote"
              description="Tell us about your business and we'll reach out with pricing details."
            />
          </div>
        </div>
      </section>
    </div>
  )
}