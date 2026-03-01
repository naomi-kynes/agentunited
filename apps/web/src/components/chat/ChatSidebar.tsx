import { Search, ChevronDown, Hash, Plus } from "lucide-react"
import { cn } from "../../lib/utils"
import { OnlineIndicator } from "../ui/OnlineIndicator"
import { TypeBadge } from "../ui/TypeBadge"

interface Channel {
  id: string
  name: string
  unread?: number
}

interface DirectMessage {
  id: string
  name: string
  type: "human" | "agent"
  online: boolean
  unread?: number
}

interface ChatSidebarProps {
  channels: Channel[]
  directMessages: DirectMessage[]
  activeChannelId?: string
  onChannelSelect: (id: string) => void
  onDMSelect: (id: string) => void
}

export function ChatSidebar({
  channels,
  directMessages,
  activeChannelId,
  onChannelSelect,
  onDMSelect,
}: ChatSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Workspace Header */}
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
          AU
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">AgentUnited</span>
          <span className="text-[11px] text-muted-foreground">Workspace</span>
        </div>
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Channels */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Channels
          </span>
          <button className="rounded p-0.5 hover:bg-sidebar-accent" aria-label="Add channel">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <nav className="mt-1 flex flex-col gap-0.5">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onChannelSelect(ch.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                ch.id === activeChannelId
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
              )}
            >
              <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{ch.name}</span>
              {ch.unread && (
                <span className="ml-auto flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {ch.unread}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Direct Messages */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Direct Messages
          </span>
          <button className="rounded p-0.5 hover:bg-sidebar-accent" aria-label="New message">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <nav className="mt-1 flex flex-col gap-0.5">
          {directMessages.map((dm) => (
            <button
              key={dm.id}
              onClick={() => onDMSelect(dm.id)}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60"
            >
              <OnlineIndicator online={dm.online} type={dm.type} />
              <span className="truncate flex-1 text-left">{dm.name}</span>
              <TypeBadge type={dm.type} />
              {dm.unread && (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {dm.unread}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}