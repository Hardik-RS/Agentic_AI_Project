import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
      <p className="text-sm text-navy-500 font-medium">{message}</p>
    </div>
  );
}

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} style={{ width: size, height: size }} />;
}

export function ShimmerBlock({ className = '' }: { className?: string }) {
  return <div className={`shimmer-bg rounded-lg ${className}`} />;
}
