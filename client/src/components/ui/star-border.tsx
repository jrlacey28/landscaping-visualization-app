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
        "relative overflow-hidden rounded-[20px] transition-transform hover:scale-105",
        "bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400",
        "text-white font-semibold py-4 px-12 text-center shadow-lg hover:shadow-xl",
        "hover:from-blue-500 hover:via-blue-600 hover:to-cyan-500",
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