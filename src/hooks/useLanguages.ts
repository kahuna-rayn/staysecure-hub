import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Language {
  code: string;
  name: string;
  display_name?: string;
  native_name?: string;
  preferred_engine?: string;
  fallback_engine?: string;
  is_active: boolean;
  is_beta?: boolean;
  sort_order?: number;
  flag_emoji?: string;
}

export const useLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      setLanguages(data || []);
    } catch (err: any) {
      console.error('Error fetching languages:', err);
      setError(err.message || 'Failed to fetch languages');
      
      // Fallback to empty array if database fetch fails
      setLanguages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const getLanguageByCode = (code: string) => {
    return languages.find(lang => lang.code === code);
  };

  const getLanguageName = (code: string) => {
    const language = getLanguageByCode(code);
    return language?.native_name || language?.display_name || language?.name || code;
  };

  return {
    languages,
    loading,
    error,
    refetch: fetchLanguages,
    getLanguageByCode,
    getLanguageName
  };
};