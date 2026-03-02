import { useState, useCallback, useRef } from 'react';

interface Member {
  id: string;
  name: string;
  email: string;
  type: 'agent' | 'human';
  online?: boolean;
}

interface Mention {
  userId: string;
  display: string;
  startIndex: number;
  endIndex: number;
}

interface UseMentionsProps {
  members: Member[];
  onMentionSelected?: (mention: Mention) => void;
}

export function useMentions({ members, onMentionSelected }: UseMentionsProps) {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);
  const [isShowingMentions, setIsShowingMentions] = useState(false);
  const [currentMentionStart, setCurrentMentionStart] = useState(-1);

  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Parse text to find @mentions
  const parseMentions = useCallback((text: string): Mention[] => {
    const mentions: Mention[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const display = match[1];
      const member = members.find(m => 
        m.name.toLowerCase() === display.toLowerCase()
      );

      if (member) {
        mentions.push({
          userId: member.id,
          display: member.name,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }

    return mentions;
  }, [members]);

  // Check for @ trigger and show autocomplete
  const handleInputChange = useCallback((value: string, cursorPosition: number) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch && inputRef.current) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setCurrentMentionStart(mentionMatch.index!);
      setSelectedMemberIndex(0);
      setIsShowingMentions(true);

      // Calculate position for autocomplete dropdown
      const rect = inputRef.current.getBoundingClientRect();
      setMentionPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    } else {
      setIsShowingMentions(false);
      setMentionQuery('');
      setCurrentMentionStart(-1);
    }
  }, []);

  // Handle mention selection
  const selectMention = useCallback((member: Member, currentValue: string, cursorPosition: number): { newValue: string; newCursor: number } => {
    if (currentMentionStart === -1) {
      return { newValue: currentValue, newCursor: cursorPosition };
    }

    const beforeMention = currentValue.substring(0, currentMentionStart);
    const afterCursor = currentValue.substring(cursorPosition);
    const mentionText = `@${member.name}`;
    const newValue = beforeMention + mentionText + afterCursor;
    const newCursor = currentMentionStart + mentionText.length;

    // Notify parent about the mention
    onMentionSelected?.({
      userId: member.id,
      display: member.name,
      startIndex: currentMentionStart,
      endIndex: newCursor
    });

    setIsShowingMentions(false);
    setMentionQuery('');
    setCurrentMentionStart(-1);

    return { newValue, newCursor };
  }, [currentMentionStart, onMentionSelected]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentValue: string, cursorPosition: number, setValue: (value: string) => void, setCursor?: (pos: number) => void) => {
    if (!isShowingMentions) return false;

    const filteredMembers = members.filter(member => 
      member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMemberIndex((prev) => 
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
        return true;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedMemberIndex((prev) => 
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
        return true;

      case 'Enter':
      case 'Tab':
        if (filteredMembers[selectedMemberIndex]) {
          e.preventDefault();
          const { newValue, newCursor } = selectMention(
            filteredMembers[selectedMemberIndex], 
            currentValue, 
            cursorPosition
          );
          setValue(newValue);
          setCursor?.(newCursor);
          return true;
        }
        break;

      case 'Escape':
        setIsShowingMentions(false);
        setMentionQuery('');
        setCurrentMentionStart(-1);
        return true;
    }

    return false;
  }, [isShowingMentions, mentionQuery, members, selectedMemberIndex, selectMention]);

  // Format text with mention highlights for display
  const formatTextWithMentions = useCallback((text: string): React.ReactNode => {
    const mentions = parseMentions(text);
    if (mentions.length === 0) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    mentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.startIndex > lastIndex) {
        parts.push(text.substring(lastIndex, mention.startIndex));
      }

      // Add highlighted mention
      parts.push(
        <span
          key={`mention-${index}`}
          className="bg-primary/10 text-primary px-1 rounded"
        >
          @{mention.display}
        </span>
      );

      lastIndex = mention.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }, [parseMentions]);

  return {
    // State
    isShowingMentions,
    mentionQuery,
    mentionPosition,
    selectedMemberIndex,
    inputRef,

    // Functions
    handleInputChange,
    handleKeyDown,
    selectMention,
    formatTextWithMentions,
    parseMentions,

    // Filtered members for autocomplete
    filteredMembers: members.filter(member => 
      member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5)
  };
}