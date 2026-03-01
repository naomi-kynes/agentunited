import React from 'react';
import './LoadingStates.css';

// Generic loading spinner component
export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  color = 'primary' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
  color?: 'primary' | 'secondary' | 'inherit';
}) {
  return (
    <div 
      className={`spinner spinner--${size} spinner--${color} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="spinner__circle" />
    </div>
  );
}

// Skeleton loading for channel list
export function ChannelListSkeleton() {
  return (
    <div className="channel-list-skeleton" aria-label="Loading channels">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="channel-skeleton">
          <div className="channel-skeleton__icon" />
          <div className="channel-skeleton__content">
            <div className="channel-skeleton__name" style={{ width: `${60 + Math.random() * 40}%` }} />
            <div className="channel-skeleton__preview" style={{ width: `${40 + Math.random() * 30}%` }} />
          </div>
          <div className="channel-skeleton__badge" />
        </div>
      ))}
    </div>
  );
}

// Skeleton loading for message list
export function MessageListSkeleton() {
  return (
    <div className="message-list-skeleton" aria-label="Loading messages">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="message-skeleton">
          <div className="message-skeleton__avatar" />
          <div className="message-skeleton__content">
            <div className="message-skeleton__header">
              <div className="message-skeleton__name" style={{ width: `${80 + Math.random() * 60}px` }} />
              <div className="message-skeleton__time" />
            </div>
            <div className="message-skeleton__text">
              <div className="message-skeleton__line" style={{ width: `${60 + Math.random() * 35}%` }} />
              {Math.random() > 0.5 && (
                <div className="message-skeleton__line" style={{ width: `${30 + Math.random() * 40}%` }} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading state for message sending
export function MessageSendingIndicator({ text }: { text: string }) {
  return (
    <div className="message-sending" role="status" aria-live="polite">
      <LoadingSpinner size="sm" color="inherit" />
      <span className="message-sending__text">{text}</span>
    </div>
  );
}

// Connection status indicator
export function ConnectionStatusIndicator({ 
  status, 
  onRetry 
}: { 
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  onRetry?: () => void;
}) {
  const statusConfig = {
    connecting: {
      icon: <LoadingSpinner size="sm" color="inherit" />,
      text: 'Connecting...',
      className: 'connection-status--connecting'
    },
    connected: {
      icon: '✓',
      text: 'Connected',
      className: 'connection-status--connected'
    },
    disconnected: {
      icon: '⚠',
      text: 'Disconnected',
      className: 'connection-status--disconnected'
    },
    error: {
      icon: '✗',
      text: 'Connection failed',
      className: 'connection-status--error'
    }
  };

  const config = statusConfig[status];

  return (
    <div 
      className={`connection-status ${config.className}`}
      role="status"
      aria-live="polite"
    >
      <div className="connection-status__icon">
        {config.icon}
      </div>
      <span className="connection-status__text">
        {config.text}
      </span>
      {(status === 'disconnected' || status === 'error') && onRetry && (
        <button 
          className="connection-status__retry"
          onClick={onRetry}
          aria-label="Retry connection"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// Inline loading state for buttons
export function ButtonLoadingState() {
  return (
    <div className="button-loading" role="status" aria-hidden="true">
      <LoadingSpinner size="sm" color="inherit" />
    </div>
  );
}

// Progress bar for file uploads
export function ProgressBar({ 
  progress, 
  label,
  showPercentage = true 
}: { 
  progress: number;
  label?: string;
  showPercentage?: boolean;
}) {
  const percentage = Math.round(Math.max(0, Math.min(100, progress)));
  
  return (
    <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
      {label && (
        <div className="progress-bar__label">
          {label}
          {showPercentage && <span className="progress-bar__percentage">{percentage}%</span>}
        </div>
      )}
      <div className="progress-bar__track">
        <div 
          className="progress-bar__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Skeleton for search results
export function SearchResultsSkeleton() {
  return (
    <div className="search-results-skeleton" aria-label="Loading search results">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="search-result-skeleton">
          <div className="search-result-skeleton__icon" />
          <div className="search-result-skeleton__content">
            <div className="search-result-skeleton__title" style={{ width: `${70 + Math.random() * 25}%` }} />
            <div className="search-result-skeleton__subtitle" style={{ width: `${50 + Math.random() * 30}%` }} />
          </div>
          <div className="search-result-skeleton__type" />
        </div>
      ))}
    </div>
  );
}

// Typing indicator with animation
export function TypingIndicator({ users }: { users: string[] }) {
  if (users.length === 0) return null;

  const displayText = users.length === 1 
    ? `${users[0]} is typing...`
    : `${users.slice(0, 2).join(', ')}${users.length > 2 ? ` and ${users.length - 2} others` : ''} are typing...`;

  return (
    <div className="typing-indicator" role="status" aria-live="polite">
      <div className="typing-indicator__dots">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="typing-indicator__text">{displayText}</span>
    </div>
  );
}