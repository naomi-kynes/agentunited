import { useState, useRef, useCallback } from "react"
import { Plus, Send, Smile, Paperclip, AtSign } from "lucide-react"
import { cn } from "../../lib/utils"
import { MentionAutocomplete } from "./MentionAutocomplete"
import { useMentions } from "../../hooks/useMentions"

interface Member {
  id: string;
  name: string;
  email: string;
  type: 'agent' | 'human';
  online?: boolean;
}

interface MessageInputProps {
  onSend: (message: string, mentions?: { userId: string; display: string }[]) => void;
  members?: Member[];
  placeholder?: string;
}

export function MessageInput({ 
  onSend, 
  members = [], 
  placeholder = "Message #general" 
}: MessageInputProps) {
  const [value, setValue] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentMentions, setCurrentMentions] = useState<{ userId: string; display: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    isShowingMentions,
    mentionQuery,
    mentionPosition,
    selectedMemberIndex,
    inputRef,
    handleInputChange,
    handleKeyDown,
    selectMention,
    filteredMembers
  } = useMentions({ 
    members,
    onMentionSelected: (mention) => {
      setCurrentMentions(prev => [...prev, { userId: mention.userId, display: mention.display }]);
    }
  });

  // Sync refs
  if (textareaRef.current && inputRef.current !== textareaRef.current) {
    (inputRef as any).current = textareaRef.current;
  }

  const handleValueChange = useCallback((newValue: string) => {
    setValue(newValue);
    if (textareaRef.current) {
      const cursor = textareaRef.current.selectionStart || 0;
      setCursorPosition(cursor);
      handleInputChange(newValue, cursor);
    }
  }, [handleInputChange]);

  const handleSubmit = () => {
    if (value.trim()) {
      onSend(value, currentMentions);
      setValue("");
      setCurrentMentions([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    // Let mentions handler try first
    const mentionHandled = handleKeyDown(
      e, 
      value, 
      cursorPosition, 
      handleValueChange,
      (pos) => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(pos, pos);
          setCursorPosition(pos);
        }
      }
    );

    if (mentionHandled) return;

    // Handle regular send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleMentionSelect = (member: Member) => {
    if (textareaRef.current) {
      const { newValue, newCursor } = selectMention(member, value, cursorPosition);
      setValue(newValue);
      setCursorPosition(newCursor);
      textareaRef.current.setSelectionRange(newCursor, newCursor);
      textareaRef.current.focus();
    }
  };

  const handleCursorChange = () => {
    if (textareaRef.current) {
      const cursor = textareaRef.current.selectionStart || 0;
      setCursorPosition(cursor);
      handleInputChange(value, cursor);
    }
  };

  const insertMention = () => {
    if (textareaRef.current) {
      const cursor = textareaRef.current.selectionStart || 0;
      const beforeCursor = value.substring(0, cursor);
      const afterCursor = value.substring(cursor);
      const newValue = beforeCursor + "@" + afterCursor;
      const newCursor = cursor + 1;
      
      setValue(newValue);
      setCursorPosition(newCursor);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursor, newCursor);
          textareaRef.current.focus();
        }
      }, 0);
      
      handleInputChange(newValue, newCursor);
    }
  };

  return (
    <>
      <div className="border-t border-border bg-card px-5 py-3">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <button
            className="mb-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Attach file"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onSelect={handleCursorChange}
              onClick={handleCursorChange}
              placeholder={placeholder}
              rows={1}
              className="max-h-32 min-h-[24px] w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = "auto"
                target.style.height = target.scrollHeight + "px"
              }}
            />
          </div>

          <div className="mb-0.5 flex shrink-0 items-center gap-0.5">
            <button
              onClick={insertMention}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Mention someone"
            >
              <AtSign className="h-4 w-4" />
            </button>
            <button
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Add attachment"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className={cn(
                "ml-1 rounded-lg p-2 transition-colors",
                value.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          <span className="font-medium">Shift + Enter</span> for a new line • <span className="font-medium">@</span> to mention
        </p>
      </div>

      {/* Mention Autocomplete */}
      <MentionAutocomplete
        isOpen={isShowingMentions}
        query={mentionQuery}
        members={filteredMembers}
        selectedIndex={selectedMemberIndex}
        onSelect={handleMentionSelect}
        onKeyDown={() => {}} // Handled in textarea
        position={mentionPosition}
      />
    </>
  )
}