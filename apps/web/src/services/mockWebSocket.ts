import type { Message, WebSocketMessage } from '../types/chat';

type MessageHandler = (message: WebSocketMessage) => void;

export class MockWebSocket {
  private messageHandler: MessageHandler | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private messageQueue: Message[] = [];

  constructor(_url: string) {
    // URL not used in mock implementation
  }

  connect(onMessage: MessageHandler): void {
    this.messageHandler = onMessage;
    
    // Simulate connection delay
    setTimeout(() => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Send connected event
      if (this.messageHandler) {
        this.messageHandler({
          type: 'connected',
          data: { timestamp: new Date().toISOString() }
        });
      }

      // Send any queued messages
      this.processQueue();
    }, 500);
  }

  disconnect(): void {
    this.isConnected = false;
    this.messageHandler = null;
  }

  send(text: string, channelId: string, authorId: string, author: string): void {
    if (!this.isConnected) {
      console.warn('Cannot send message: not connected');
      return;
    }

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      channelId,
      authorId,
      author,
      text,
      timestamp: new Date().toISOString(),
      isOwnMessage: true
    };

    // Queue message for processing
    this.messageQueue.push(message);
    
    // Simulate server processing delay (echo back)
    setTimeout(() => {
      this.processQueue();
    }, 1000);
  }

  private processQueue(): void {
    if (this.messageQueue.length > 0 && this.messageHandler && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.messageHandler({
          type: 'message',
          message
        });
      }
    }
  }

  reconnect(onMessage: MessageHandler): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.messageHandler) {
        this.messageHandler({
          type: 'error',
          data: { message: 'Max reconnection attempts reached' }
        });
      }
      return;
    }

    this.reconnectAttempts++;
    const backoffTime = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts - 1));
    
    console.log(`Reconnecting in ${backoffTime}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(onMessage);
    }, backoffTime);
  }
}

export function createMockWebSocket(url: string): MockWebSocket {
  return new MockWebSocket(url);
}
