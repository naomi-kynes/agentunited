import { useState, useEffect, useCallback } from 'react';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { CreateChannelModal } from '../components/chat/CreateChannelModal';
import { useWebSocket } from '../hooks/useWebSocket';
import { chatApi } from '../services/chatApi';
import type { Channel } from '../types/chat';

export function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  // TODO: Implement search functionality
  // const [searchResults, setSearchResults] = useState<Message[] | null>(null);
  // const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { messages, sendMessage, error: wsError } = useWebSocket('ws://localhost:8080/ws', selectedChannelId);

  // Load channels on component mount
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setChannelsLoading(true);
        setChannelsError(null);
        
        const fetchedChannels = await chatApi.getChannels();
        setChannels(fetchedChannels);
        
        // Auto-select first channel if none selected
        if (fetchedChannels.length > 0 && !selectedChannelId) {
          setSelectedChannelId(fetchedChannels[0].id);
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
        setChannelsError(error instanceof Error ? error.message : 'Failed to load channels');
      } finally {
        setChannelsLoading(false);
      }
    };

    loadChannels();
  }, [selectedChannelId]);

  const selectedChannel = channels.find(ch => ch.id === selectedChannelId) || null;

  const handleSendMessage = (text: string) => {
    sendMessage(text);
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  const handleDMSelect = (dmId: string) => {
    // TODO: Handle direct message selection
    console.log('Selected DM:', dmId);
  };

  const handleCreateChannel = useCallback(async (name: string, description: string) => {
    const newChannel = await chatApi.createChannel(name, description);
    setChannels(prev => [...prev, newChannel]);
    setSelectedChannelId(newChannel.id);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    console.log('Search not implemented yet:', query);
    // TODO: Implement search functionality
  }, []);

  const handleChannelUpdate = useCallback((updatedChannel: Channel) => {
    setChannels(prev => prev.map(ch => ch.id === updatedChannel.id ? updatedChannel : ch));
  }, []);

  const handleChannelDelete = useCallback((channelId: string) => {
    setChannels(prev => prev.filter(ch => ch.id !== channelId));
    if (selectedChannelId === channelId && channels.length > 1) {
      const remaining = channels.filter(ch => ch.id !== channelId);
      setSelectedChannelId(remaining[0]?.id || '');
    }
  }, [selectedChannelId, channels]);

  // Show loading state while channels are loading
  if (channelsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-medium text-foreground mb-2">Loading channels...</div>
          <div className="text-sm text-muted-foreground">Connecting to Agent United</div>
        </div>
      </div>
    );
  }

  // Show error state if channels failed to load
  if (channelsError) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-lg font-medium text-destructive mb-2">Failed to load channels</div>
          <div className="text-sm text-destructive-foreground mb-4">{channelsError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no channels
  if (channels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-lg font-medium text-foreground mb-2">No channels available</div>
          <div className="text-sm text-muted-foreground">Contact an agent to get access to channels</div>
        </div>
      </div>
    );
  }

  // TODO: Fetch DMs from API when DM support is added
  const directMessages: { id: string; name: string; type: 'agent' | 'human'; online: boolean; unread: number }[] = [];

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <ChatSidebar
        channels={channels}
        directMessages={directMessages}
        activeChannelId={selectedChannelId}
        onChannelSelect={handleSelectChannel}
        onDMSelect={handleDMSelect}
        onCreateChannel={() => setShowCreateChannel(true)}
        onSearch={handleSearch}
        onChannelUpdate={handleChannelUpdate}
        onChannelDelete={handleChannelDelete}
      />

      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onSubmit={handleCreateChannel}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader
          channelName={selectedChannel?.name || 'unknown'}
          topic={selectedChannel?.topic}
        />

        <MessageList messages={messages} />

        {wsError && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
            <div className="text-sm text-destructive">{wsError}</div>
          </div>
        )}

        <MessageInput
          onSend={handleSendMessage}
          placeholder={`Message #${selectedChannel?.name || 'general'}`}
        />
      </div>
    </div>
  );
}