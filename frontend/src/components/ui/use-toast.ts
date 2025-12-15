// Simplified toast hook for local development
import { useState, useCallback } from 'react';

type Toast = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant }: Toast) => {
    // Simple console logging for now
    const prefix = variant === 'destructive' ? '❌' : '✅';
    console.log(`${prefix} ${title}${description ? `: ${description}` : ''}`);

    // You can enhance this to show actual toast notifications
    setToasts(prev => [...prev, { title, description, variant }]);

    // Auto-clear after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 3000);
  }, []);

  return { toast };
};
