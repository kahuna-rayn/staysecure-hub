
import { useState, useEffect } from 'react';

type ViewMode = 'cards' | 'list';

export const useViewPreference = (key: string, defaultValue: ViewMode = 'cards') => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(`viewPreference_${key}`);
      return (saved as ViewMode) || defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`viewPreference_${key}`, viewMode);
    } catch (error) {
      console.warn('Failed to save view preference:', error);
    }
  }, [key, viewMode]);

  return [viewMode, setViewMode] as const;
};
