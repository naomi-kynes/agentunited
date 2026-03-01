import { cn } from "../../lib/utils"

interface OnlineIndicatorProps {
  online: boolean
  type?: "human" | "agent"  // Optional: different colors for agent/human
  className?: string
}

export function OnlineIndicator({ online, type, className }: OnlineIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        online
          ? type === "agent"
            ? "bg-primary shadow-[0_0_4px_currentColor]"  // Amber glow for agents
            : "bg-accent"  // Steel blue for humans
          : "bg-muted-foreground/30",
        className
      )}
    />
  )
}