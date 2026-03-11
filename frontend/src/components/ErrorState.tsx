interface ErrorStateProps {
  type: 'loading' | 'error' | 'empty';
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ type, message, onRetry }: ErrorStateProps) {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center gap-4">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Loading venue data...</p>
      </div>
    );
  }

  if (type === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center gap-4">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No seats available in this venue.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-16 text-center gap-4">
      <p className="text-gray-400 dark:text-gray-500 text-sm">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button
          className="px-6 py-2 bg-indigo-500 text-white border-none rounded-lg cursor-pointer text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}
