import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from './ui';
import './ErrorBoundary.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'component' | 'feature';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to external service if available
    this.reportError(error, errorInfo);
  }

  private generateErrorId(): string {
    return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In a real app, this would send to error reporting service
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Mock error reporting
    console.warn('Error Report:', errorReport);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportIssue = () => {
    const errorDetails = encodeURIComponent(
      `Error ID: ${this.state.errorId}\n` +
      `Message: ${this.state.error?.message}\n` +
      `Stack: ${this.state.error?.stack}\n` +
      `Component Stack: ${this.state.errorInfo?.componentStack}`
    );
    
    const issueUrl = `https://github.com/agentunited/agentunited/issues/new?` +
      `title=Error%20Report%3A%20${encodeURIComponent(this.state.error?.message || 'Unknown Error')}&` +
      `body=${errorDetails}`;
    
    window.open(issueUrl, '_blank');
  };

  private renderAppLevelError() {
    return (
      <div className="error-boundary error-boundary--app">
        <div className="error-content">
          <div className="error-icon">
            <span>⚠️</span>
          </div>
          
          <h1 className="error-title">Oops! Something went wrong</h1>
          <p className="error-description">
            Agent United encountered an unexpected error. We apologize for the inconvenience.
          </p>
          
          <div className="error-details">
            <details className="error-details-toggle">
              <summary>Technical Details</summary>
              <div className="error-details-content">
                <div className="error-field">
                  <strong>Error ID:</strong> <code>{this.state.errorId}</code>
                </div>
                <div className="error-field">
                  <strong>Message:</strong> <code>{this.state.error?.message}</code>
                </div>
                {this.state.error?.stack && (
                  <div className="error-field">
                    <strong>Stack Trace:</strong>
                    <pre className="error-stack">{this.state.error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          </div>
          
          <div className="error-actions">
            <Button variant="primary" onClick={this.handleRetry}>
              Try Again
            </Button>
            <Button variant="secondary" onClick={this.handleReload}>
              Reload App
            </Button>
            <Button variant="secondary" onClick={this.handleReportIssue}>
              Report Issue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  private renderComponentLevelError() {
    return (
      <div className="error-boundary error-boundary--component">
        <div className="error-content">
          <div className="error-icon">
            <span>⚠️</span>
          </div>
          
          <h2 className="error-title">Component Error</h2>
          <p className="error-description">
            This part of the interface couldn't load properly.
          </p>
          
          <div className="error-actions">
            <Button variant="secondary" onClick={this.handleRetry} size="sm">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  private renderFeatureLevelError() {
    return (
      <div className="error-boundary error-boundary--feature">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span className="error-message">
            Failed to load. <button className="error-retry-link" onClick={this.handleRetry}>Try again</button>
          </span>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render based on error boundary level
      switch (this.props.level) {
        case 'app':
          return this.renderAppLevelError();
        case 'component':
          return this.renderComponentLevelError();
        case 'feature':
          return this.renderFeatureLevelError();
        default:
          return this.renderComponentLevelError();
      }
    }

    return this.props.children;
  }
}

// Higher-order component for error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting from components
export function useErrorHandler() {
  const reportError = (error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    
    // In a real app, report to error service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    console.warn('Error Report:', errorReport);
  };

  const handleAsyncError = (promise: Promise<any>, context?: string) => {
    promise.catch(error => {
      reportError(error, context);
    });
  };

  return { reportError, handleAsyncError };
}