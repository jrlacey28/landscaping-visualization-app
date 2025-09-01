
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
  const starColor = color || "#FFD700"

  return (
    <Component 
      className={cn(
        "relative overflow-hidden rounded-[20px] transition-transform hover:scale-105",
        "bg-gradient-to-r from-blue-600 via-red-600 to-blue-800",
        "text-white font-semibold py-4 px-8 text-center shadow-lg",
        className
      )} 
      {...props}
    >
      <div
        className={cn(
          "absolute w-[150%] h-[30%] bottom-[-5px] right-[-125%] rounded-full animate-star-movement-bottom",
          "opacity-5"
        )}
        style={{
          background: `radial-gradient(circle, ${starColor}, transparent 15%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "absolute w-[150%] h-[30%] top-[-5px] left-[-125%] rounded-full animate-star-movement-top",
          "opacity-5"
        )}
        style={{
          background: `radial-gradient(circle, ${starColor}, transparent 15%)`,
          animationDuration: speed,
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </Component>
  )
}
