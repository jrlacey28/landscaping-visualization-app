import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface PricingTier {
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  popular?: boolean
  cta: string
  ctaLink: string
}

interface PricingCardProps {
  tier: PricingTier
  paymentFrequency: string
}

export function PricingCard({ tier, paymentFrequency }: PricingCardProps) {
  const isYearly = paymentFrequency.toLowerCase() === "yearly"
  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice
  const monthlyPrice = isYearly ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice
  
  return (
    <Card className={cn(
      "relative h-full bg-white/8 backdrop-blur-xl border-white/10 min-h-[500px] flex flex-col",
      tier.popular && "border-primary/30 bg-white/5 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
    )}>
      {tier.popular && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-t-lg text-sm text-white font-medium">
          Most Popular
        </div>
      )}
      
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl font-bold text-white">{tier.name}</CardTitle>
        <CardDescription className="text-sm text-slate-300">
          {tier.description}
        </CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center">
            <span className="text-6xl font-bold text-white">${monthlyPrice}</span>
            <span className="text-slate-300 ml-1">/month</span>
          </div>
          {isYearly && (
            <div className="text-sm text-slate-300 mt-1">
              ${price} billed annually
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow">
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-200">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="mt-auto">
        <Button 
          className={cn(
            "w-full bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50"
          )}
          variant="outline"
          asChild
        >
          <a href={tier.ctaLink}>{tier.cta}</a>
        </Button>
      </CardFooter>
    </Card>
  )
}