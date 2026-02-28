import type { Channel } from '../../types/chat';

interface ChatHeaderProps {
  channel: Channel | null;
  isConnected: boolean;
  onMenuClick?: () => void;
}

export function ChatHeader({ channel, isConnected, onMenuClick }: ChatHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">
              # {channel?.name || 'general'}
            </h1>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                aria-label={isConnected ? 'Connected' : 'Disconnected'}
              />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          {channel?.topic && (
            <p className="text-sm text-gray-600 mt-1">{channel.topic}</p>
          )}
        </div>

        {channel?.memberCount && (
          <div className="hidden sm:flex items-center gap-1 text-sm text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>{channel.memberCount} members</span>
          </div>
        )}
      </div>
    </header>
  );
}
