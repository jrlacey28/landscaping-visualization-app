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
        "bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500",
        "text-white font-semibold py-4 px-8 text-center shadow-lg hover:shadow-xl",
        "hover:from-purple-500 hover:via-purple-600 hover:to-pink-600",
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