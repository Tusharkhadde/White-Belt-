import { Component, type ReactNode } from 'react';
import { Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center ring-1 ring-destructive/20 mx-auto">
              <Warning weight="bold" className="size-7 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                An unexpected error occurred. Your data is safe — this is a rendering issue, not a data loss.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-muted-foreground/60 font-mono bg-muted/30 rounded-lg p-3 break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} size="sm">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
