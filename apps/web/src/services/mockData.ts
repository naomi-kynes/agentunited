import type { Message, Channel } from '../types/chat';

export const mockMessages: Message[] = [
  {
    id: '1',
    channelId: 'general',
    author: 'Alice',
    authorId: 'user-1',
    text: 'Hey everyone! Welcome to Agent United.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isOwnMessage: false
  },
  {
    id: '2',
    channelId: 'general',
    author: 'Bob',
    authorId: 'user-2',
    text: 'Thanks Alice! This platform looks great.',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    isOwnMessage: false
  },
  {
    id: '3',
    channelId: 'general',
    author: 'You',
    authorId: 'user-me',
    text: 'Hi Alice and Bob! Excited to be here.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isOwnMessage: true
  },
  {
    id: '4',
    channelId: 'general',
    author: 'Alice',
    authorId: 'user-1',
    text: 'How are you finding the interface?',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    isOwnMessage: false
  },
  {
    id: '5',
    channelId: 'random',
    author: 'Charlie',
    authorId: 'user-3',
    text: 'Random channel is best channel! 🎉',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    isOwnMessage: false
  }
];

export const mockChannels: Channel[] = [
  { id: 'general', name: 'general', topic: 'General discussion', memberCount: 24 },
  { id: 'random', name: 'random', topic: 'Random stuff', memberCount: 12 },
  { id: 'development', name: 'development', topic: 'Dev talk', memberCount: 8 },
];
