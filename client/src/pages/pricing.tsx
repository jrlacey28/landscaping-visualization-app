"use client"

import * as React from "react"
import { PricingCard, type PricingTier } from "@/components/ui/pricing-card"
import { Tab } from "@/components/ui/pricing-tab"
import { useTenant } from "@/hooks/use-tenant"
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
    <section className="flex flex-col items-center gap-10 py-10">
      <div className="space-y-7 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-medium md:text-5xl text-white">{title}</h1>
          <p className="text-slate-300">{subtitle}</p>
        </div>
        <div className="mx-auto flex w-fit rounded-full bg-muted p-1">
          {frequencies.map((freq) => (
            <Tab
              key={freq}
              text={freq}
              selected={selectedFrequency === freq}
              setSelected={setSelectedFrequency}
              discount={freq === "yearly"}
            />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.name}
            tier={tier}
            paymentFrequency={selectedFrequency}
          />
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
      monthlyPrice: 49,
      yearlyPrice: 470,
      features: [
        "Up to 50 visualizations per month",
        "Basic AI-powered design suggestions",
        "Email support",
        "Standard templates",
        "Basic analytics",
        "Mobile responsive embed"
      ],
      cta: "Get Started",
      ctaLink: "#contact"
    },
    {
      name: "Pro",
      description: "Ideal for growing businesses",
      monthlyPrice: 99,
      yearlyPrice: 950,
      popular: true,
      features: [
        "Up to 200 visualizations per month",
        "Advanced AI design engine",
        "Priority email & chat support",
        "Custom branding options",
        "Advanced analytics & reporting",
        "API access",
        "Custom integrations",
        "Lead capture forms"
      ],
      cta: "Start Free Trial",
      ctaLink: "#contact"
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      monthlyPrice: 249,
      yearlyPrice: 2390,
      features: [
        "Unlimited visualizations",
        "White-label solution",
        "Dedicated account manager",
        "24/7 phone & email support",
        "Custom AI model training",
        "Advanced security features",
        "Custom integrations",
        "SLA guarantee",
        "On-premise deployment option"
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
          frequencies={["monthly", "yearly"]}
        />
      </main>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-8">
            Contact us today to discuss your needs and get a custom quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {tenant.email && (
              <a
                href={`mailto:${tenant.email}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-white hover:bg-gray-100 transition-colors"
              >
                Email Us
              </a>
            )}
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-black transition-colors"
              >
                Call Us
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}