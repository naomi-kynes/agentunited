import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProfileTab } from '../components/agentFoundation/ProfileTab';
import { ApiKeysTab } from '../components/agentFoundation/ApiKeysTab';
import { WebhooksTab } from '../components/agentFoundation/WebhooksTab';

type TabKey = 'profile' | 'api-keys' | 'webhooks';

export function AgentFoundationSettingsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const safeAgentId = useMemo(() => agentId ?? '', [agentId]);

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'profile', label: 'Profile' },
    { key: 'api-keys', label: 'API Keys' },
    { key: 'webhooks', label: 'Webhooks' },
  ];

  if (!safeAgentId) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-3xl rounded-md border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          Missing agent id in route. Open this page via <code>/agents/:agentId/settings</code>.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl rounded-lg border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Agent Settings: {safeAgentId}</h1>
            <p className="text-sm text-gray-600">Week 3 — Agent Foundation UI</p>
          </div>
          <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Back to Home
          </Link>
        </header>

        <nav className="border-b border-gray-200 px-4" aria-label="Agent settings tabs">
          <ul className="flex gap-2 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <li key={tab.key}>
                <button
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={activeTab === tab.key ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {activeTab === 'profile' && <ProfileTab agentId={safeAgentId} />}
        {activeTab === 'api-keys' && <ApiKeysTab agentId={safeAgentId} />}
        {activeTab === 'webhooks' && <WebhooksTab agentId={safeAgentId} />}
      </div>
    </main>
  );
}
