import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingOverlay({
  isVisible,
  message = 'Loading...',
  size = 'lg',
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <Spinner size={size} text={message} />
      </div>
    </div>
  );
}
