import { useState, useEffect } from 'react';
import { ChannelSidebar } from '../components/chat/ChannelSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { useWebSocket } from '../hooks/useWebSocket';
import { fetchChannels } from '../services/api';
import type { Channel } from '../types/chat';

export function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  // Load channels from API
  useEffect(() => {
    let cancelled = false;

    async function loadChannels() {
      try {
        const chs = await fetchChannels();
        if (!cancelled && chs.length > 0) {
          setChannels(chs);
          setSelectedChannelId(prev => prev || chs[0].id);
        }
      } catch (err) {
        console.error('Failed to load channels:', err);
      }
    }

    loadChannels();
    return () => { cancelled = true; };
  }, []);

  const { isConnected, messages, sendMessage } = useWebSocket(
    'ws://localhost:8080/ws',
    selectedChannelId
  );

  const selectedChannel = channels.find(ch => ch.id === selectedChannelId) || null;

  const handleSendMessage = (text: string) => {
    sendMessage(text);
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  if (channels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading channels...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <ChannelSidebar
        channels={channels}
        selectedChannel={selectedChannelId}
        onSelectChannel={handleSelectChannel}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader
          channel={selectedChannel}
          isConnected={isConnected}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <MessageList messages={messages} />

        <MessageInput
          onSend={handleSendMessage}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
}
