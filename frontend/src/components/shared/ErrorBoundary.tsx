import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (future: send to logging service)
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            
            <h1 className="text-2xl font-bold text-text mb-2">Something went wrong</h1>
            <p className="text-text-muted mb-6">
              We encountered an unexpected error. Please try refreshing the page or return to the dashboard.
            </p>

            {this.state.error && import.meta.env.DEV && (
              <div className="bg-background border border-border rounded-lg p-4 mb-6 text-left">
                <p className="text-xs text-text-muted font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={this.handleReload} className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
