import { useState } from 'react';
import { ChannelSidebar } from '../components/chat/ChannelSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { useWebSocket } from '../hooks/useWebSocket';
import { mockChannels } from '../services/mockData';

export function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState('general');
  
  const { isConnected, messages, sendMessage } = useWebSocket(
    'ws://localhost:8080/ws',
    selectedChannelId
  );

  const selectedChannel = mockChannels.find(ch => ch.id === selectedChannelId) || null;

  const handleSendMessage = (text: string) => {
    sendMessage(text);
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <ChannelSidebar
        channels={mockChannels}
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
