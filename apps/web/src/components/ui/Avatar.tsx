import { cn } from "../../lib/utils"

interface AvatarProps {
  name: string
  type: "human" | "agent"
  className?: string
}

export function Avatar({ name, type, className }: AvatarProps) {
  const initials =
    type === "agent"
      ? name.slice(0, 2).toUpperCase()
      : name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        type === "agent"
          ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
        className
      )}
    >
      {initials}
    </div>
  )
}