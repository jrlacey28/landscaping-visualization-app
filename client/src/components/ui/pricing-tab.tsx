import { cn } from "@/lib/utils"

interface TabProps {
  text: string
  selected: boolean
  setSelected: (text: string) => void
  discount?: boolean
}

export function Tab({ text, selected, setSelected, discount }: TabProps) {
  return (
    <button
      className={cn(
        "relative rounded-full px-3 py-1.5 text-sm font-medium transition-all",
        selected
          ? "bg-white text-black shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={() => setSelected(text)}
    >
      {text}
    </button>
  )
}