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
      "relative h-full bg-white/10 backdrop-blur-md border-white/20",
      tier.popular && "border-primary shadow-lg"
    )}>
      {tier.popular && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm text-slate-300">
          Best value for money!
        </div>
      )}
      
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-xl text-white">{tier.name}</CardTitle>
        <CardDescription className="text-sm text-slate-300">
          {tier.description}
        </CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-white">${monthlyPrice}</span>
            <span className="text-slate-300 ml-1">/month</span>
          </div>
          {isYearly && (
            <div className="text-sm text-slate-300 mt-1">
              ${price} billed annually
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-200">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className={cn(
            "w-full",
            tier.popular && "bg-primary hover:bg-primary/90"
          )}
          variant={tier.popular ? "default" : "outline"}
          asChild
        >
          <a href={tier.ctaLink}>{tier.cta}</a>
        </Button>
      </CardFooter>
    </Card>
  )
}