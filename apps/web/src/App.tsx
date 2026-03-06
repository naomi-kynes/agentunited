import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { ChatPage } from './pages/ChatPage';
import { AgentFoundationSettingsPage } from './pages/AgentFoundationSettingsPage';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { TunnelDashboardPage } from './pages/TunnelDashboardPage';
import { PairInstancePage } from './pages/PairInstancePage';
import { initializeFromUrlParams } from './services/apiConfig';
import { AuthService, autoLogin } from './services/authService';

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = AuthService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [autoLoginRedirect, setAutoLoginRedirect] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Parse URL parameters and update API configuration
        const { instanceChanged, token } = initializeFromUrlParams();

        // Handle auto-login if token is provided
        if (token) {
          const result = await autoLogin(token);
          if (result.success) {
            // Clear URL parameters after successful login
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            // Keep instance parameter for visibility, but could remove if desired
            // url.searchParams.delete('instance');
            window.history.replaceState({}, '', url.toString());
            
            // Redirect to chat after initialization
            setAutoLoginRedirect('/chat');
          } else {
            console.error('Auto-login failed:', result.error);
            // Could show an error message to user
          }
        }

        if (instanceChanged) {
          console.log('Connected to instance:', window.location.search);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Initializing Agent United...
      </div>
    );
  }

  return (
    <BrowserRouter>
      {autoLoginRedirect && (
        <Navigate to={autoLoginRedirect} replace />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite" element={<InviteAcceptPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents/:agentId/settings"
          element={
            <ProtectedRoute>
              <AgentFoundationSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tunnel"
          element={
            <ProtectedRoute>
              <TunnelDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pair-instance"
          element={
            <ProtectedRoute>
              <PairInstancePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
