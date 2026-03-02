import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TypeBadge } from '../ui/TypeBadge';
import { OnlineIndicator } from '../ui/OnlineIndicator';

interface Member {
  id: string;
  name: string;
  email: string;
  type: 'agent' | 'human';
  online?: boolean;
}

interface MentionAutocompleteProps {
  isOpen: boolean;
  query: string;
  members: Member[];
  selectedIndex: number;
  onSelect: (member: Member) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  position: { top: number; left: number };
}

export function MentionAutocomplete({ 
  isOpen, 
  query, 
  members, 
  selectedIndex, 
  onSelect,
  onKeyDown,
  position 
}: MentionAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and sort members based on query
  const filteredMembers = members
    .filter(member => 
      member.name.toLowerCase().includes(query.toLowerCase()) ||
      member.email.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by online status first, then alphabetically
      if (a.online !== b.online) {
        return a.online ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5); // Limit to 5 results

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0 && selectedIndex < filteredMembers.length) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex, filteredMembers.length]);

  if (!isOpen || filteredMembers.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed z-50 w-64 bg-card border border-border rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
      }}
      ref={listRef}
      onKeyDown={onKeyDown}
    >
      {filteredMembers.map((member, index) => (
        <button
          key={member.id}
          onClick={() => onSelect(member)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
            index === selectedIndex
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:bg-muted"
          )}
        >
          {/* Avatar */}
          <div className="relative">
            <div className={cn(
              "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
              member.type === 'agent'
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground"
            )}>
              {member.type === 'agent' ? (
                <Bot className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
            </div>
            {member.online && (
              <OnlineIndicator 
                online={true} 
                type={member.type}
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-card"
              />
            )}
          </div>

          {/* Member info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium truncate">
                {member.name}
              </span>
              <TypeBadge type={member.type} className="text-[8px]" />
            </div>
            {member.online && (
              <div className="text-xs text-muted-foreground">Online</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}