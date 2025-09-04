import { cn } from "@/lib/utils"
import { ElementType, ComponentPropsWithoutRef } from "react"

interface StarBorderProps<T extends ElementType> {
  as?: T
  color?: string
  speed?: string
  className?: string
  children: React.ReactNode
}

export function StarBorder<T extends ElementType = "button">({
  as,
  className,
  color,
  speed = "3s",
  children,
  ...props
}: StarBorderProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as || "button"

  return (
    <Component 
      className={cn(
        "relative overflow-hidden rounded-[50px] transition-all duration-300 hover:scale-105",
        "bg-gradient-to-r from-blue-600 via-cyan-500 to-green-600",
        "hover:from-blue-700 hover:via-cyan-600 hover:to-green-700",
        "text-white font-semibold py-3 px-16 text-center shadow-lg hover:shadow-xl",
        className
      )} 
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </Component>
  )
}