import { useCallback } from "react"
import { MessageItem } from "./MessageItem"
import type { Message } from "../../types/chat"

interface MessageListProps {
  messages: Message[]
  channelId: string
  channelName?: string
  isDM?: boolean
  dateLabel?: string
  onMessageUpdated?: (messageId: string, newContent: string) => void
  onMessageDeleted?: (messageId: string) => void
}

function isGroupedWithPrevious(current: Message, previous?: Message): boolean {
  if (!previous) return false
  if (current.authorId !== previous.authorId) return false

  const currentTime = new Date(current.timestamp).getTime()
  const previousTime = new Date(previous.timestamp).getTime()
  const diffMs = Math.abs(currentTime - previousTime)

  return diffMs <= 5 * 60 * 1000
}

export function MessageList({
  messages,
  channelId,
  channelName,
  isDM = false,
  dateLabel = "Today",
  onMessageUpdated,
  onMessageDeleted,
}: MessageListProps) {
  const handleMessageUpdated = useCallback((messageId: string, newContent: string) => {
    onMessageUpdated?.(messageId, newContent)
  }, [onMessageUpdated])

  const handleMessageDeleted = useCallback((messageId: string) => {
    onMessageDeleted?.(messageId)
  }, [onMessageDeleted])

  if (messages.length === 0) {
    const label = channelName || (isDM ? 'this conversation' : 'this channel')

    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/45 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {isDM ? `Welcome to ${label}.` : `Welcome to #${label}.`}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col py-2">
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-medium text-muted-foreground/60">{dateLabel}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id}
            id={msg.id}
            channelId={channelId}
            author={{
              name: msg.author,
              type: msg.authorType,
            }}
            content={msg.text}
            timestamp={msg.timestamp}
            editedAt={msg.editedAt}
            isOwnMessage={msg.isOwnMessage}
            isGrouped={isGroupedWithPrevious(msg, messages[idx - 1])}
            attachment={msg.attachmentUrl && msg.attachmentName ? {
              url: msg.attachmentUrl,
              name: msg.attachmentName,
            } : undefined}
            onMessageUpdated={handleMessageUpdated}
            onMessageDeleted={handleMessageDeleted}
          />
        ))}
      </div>
    </div>
  )
}
