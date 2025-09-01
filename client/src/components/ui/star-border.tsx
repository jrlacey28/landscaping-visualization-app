
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
        "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800",
        "text-white font-semibold py-4 px-8 text-center shadow-lg",
        className
      )} 
      {...props}
    >
      <div
        className={cn(
          "absolute w-[400%] h-[60%] bottom-[-15px] right-[-350%] rounded-full animate-star-movement-bottom",
          "opacity-80"
        )}
        style={{
          background: `radial-gradient(circle, ${starColor} 0%, ${starColor}88 30%, transparent 70%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "absolute w-[400%] h-[60%] top-[-15px] left-[-350%] rounded-full animate-star-movement-top",
          "opacity-80"
        )}
        style={{
          background: `radial-gradient(circle, ${starColor} 0%, ${starColor}88 30%, transparent 70%)`,
          animationDuration: speed,
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </Component>
  )
}
