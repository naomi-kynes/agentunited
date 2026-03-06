import { useState, useCallback, useRef, useEffect } from "react"
import { Search, ChevronDown, Hash, Plus, X, Circle } from "lucide-react"
import { cn } from "../../lib/utils"
import { OnlineIndicator } from "../ui/OnlineIndicator"
import { TypeBadge } from "../ui/TypeBadge"
import { ThemeToggle } from "../ui/ThemeToggle"
import { ChannelContextMenu } from "./ChannelContextMenu"
import type { Channel } from "../../types/chat"

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
  onCreateChannel?: () => void
  onNewDM?: () => void
  onSearch?: (query: string) => void
  onChannelUpdate?: (channel: Channel) => void
  onChannelDelete?: (channelId: string) => void
}

export function ChatSidebar({
  channels,
  directMessages,
  activeChannelId,
  onChannelSelect,
  onDMSelect,
  onCreateChannel,
  onNewDM,
  onSearch,
  onChannelUpdate,
  onChannelDelete,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Listen for custom search focus event
  useEffect(() => {
    const handleFocusSearch = () => {
      searchInputRef.current?.focus()
    }
    window.addEventListener('focus-chat-search', handleFocusSearch)
    return () => window.removeEventListener('focus-chat-search', handleFocusSearch)
  }, [])

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim())
    }
  }, [searchQuery, onSearch])

  const handleChannelUpdate = (updatedChannel: Channel) => {
    onChannelUpdate?.(updatedChannel)
  }

  const handleChannelDelete = (channelId: string) => {
    onChannelDelete?.(channelId)
  }

  // Calculate total unread count for the workspace header
  const totalUnreadCount = channels.reduce((sum, ch) => sum + (ch.unread || 0), 0) +
    directMessages.reduce((sum, dm) => sum + (dm.unread || 0), 0);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Workspace Header */}
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3.5">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            AU
          </div>
          {totalUnreadCount > 0 && (
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </div>
          )}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">AgentUnited</span>
          <span className="text-[11px] text-muted-foreground">Workspace</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            ref={searchInputRef}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Channels */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Channels
          </span>
          <button className="rounded p-0.5 hover:bg-sidebar-accent" aria-label="Add channel" onClick={onCreateChannel}>
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <nav className="mt-1 flex flex-col gap-0.5">
          {channels.map((ch) => {
            const hasUnread = (ch.unread || 0) > 0;
            const isActive = ch.id === activeChannelId;
            
            return (
              <button
                key={ch.id}
                onClick={() => onChannelSelect(ch.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                )}
              >
                <div className="relative">
                  <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {hasUnread && !isActive && (
                    <Circle className="absolute -top-0.5 -right-0.5 h-2 w-2 fill-primary text-primary" />
                  )}
                </div>
                
                <span className={cn(
                  "truncate flex-1 text-left",
                  hasUnread && !isActive && "font-semibold text-sidebar-foreground"
                )}>
                  {ch.name}
                </span>
                
                {hasUnread ? (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {ch.unread! > 99 ? '99+' : ch.unread}
                  </span>
                ) : (
                  <ChannelContextMenu
                    channel={ch}
                    onChannelUpdate={handleChannelUpdate}
                    onChannelDelete={handleChannelDelete}
                    className="ml-auto"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Direct Messages */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Direct Messages
          </span>
          <button className="rounded p-0.5 hover:bg-sidebar-accent" aria-label="New message" onClick={onNewDM}>
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <nav className="mt-1 flex flex-col gap-0.5">
          {directMessages.map((dm) => {
            const hasUnread = (dm.unread || 0) > 0;
            
            return (
              <button
                key={dm.id}
                onClick={() => onDMSelect(dm.id)}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60"
              >
                <div className="relative">
                  <OnlineIndicator online={dm.online} type={dm.type} />
                  {hasUnread && (
                    <Circle className="absolute -top-0.5 -right-0.5 h-2 w-2 fill-primary text-primary" />
                  )}
                </div>
                
                <span className={cn(
                  "truncate flex-1 text-left",
                  hasUnread && "font-semibold text-sidebar-foreground"
                )}>
                  {dm.name}
                </span>
                
                <TypeBadge type={dm.type} />
                
                {hasUnread && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {dm.unread! > 99 ? '99+' : dm.unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  )
}