import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from '../types/chat';
import { createMockWebSocket, type MockWebSocket } from '../services/mockWebSocket';
import { mockMessages } from '../services/mockData';

interface UseWebSocketReturn {
  isConnected: boolean;
  messages: Message[];
  sendMessage: (text: string) => void;
  error: string | null;
}

export function useWebSocket(url: string, channelId: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<MockWebSocket | null>(null);

  useEffect(() => {
    // Initialize with mock messages for the current channel
    const channelMessages = mockMessages.filter(msg => msg.channelId === channelId);
    setMessages(channelMessages);

    // Create WebSocket connection
    const ws = createMockWebSocket(url);
    wsRef.current = ws;

    ws.connect((wsMessage) => {
      switch (wsMessage.type) {
        case 'connected':
          setIsConnected(true);
          setError(null);
          console.log('WebSocket connected');
          break;

        case 'message':
          if (wsMessage.message) {
            // Only add if it's for the current channel
            if (wsMessage.message.channelId === channelId) {
              setMessages((prev) => [...prev, wsMessage.message!]);
            }
          }
          break;

        case 'error':
          setError(wsMessage.data?.message || 'WebSocket error');
          setIsConnected(false);
          
          // Attempt reconnection
          if (wsRef.current) {
            wsRef.current.reconnect(() => {
              // Re-use the same message handler
              ws.connect(() => {});
            });
          }
          break;

        default:
          console.log('Unknown message type:', wsMessage.type);
      }
    });

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [url, channelId]);

  // Update messages when channel changes
  useEffect(() => {
    const channelMessages = mockMessages.filter(msg => msg.channelId === channelId);
    setMessages((prev) => {
      // Keep any user-sent messages for this channel
      const userMessages = prev.filter(msg => msg.isOwnMessage && msg.channelId === channelId);
      return [...channelMessages, ...userMessages];
    });
  }, [channelId]);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(text, channelId, 'user-me', 'You');
    }
  }, [isConnected, channelId]);

  return {
    isConnected,
    messages,
    sendMessage,
    error
  };
}
