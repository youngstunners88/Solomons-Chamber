/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - ERROR BOUNDARY
 * ═══════════════════════════════════════════════════════════════
 */

import React, { Component, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  readonly hasError: boolean;
  readonly error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <h2>Something went wrong.</h2>
            <p>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
