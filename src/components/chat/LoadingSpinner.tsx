import { Loader2 } from 'lucide-react';
import type { FC } from 'react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ size = 24, className }) => {
  return <Loader2 className={`animate-spin text-primary ${className}`} style={{ width: size, height: size }} />;
};

export default LoadingSpinner;
