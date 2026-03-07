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
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
        type === "human"
          ? "bg-slate-200/60 text-slate-700 dark:bg-slate-700/80 dark:text-slate-200"
          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
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