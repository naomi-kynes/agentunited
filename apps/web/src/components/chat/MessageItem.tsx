import { Avatar } from "../ui/Avatar"
import { MemberBadge } from "../ui/MemberBadge"

interface MessageItemProps {
  id: string
  author: {
    name: string
    type: "human" | "agent"
  }
  content: string
  timestamp: string
  attachment?: {
    url: string
    name: string
  }
}

export function MessageItem({ author, content, timestamp, attachment }: MessageItemProps) {
  return (
    <div className="group flex gap-3 rounded-lg px-5 py-3 transition-colors hover:bg-muted/50">
      <Avatar name={author.name} type={author.type} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{author.name}</span>
          <MemberBadge type={author.type} />
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-foreground/85">{content}</p>
        {attachment && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border max-w-md">
            <div className="bg-muted/50 px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate">{attachment.name}</span>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}