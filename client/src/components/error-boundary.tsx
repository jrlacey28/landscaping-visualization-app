import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-700">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-white/80 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}