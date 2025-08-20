import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      eventId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    console.group('🚨 Error Boundary Details');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.groupEnd();
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys = [], resetOnPropsChange = false } = this.props;
    const { hasError } = this.state;
    
    if (hasError && !prevProps.resetKeys && resetKeys) {
      // Reset if resetKeys are provided for the first time
      this.resetError();
    } else if (
      hasError &&
      resetKeys.length > 0 &&
      prevProps.resetKeys &&
      resetKeys.some((key, index) => key !== prevProps.resetKeys![index])
    ) {
      // Reset if any resetKey has changed
      this.resetError();
    } else if (
      hasError &&
      resetOnPropsChange &&
      JSON.stringify(this.props) !== JSON.stringify(prevProps)
    ) {
      // Reset if any prop has changed (when resetOnPropsChange is true)
      this.resetError();
    }
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: null,
      });
    }, 100);
  };

  render() {
    const { hasError, error, errorInfo, eventId } = this.state;
    const { children, fallbackComponent: FallbackComponent } = this.props;

    if (hasError) {
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            eventId={eventId}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          eventId={eventId}
        />
      );
    }

    return children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  eventId,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const errorDetails = React.useMemo(() => {
    return {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
      eventId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
  }, [error, errorInfo, eventId]);

  const copyErrorDetails = async () => {
    try {
      await navigator.clipboard.writeText(
        `Error Details:\n${JSON.stringify(errorDetails, null, 2)}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 border border-red-500/20 rounded-xl p-6 w-full max-w-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="text-gray-400">The application encountered an unexpected error</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h2 className="text-white font-medium mb-2">Error Message</h2>
            <p className="text-red-400 text-sm font-mono">{error?.message || 'Unknown error'}</p>
          </div>

          {eventId && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h2 className="text-white font-medium mb-2">Error ID</h2>
              <p className="text-gray-300 text-sm font-mono">{eventId}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <Bug size={16} />
              <span>{showDetails ? 'Hide' : 'Show'} technical details</span>
            </button>

            {showDetails && (
              <button
                onClick={copyErrorDetails}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <span>{copied ? 'Copied!' : 'Copy details'}</span>
              </button>
            )}
          </div>

          {showDetails && (
            <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={resetError}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex-1"
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>

            <button
              onClick={reloadPage}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex-1"
            >
              <Home size={16} />
              <span>Reload Page</span>
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              If this problem persists, please contact support with the error ID above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for programmatic error boundaries
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Captured error:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Async error boundary hook
export const useAsyncError = () => {
  const { captureError } = useErrorHandler();
  
  const throwAsyncError = React.useCallback((error: Error) => {
    setTimeout(() => {
      captureError(error);
    }, 0);
  }, [captureError]);

  return throwAsyncError;
};

export default ErrorBoundary;