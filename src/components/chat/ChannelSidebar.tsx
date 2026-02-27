import type { Channel } from '../../types/chat';

interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannel: string;
  onSelectChannel: (channelId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ChannelSidebar({
  channels,
  selectedChannel,
  onSelectChannel,
  isOpen,
  onClose
}: ChannelSidebarProps) {
  const handleChannelClick = (channelId: string) => {
    onSelectChannel(channelId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gray-900 text-white
          transform transition-transform duration-200 ease-in-out
          lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Agent United</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-800 rounded"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Channels section */}
          <div className="flex-1 p-4">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Channels
              </h3>
              <nav>
                <ul className="space-y-1">
                  {channels.map((channel) => (
                    <li key={channel.id}>
                      <button
                        onClick={() => handleChannelClick(channel.id)}
                        className={`
                          w-full text-left px-3 py-2 rounded transition-colors
                          ${selectedChannel === channel.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-800 text-gray-300'
                          }
                        `}
                        aria-current={selectedChannel === channel.id ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">#</span>
                          <span className="flex-1">{channel.name}</span>
                          {channel.memberCount && (
                            <span className="text-xs text-gray-500">
                              {channel.memberCount}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* User info at bottom */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
                {(localStorage.getItem('user-email') || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {localStorage.getItem('user-email')?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-400">Online</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
