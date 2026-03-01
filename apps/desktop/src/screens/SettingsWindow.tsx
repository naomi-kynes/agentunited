import React, { useState } from 'react';
import { Button, Input } from '../components/ui';
import './SettingsWindow.css';

type SettingsTab = 'general' | 'account' | 'appearance' | 'keyboard' | 'advanced';

interface SettingsData {
  apiEndpoint: string;
  agentId: string;
  launchAtLogin: boolean;
  desktopNotifications: boolean;
  soundNotifications: boolean;
  dockBadge: boolean;
  displayName: string;
  theme: 'dark' | 'light' | 'system';
  fontSize: 'sm' | 'md' | 'lg';
}

interface SettingsWindowProps {
  onClose: () => void;
}

export function SettingsWindow({ onClose }: SettingsWindowProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SettingsData>({
    apiEndpoint: 'http://localhost:8080',
    agentId: 'ag_01H8XZ30A1B2C3D4E5F6G7H8I9',
    launchAtLogin: true,
    desktopNotifications: true,
    soundNotifications: true,
    dockBadge: true,
    displayName: 'Alice Smith',
    theme: 'dark',
    fontSize: 'md'
  });

  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'keyboard', label: 'Keyboard', icon: '⌨️' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ] as const;

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setSettings({
      apiEndpoint: 'http://localhost:8080',
      agentId: settings.agentId, // Don't reset agent ID
      launchAtLogin: false,
      desktopNotifications: true,
      soundNotifications: false,
      dockBadge: true,
      displayName: settings.displayName, // Don't reset display name
      theme: 'system',
      fontSize: 'md'
    });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      // Mock API call - replace with real settings save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const renderGeneralTab = () => (
    <div className="settings-content">
      <h2>General</h2>
      
      <div className="settings-section">
        <div className="form-group">
          <Input
            label="API Endpoint"
            value={settings.apiEndpoint}
            onChange={(e) => updateSetting('apiEndpoint', e.target.value)}
            placeholder="http://localhost:8080"
          />
          <p className="form-help">The API server URL for this instance</p>
        </div>

        <div className="form-group">
          <Input
            label="Agent ID"
            value={settings.agentId}
            disabled
            className="monospace"
          />
          <p className="form-help">Your unique agent identifier (read-only)</p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Startup</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.launchAtLogin}
            onChange={(e) => updateSetting('launchAtLogin', e.target.checked)}
          />
          <span className="checkbox-text">Start AgentUnited automatically when you log in</span>
        </label>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.desktopNotifications}
              onChange={(e) => updateSetting('desktopNotifications', e.target.checked)}
            />
            <span className="checkbox-text">Show desktop notifications for new messages</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.soundNotifications}
              onChange={(e) => updateSetting('soundNotifications', e.target.checked)}
            />
            <span className="checkbox-text">Play sound for new messages</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.dockBadge}
              onChange={(e) => updateSetting('dockBadge', e.target.checked)}
            />
            <span className="checkbox-text">Badge dock icon with unread count</span>
          </label>
        </div>
      </div>

      <div className="settings-actions">
        <Button variant="secondary" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="settings-content">
      <h2>Account</h2>
      
      <div className="settings-section">
        <div className="form-group">
          <Input
            label="Display Name"
            value={settings.displayName}
            onChange={(e) => updateSetting('displayName', e.target.value)}
            placeholder="Your display name"
          />
          <p className="form-help">This name will appear in messages and the sidebar</p>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="settings-content">
      <h2>Appearance</h2>
      
      <div className="settings-section">
        <h3>Theme</h3>
        <div className="radio-group">
          {[
            { value: 'system', label: 'System', description: 'Follow system appearance' },
            { value: 'dark', label: 'Dark', description: 'Dark theme (recommended)' },
            { value: 'light', label: 'Light', description: 'Light theme' }
          ].map(option => (
            <label key={option.value} className="radio-label">
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={settings.theme === option.value}
                onChange={(e) => updateSetting('theme', e.target.value)}
              />
              <div className="radio-content">
                <span className="radio-title">{option.label}</span>
                <span className="radio-description">{option.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Font Size</h3>
        <div className="radio-group">
          {[
            { value: 'sm', label: 'Small', description: '12px' },
            { value: 'md', label: 'Medium', description: '14px (default)' },
            { value: 'lg', label: 'Large', description: '16px' }
          ].map(option => (
            <label key={option.value} className="radio-label">
              <input
                type="radio"
                name="fontSize"
                value={option.value}
                checked={settings.fontSize === option.value}
                onChange={(e) => updateSetting('fontSize', e.target.value)}
              />
              <div className="radio-content">
                <span className="radio-title">{option.label}</span>
                <span className="radio-description">{option.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKeyboardTab = () => (
    <div className="settings-content">
      <h2>Keyboard</h2>
      
      <div className="settings-section">
        <h3>Shortcuts</h3>
        <div className="shortcuts-list">
          <div className="shortcut-item">
            <span className="shortcut-label">New Message</span>
            <kbd>Cmd+N</kbd>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-label">Search</span>
            <kbd>Cmd+K</kbd>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-label">Settings</span>
            <kbd>Cmd+,</kbd>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-label">Close Window</span>
            <kbd>Cmd+W</kbd>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="settings-content">
      <h2>Advanced</h2>
      
      <div className="settings-section">
        <p className="section-description">
          Advanced settings for debugging and development. Use with caution.
        </p>
        
        <div className="form-group">
          <Button variant="secondary">
            Clear Cache
          </Button>
          <p className="form-help">Clear all cached data and restart the application</p>
        </div>

        <div className="form-group">
          <Button variant="secondary">
            Export Logs
          </Button>
          <p className="form-help">Export application logs for debugging</p>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab();
      case 'account': return renderAccountTab();
      case 'appearance': return renderAppearanceTab();
      case 'keyboard': return renderKeyboardTab();
      case 'advanced': return renderAdvancedTab();
      default: return renderGeneralTab();
    }
  };

  return (
    <div className="settings-window">
      <div className="settings-sidebar">
        <div className="sidebar-header">
          <h1>Settings</h1>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="settings-main">
        {renderTabContent()}
        
        {hasChanges && (
          <div className="settings-footer">
            <div className="footer-actions">
              <Button variant="secondary" onClick={() => setHasChanges(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveSettings}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}