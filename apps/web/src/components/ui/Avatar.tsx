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
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
        type === "agent"
          ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"  // Amber gradient for agents
          : "bg-accent text-accent-foreground",  // Steel blue for humans
        className
      )}
    >
      {initials}
    </div>
  )
}