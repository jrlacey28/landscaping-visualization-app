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
      "relative h-full flex flex-col",
      tier.popular && "border-primary shadow-lg scale-105"
    )}>
      <CardHeader className="text-center pb-8">
        {tier.popular && (
          <Badge className="mb-4 w-fit mx-auto bg-primary">
            Most Popular
          </Badge>
        )}
        <CardTitle className="text-xl">{tier.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {tier.description}
        </CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold">${monthlyPrice}</span>
            <span className="text-muted-foreground ml-1">/month</span>
          </div>
          {isYearly && (
            <div className="text-sm text-muted-foreground mt-1">
              ${price} billed annually
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow">
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="mt-auto">
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