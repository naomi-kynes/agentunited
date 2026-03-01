import { cn } from "../../lib/utils"
import { Bot, User } from "lucide-react"

interface MemberBadgeProps {
  type: "human" | "agent"
  className?: string
}

export function MemberBadge({ type, className }: MemberBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        type === "human"
          ? "bg-accent/25 text-accent-foreground"   // Steel blue
          : "bg-primary/10 text-primary",            // Amber
        className
      )}
    >
      {type === "human" ? (
        <User className="h-2.5 w-2.5" />
      ) : (
        <Bot className="h-2.5 w-2.5" />
      )}
      {type}
    </span>
  )
}