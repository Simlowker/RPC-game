import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Generic Loading Spinner
export const LoadingSpinner: React.FC<{
  size?: number;
  className?: string;
  color?: string;
}> = ({ 
  size = 24, 
  className = '', 
  color = 'text-blue-400' 
}) => (
  <Loader2 
    size={size} 
    className={`animate-spin ${color} ${className}`} 
  />
);

// Full Screen Loading
export const FullScreenLoading: React.FC<{
  message?: string;
  submessage?: string;
}> = ({ 
  message = 'Loading...', 
  submessage 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size={48} className="mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">{message}</h2>
      {submessage && (
        <p className="text-gray-400">{submessage}</p>
      )}
    </div>
  </div>
);

// Inline Loading
export const InlineLoading: React.FC<{
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <LoadingSpinner size={sizeMap[size]} />
      <span className="text-gray-400">{message}</span>
    </div>
  );
};

// Button Loading State
export const LoadingButton: React.FC<{
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({ 
  loading, 
  disabled, 
  children, 
  className = '', 
  onClick, 
  type = 'button' 
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={loading || disabled}
    className={`flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {loading && <LoadingSpinner size={16} />}
    <span>{children}</span>
  </button>
);

// Connection Status Indicator
export const ConnectionStatus: React.FC<{
  connected: boolean;
  connecting?: boolean;
}> = ({ connected, connecting = false }) => (
  <div className="flex items-center space-x-2">
    {connecting ? (
      <>
        <LoadingSpinner size={12} />
        <span className="text-yellow-400 text-sm">Connecting...</span>
      </>
    ) : connected ? (
      <>
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        <span className="text-green-400 text-sm">Connected</span>
      </>
    ) : (
      <>
        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
        <span className="text-red-400 text-sm">Disconnected</span>
      </>
    )}
  </div>
);

// Skeleton Components
export const SkeletonText: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '' 
}) => (
  <div className={`bg-gray-700 rounded animate-pulse ${width} ${height} ${className}`} />
);

export const SkeletonBox: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ 
  width = 'w-full', 
  height = 'h-20', 
  className = '' 
}) => (
  <div className={`bg-gray-700 rounded-lg animate-pulse ${width} ${height} ${className}`} />
);

// Match Card Skeleton
export const MatchCardSkeleton: React.FC = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
    <div className="animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
          <SkeletonText width="w-32" />
        </div>
        <SkeletonText width="w-20" />
      </div>
      
      <div className="flex justify-between items-center">
        <SkeletonText width="w-40" />
        <SkeletonBox width="w-16" height="h-8" />
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-gray-600 rounded"></div>
        <SkeletonText width="w-24" />
      </div>
    </div>
  </div>
);

// Match List Skeleton
export const MatchListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <MatchCardSkeleton key={i} />
    ))}
  </div>
);

// Match Room Skeleton
export const MatchRoomSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <SkeletonText width="w-32" height="h-6" />
      <SkeletonBox width="w-24" height="h-16" />
    </div>

    {/* Status Card Skeleton */}
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            <SkeletonText width="w-48" height="h-6" />
          </div>
          <SkeletonText width="w-20" />
        </div>

        {/* Players Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-700/50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <SkeletonText width="w-16" />
                </div>
                <SkeletonText width="w-32" />
                <SkeletonText width="w-28" height="h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Action Area Skeleton */}
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="animate-pulse space-y-4">
        <SkeletonText width="w-40" height="h-6" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonBox key={i} height="h-24" />
          ))}
        </div>
        <div className="flex justify-center">
          <SkeletonBox width="w-32" height="h-10" />
        </div>
      </div>
    </div>
  </div>
);

// Wallet Connection Skeleton
export const WalletSkeleton: React.FC = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
    <div className="animate-pulse text-center space-y-4">
      <SkeletonBox width="w-16 mx-auto" height="h-16" className="rounded-full" />
      <SkeletonText width="w-48 mx-auto" height="h-6" />
      <SkeletonText width="w-64 mx-auto" />
      <SkeletonBox width="w-32 mx-auto" height="h-10" />
    </div>
  </div>
);

// Error State Component
export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}> = ({ 
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try Again'
}) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
    <div className="flex items-center space-x-3 mb-4">
      <AlertCircle className="text-red-400" size={24} />
      <div>
        <h3 className="text-red-400 font-medium">{title}</h3>
        <p className="text-red-300 text-sm">{message}</p>
      </div>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
      >
        {retryLabel}
      </button>
    )}
  </div>
);

// Empty State Component
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    {icon && (
      <div className="flex justify-center mb-4 text-gray-600">
        {icon}
      </div>
    )}
    <h3 className="text-gray-400 text-lg font-medium">{title}</h3>
    <p className="text-gray-500 mt-1 mb-4">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// Progressive Loading Component
export const ProgressiveLoading: React.FC<{
  stages: string[];
  currentStage: number;
}> = ({ stages, currentStage }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <LoadingSpinner size={24} />
        <h3 className="text-white font-medium">Loading...</h3>
      </div>
      
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 p-2 rounded ${
              index < currentStage
                ? 'text-green-400 bg-green-500/10'
                : index === currentStage
                ? 'text-blue-400 bg-blue-500/10'
                : 'text-gray-500'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                index < currentStage
                  ? 'bg-green-400'
                  : index === currentStage
                  ? 'bg-blue-400 animate-pulse'
                  : 'bg-gray-600'
              }`}
            />
            <span className="text-sm">{stage}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);