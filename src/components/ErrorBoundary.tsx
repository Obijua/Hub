import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    componentStack: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, componentStack: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ componentStack: errorInfo?.componentStack || null });
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, componentStack: null });
    }
  }

  public render() {
    if (this.state.hasError) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const isLiveDomain = hostname === 'hubandjobs.com' || hostname === 'www.hubandjobs.com';
      const errorMessage = this.state.error?.message || String(this.state.error || 'Unknown error');
      const stackLines = (this.state.componentStack || '')
        .split('\n')
        .filter((line) => line.trim() !== '')
        .slice(0, 8)
        .join('\n');

      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '2px',
              padding: '20px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
              This page could not load.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#1E3B8B',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, error: null, componentStack: null })}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#1E3B8B',
                  border: '1px solid #E2E8F0',
                  borderRadius: '2px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Back to home
              </Link>
            </div>
            {!isLiveDomain && (
              <div
                style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#64748B',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '10px',
                  borderRadius: '2px',
                  overflowX: 'auto',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'left'
                }}
              >
                {errorMessage}
                {stackLines ? `\n${stackLines}` : ''}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
