import type { Message } from '../../types/chat';

interface MessageItemProps {
  message: Message;
}

function getRelativeTime(timestamp: string): string {
  const now = new Date().getTime();
  const messageTime = new Date(timestamp).getTime();
  const diffMs = now - messageTime;
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MessageItem({ message }: MessageItemProps) {
  const { author, text, timestamp, isOwnMessage } = message;
  const relativeTime = getRelativeTime(timestamp);
  const initials = getInitials(author);

  if (isOwnMessage) {
    return (
      <li className="flex justify-end items-start gap-2 px-4 py-2">
        <div className="flex flex-col items-end max-w-md md:max-w-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">{relativeTime}</span>
            <span className="text-sm font-medium text-gray-900">{author}</span>
          </div>
          <div className="bg-blue-600 text-white rounded-lg px-4 py-2 break-words">
            <p className="text-sm whitespace-pre-wrap">{text}</p>
          </div>
        </div>
        <div
          className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-medium"
          aria-label={`${author}'s avatar`}
        >
          {initials}
        </div>
      </li>
    );
  }

  return (
    <li className="flex justify-start items-start gap-2 px-4 py-2">
      <div
        className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium"
        aria-label={`${author}'s avatar`}
      >
        {initials}
      </div>
      <div className="flex flex-col max-w-md md:max-w-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{author}</span>
          <span className="text-xs text-gray-500">{relativeTime}</span>
        </div>
        <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2 break-words">
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </li>
  );
}
