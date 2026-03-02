import { Hash, MoreVertical, MessageCircle, Users } from "lucide-react"
import { cn } from "../../lib/utils"

interface ChatHeaderProps {
  channelName: string
  topic?: string
  isDM?: boolean
  onToggleMembers?: () => void
  showMembersPanel?: boolean
}

export function ChatHeader({ 
  channelName, 
  topic, 
  isDM = false, 
  onToggleMembers,
  showMembersPanel = false 
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
      {isDM ? (
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
      ) : (
        <Hash className="h-5 w-5 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-foreground">{channelName}</h2>
        {topic && (
          <p className="text-xs text-muted-foreground truncate">{topic}</p>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {/* Members button - only show for channels, not DMs */}
        {!isDM && onToggleMembers && (
          <button
            onClick={onToggleMembers}
            className={cn(
              "rounded-md p-2 transition-colors",
              showMembersPanel
                ? "bg-primary/10 text-primary hover:bg-primary/15"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label={showMembersPanel ? "Hide member list" : "Show member list"}
          >
            <Users className="h-5 w-5" />
          </button>
        )}
        
        <button
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={isDM ? "Conversation options" : "Channel options"}
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}