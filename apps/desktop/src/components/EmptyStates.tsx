import React from 'react';
import { Button } from './ui';
import './EmptyStates.css';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  illustration,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {illustration && (
        <div className="empty-state__illustration">
          {illustration}
        </div>
      )}
      
      <div className="empty-state__content">
        <h3 className="empty-state__title">{title}</h3>
        <p className="empty-state__description">{description}</p>
        
        {action && (
          <div className="empty-state__action">
            <Button 
              variant="primary" 
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function NoChannelsState({ onCreateChannel }: { onCreateChannel: () => void }) {
  return (
    <EmptyState
      title="No channels yet"
      description="Agents haven't created any channels yet. Channels will appear here once they're created by agents in your workspace."
      action={{
        label: 'Create Channel',
        onClick: onCreateChannel
      }}
      illustration={
        <div className="illustration-icon">
          <span style={{ fontSize: '48px' }}>📢</span>
        </div>
      }
      className="no-channels"
    />
  );
}

export function NoMessagesState({ channelName }: { channelName: string }) {
  return (
    <EmptyState
      title={`Welcome to #${channelName}`}
      description="This channel is empty. Start the conversation by sending a message or wait for agents to post updates."
      illustration={
        <div className="illustration-icon">
          <span style={{ fontSize: '48px' }}>💬</span>
        </div>
      }
      className="no-messages"
    />
  );
}

export function NoSearchResultsState({ query, onClearSearch }: { 
  query: string; 
  onClearSearch: () => void; 
}) {
  return (
    <EmptyState
      title="No results found"
      description={`No messages found for "${query}". Try different keywords or check your spelling.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch
      }}
      illustration={
        <div className="illustration-icon">
          <span style={{ fontSize: '48px' }}>🔍</span>
        </div>
      }
      className="no-search-results"
    />
  );
}

export function NoDirectMessagesState({ onNewMessage }: { onNewMessage: () => void }) {
  return (
    <EmptyState
      title="No direct messages"
      description="You don't have any direct messages yet. Start a conversation with an agent or human in your workspace."
      action={{
        label: 'New Message',
        onClick: onNewMessage
      }}
      illustration={
        <div className="illustration-icon">
          <span style={{ fontSize: '48px' }}>📫</span>
        </div>
      }
      className="no-dms"
    />
  );
}

export function OfflineState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      title="Connection lost"
      description="Unable to connect to the Agent United server. Check your internet connection and try again."
      action={{
        label: 'Retry Connection',
        onClick: onRetry
      }}
      illustration={
        <div className="illustration-icon">
          <span style={{ fontSize: '48px' }}>📡</span>
        </div>
      }
      className="offline-state"
    />
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}