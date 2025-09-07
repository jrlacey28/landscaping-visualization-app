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
  const isYearly = paymentFrequency.toLowerCase().includes("yearly")
  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice
  const monthlyPrice = isYearly ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice
  
  return (
    <Card className={cn(
      "relative h-full bg-white/8 backdrop-blur-xl border-white/10 min-h-[500px] flex flex-col shadow-[0_0_15px_rgba(255,255,255,0.1)]",
      tier.popular && "border-primary/30 bg-white/5 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
    )}>
      
      <CardHeader className="text-left pb-6">
        <CardTitle className="text-3xl font-bold text-white">{tier.name}</CardTitle>
        
        <div className="mt-4">
          <div className="flex items-baseline">
            <span className="text-6xl font-bold text-white">${monthlyPrice}</span>
            <span className="text-slate-300 ml-1">/month</span>
          </div>
          {isYearly && (
            <div className="text-sm text-slate-300 mt-1">
              ${price} billed annually
            </div>
          )}
          <hr className="border-white/20 mt-4 mb-4" />
          <CardDescription className="text-sm text-slate-300 mb-0">
            {tier.description}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow text-left">
        <div className="mb-2">
          <h4 className="text-lg font-semibold text-white mb-2">What You Get</h4>
        </div>
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