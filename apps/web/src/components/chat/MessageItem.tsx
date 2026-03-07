import { useState, useMemo } from 'react';
import { Avatar } from "../ui/Avatar"
import { MemberBadge } from "../ui/MemberBadge"
import { MessageContextMenu } from "./MessageContextMenu"
import { DeleteMessageModal } from "./DeleteMessageModal"
import { chatApi } from "../../services/chatApi"

interface MessageItemProps {
  id: string
  channelId: string
  author: {
    name: string
    type: "human" | "agent"
  }
  content: string
  timestamp: string
  editedAt?: string
  isOwnMessage: boolean
  isGrouped?: boolean
  attachment?: {
    url: string
    name: string
  }
  onMessageUpdated?: (messageId: string, newContent: string) => void
  onMessageDeleted?: (messageId: string) => void
}

export function MessageItem({
  id,
  channelId,
  author,
  content,
  timestamp,
  editedAt,
  isOwnMessage,
  isGrouped = false,
  attachment,
  onMessageUpdated,
  onMessageDeleted
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditContent(content)
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(content)
    setError(null)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent.trim() === content) {
      handleCancelEdit()
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await chatApi.editMessage(channelId, id, editContent.trim())

      onMessageUpdated?.(id, editContent.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to edit message:', error)
      setError(error instanceof Error ? error.message : 'Failed to edit message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await chatApi.deleteMessage(channelId, id)
      onMessageDeleted?.(id)
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Failed to delete message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    console.log('Message copied to clipboard')
  }

  const formatTimestamp = (value: string, short = false) => {
    const date = new Date(value)
    if (short) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    if (diffDays === 1) return 'Yesterday'

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatEditedTimestamp = (value: string) => {
    const date = new Date(value)
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formattedContent = useMemo(() => {
    const mentionRegex = /@(\w+)/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) parts.push(content.substring(lastIndex, match.index))

      parts.push(
        <span
          key={`mention-${match.index}`}
          className="rounded bg-emerald-500/10 px-1 py-0.5 font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
          title={`Mentioned @${match[1]}`}
        >
          @{match[1]}
        </span>
      )

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) parts.push(content.substring(lastIndex))

    return parts.length > 0 ? parts : content
  }, [content])

  if (isGrouped && !isEditing) {
    return (
      <>
        <div className="group flex gap-3 px-5 py-1 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
          <div className="w-8 shrink-0 text-right">
            <span
              className="text-[10px] text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/50"
              title={new Date(timestamp).toLocaleString()}
            >
              {formatTimestamp(timestamp, true)}
            </span>
          </div>
          <div className="mt-0.5 text-[13.5px] leading-[1.6] text-foreground/90">{formattedContent}</div>

          <MessageContextMenu
            messageId={id}
            isOwnMessage={isOwnMessage}
            messageText={content}
            onEdit={handleStartEdit}
            onDelete={() => setShowDeleteModal(true)}
            onCopy={handleCopy}
            className="ml-auto"
          />
        </div>

        <DeleteMessageModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={isLoading}
        />
      </>
    )
  }

  return (
    <>
      <div className="group flex gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
        <Avatar name={author.name} type={author.type} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold text-foreground">{author.name}</span>
            <MemberBadge type={author.type} />
            <span className="text-[11px] text-muted-foreground/60" title={new Date(timestamp).toLocaleString()}>
              {formatTimestamp(timestamp)}
            </span>
            {editedAt && (
              <span className="text-[11px] text-muted-foreground/40 italic" title={`Edited at ${formatEditedTimestamp(editedAt)}`}>
                edited
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] w-full resize-none rounded-md border border-input bg-background p-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Edit your message..."
                disabled={isLoading}
                autoFocus
              />
              {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Enter to save • Esc to cancel</span>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isLoading || !editContent.trim()}
                    className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-0.5 text-[13.5px] leading-[1.6] text-foreground/90">{formattedContent}</div>
          )}

          {attachment && (
            <div className="mt-2 inline-flex max-w-xs items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-emerald-300/50">
              <span className="truncate text-xs font-medium text-foreground">{attachment.name}</span>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Download
              </a>
            </div>
          )}
        </div>

        {!isEditing && (
          <MessageContextMenu
            messageId={id}
            isOwnMessage={isOwnMessage}
            messageText={content}
            onEdit={handleStartEdit}
            onDelete={() => setShowDeleteModal(true)}
            onCopy={handleCopy}
            className="ml-auto"
          />
        )}
      </div>

      <DeleteMessageModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isLoading}
      />
    </>
  )
}
