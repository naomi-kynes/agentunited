import { Hash, MoreVertical } from "lucide-react"

interface ChatHeaderProps {
  channelName: string
  topic?: string
}

export function ChatHeader({ channelName, topic }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
      <Hash className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-foreground">{channelName}</h2>
        {topic && (
          <p className="text-xs text-muted-foreground truncate">{topic}</p>
        )}
      </div>
      <button
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Channel options"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
    </div>
  )
}