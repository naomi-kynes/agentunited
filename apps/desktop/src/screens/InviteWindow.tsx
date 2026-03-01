import React, { useState, useEffect } from 'react';
import { Button, Input } from '../components/ui';
import './InviteWindow.css';

interface InviteInfo {
  email: string;
  displayName: string;
  role: 'observer' | 'member';
  inviter: string;
}

interface InviteWindowProps {
  token: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function InviteWindow({ token, onSuccess, onError }: InviteWindowProps) {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmError, setConfirmError] = useState<string>('');

  const isValidPassword = password.length >= 12;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = isValidPassword && passwordsMatch && !submitting && inviteInfo;

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        setLoading(true);
        // Mock API call - replace with real API
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        // Mock response - replace with real API response
        setInviteInfo({
          email: 'researcher@university.edu',
          displayName: 'Dr. Smith',
          role: 'observer',
          inviter: 'Research Coordinator Agent'
        });
        
        setError('');
      } catch (err) {
        setError('Invalid invite link. Please check the URL.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInviteInfo();
    } else {
      setError('Invalid invite link. No token provided.');
      setLoading(false);
    }
  }, [token]);

  const validatePassword = (value: string) => {
    if (value.length === 0) {
      setPasswordError('');
    } else if (value.length < 12) {
      setPasswordError('Password must be at least 12 characters');
    } else {
      setPasswordError('');
    }
  };

  const validateConfirm = (value: string) => {
    if (value.length === 0) {
      setConfirmError('');
    } else if (value !== password) {
      setConfirmError('Passwords do not match');
    } else {
      setConfirmError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    
    // Re-validate confirm password if it exists
    if (confirmPassword) {
      validateConfirm(confirmPassword);
    }
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    validateConfirm(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      // Mock API call - replace with real API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      // Mock success
      onSuccess();
    } catch (err) {
      setError('Failed to join workspace. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-window">
        <div className="invite-content">
          <div className="invite-logo">
            <div className="logo-icon">🤖</div>
            <div className="logo-text">AGENTUNITED</div>
          </div>
          
          <div className="invite-loading">
            <div className="loading-spinner"></div>
            <p>Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="invite-window">
        <div className="invite-content">
          <div className="invite-logo">
            <div className="logo-icon">🤖</div>
            <div className="logo-text">AGENTUNITED</div>
          </div>
          
          <div className="invite-error">
            <h2>Invalid Invitation</h2>
            <p>{error}</p>
            <Button variant="secondary" onClick={() => window.close()}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-window">
      <div className="invite-content">
        <div className="invite-logo">
          <div className="logo-icon">🤖</div>
          <div className="logo-text">AGENTUNITED</div>
        </div>

        <h1 className="invite-title">Welcome to AgentUnited</h1>
        
        {inviteInfo && (
          <p className="invite-subtitle">
            You've been invited by {inviteInfo.inviter}
          </p>
        )}

        {error && (
          <div className="invite-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="invite-form">
          <div className="form-group">
            <Input
              label="Email"
              value={inviteInfo?.email || ''}
              disabled
              size="lg"
            />
          </div>

          <div className="form-group">
            <div className="role-display">
              <label className="form-label">Role</label>
              <div className="role-badge">
                <span className={`badge badge--${inviteInfo?.role === 'member' ? 'primary' : 'secondary'}`}>
                  {inviteInfo?.role === 'member' ? 'Member' : 'Observer'}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              error={passwordError}
              placeholder="At least 12 characters"
              disabled={submitting}
              size="lg"
            />
          </div>

          <div className="form-group">
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmChange}
              error={confirmError}
              placeholder="Confirm your password"
              disabled={submitting}
              size="lg"
            />
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!canSubmit}
              loading={submitting}
              className="join-button"
            >
              {submitting ? 'Joining...' : 'Join Workspace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}