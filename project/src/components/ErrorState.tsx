import { AlertCircle, RefreshCw, ServerCrash } from 'lucide-react';
import { classifyError } from '@/api/client';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const classified = classifyError(error);

  const iconMap: Record<string, typeof AlertCircle> = {
    cors: ServerCrash,
    network: ServerCrash,
    server: ServerCrash,
    unauthorized: AlertCircle,
    forbidden: AlertCircle,
    not_found: AlertCircle,
    client: AlertCircle,
    unknown: AlertCircle,
  };

  const Icon = iconMap[classified.type] || AlertCircle;

  const heading =
    title ||
    (classified.type === 'cors'
      ? 'Cannot connect to server'
      : classified.type === 'network'
      ? 'Connection failed'
      : 'Something went wrong');

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-error-500" />
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-2">{heading}</h3>
      <p className="text-sm text-navy-500 max-w-md leading-relaxed mb-4">
        {classified.message}
      </p>
      {classified.type === 'cors' && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md text-left mb-4">
          <p className="text-xs text-navy-600 font-medium mb-1">How to fix CORS:</p>
          <p className="text-xs text-navy-400 leading-relaxed">
            In your Django backend, add this app's origin to
            <code className="mx-1 px-1.5 py-0.5 bg-slate-200 rounded text-navy-700">CORS_ALLOWED_ORIGINS</code>
            in settings.py, and ensure
            <code className="mx-1 px-1.5 py-0.5 bg-slate-200 rounded text-navy-700">django-cors-headers</code>
            is installed and in MIDDLEWARE.
          </p>
        </div>
      )}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  );
}
