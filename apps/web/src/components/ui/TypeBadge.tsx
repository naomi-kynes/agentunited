import { cn } from "../../lib/utils"

interface TypeBadgeProps {
  type: "human" | "agent"
  className?: string
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block text-[10px] font-medium tracking-wide uppercase rounded-full px-1.5 py-0.5 shrink-0",
        type === "human"
          ? "bg-accent/30 text-accent-foreground"  // Steel blue for humans
          : "bg-primary/10 text-primary",           // Amber for agents
        className
      )}
    >
      {type === "human" ? "Human" : "Agent"}
    </span>
  )
}