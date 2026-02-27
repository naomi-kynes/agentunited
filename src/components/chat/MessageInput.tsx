import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '../ui/Button';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const MAX_LENGTH = 10000;
const COUNTER_THRESHOLD = 9000;

export function MessageInput({ onSend, disabled = false, isLoading = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled && !isLoading) {
      onSend(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Return focus to input
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setMessage(target.value);
    
    // Auto-grow textarea (max 5 lines ~120px)
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const showCounter = message.length > COUNTER_THRESHOLD;
  const isMaxLength = message.length >= MAX_LENGTH;

  return (
    <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 items-end"
      >
        <div className="flex-1">
          <label htmlFor="message-input" className="sr-only">
            Message input
          </label>
          <textarea
            id="message-input"
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            disabled={disabled || isLoading}
            maxLength={MAX_LENGTH}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{
              minHeight: '40px',
              maxHeight: '120px'
            }}
            aria-label="Message input"
            aria-describedby={showCounter ? 'char-counter' : undefined}
          />
          {showCounter && (
            <p
              id="char-counter"
              className={`mt-1 text-xs ${isMaxLength ? 'text-red-600' : 'text-gray-500'}`}
              role="status"
            >
              {message.length} / {MAX_LENGTH}
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={!message.trim() || disabled || isLoading || isMaxLength}
          isLoading={isLoading}
          className="mb-0"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
