import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TranslationRequest {
  lessonId: string;
  targetLanguage: string;
  translateNodes?: boolean;
}

interface TranslationStatus {
  lessonTranslated: boolean;
  totalNodes: number;
  translatedNodes: number;
  nodeProgress: number;
  overallProgress: number;
  isComplete: boolean;
}

export const useTranslation = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const translateLesson = useCallback(async (request: TranslationRequest) => {
    setLoading(true);
    
    try {
      console.log('=== TRANSLATION HOOK DEBUG START ===');
      console.log('Translation request:', request);
      
      toast({
        title: "Starting Translation",
        description: `Translating lesson to ${request.targetLanguage}...`,
      });

      console.log('Invoking translate-lesson function...');
      const { data, error } = await supabase.functions.invoke('translate-lesson', {
        body: request,
      });

      console.log('Function invocation result:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        console.error('Function returned success: false:', data);
        throw new Error(data.error || 'Translation failed');
      }

      console.log('Translation successful:', data);
      console.log('=== TRANSLATION HOOK DEBUG END ===');

      toast({
        title: "Translation Complete",
        description: data.message,
      });

      return { success: true, data: data.translation };
    } catch (error: any) {
      console.error('Translation error:', error);
      console.log('=== TRANSLATION HOOK DEBUG END (ERROR) ===');
      toast({
        title: "Translation Failed",
        description: error.message || 'Failed to translate lesson',
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getTranslationStatus = useCallback(async (lessonId: string, languageCode?: string): Promise<TranslationStatus | null> => {
    try {
      const params = new URLSearchParams({ lessonId });
      if (languageCode) {
        params.append('languageCode', languageCode);
      }

      const { data, error } = await supabase.functions.invoke('translation-status', {
        body: { lessonId, languageCode },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get translation status');
      }

      return data;
    } catch (error: any) {
      console.error('Translation status error:', error);
      return null;
    }
  }, []);

  const getTranslatedLesson = useCallback(async (lessonId: string, languageCode: string) => {
    try {
      // For now, return null since we can't access the translation tables directly
      // The edge functions will handle the database queries
      return null;
    } catch (error: any) {
      console.error('Error getting translated lesson:', error);
      return null;
    }
  }, []);

  return {
    translateLesson,
    getTranslationStatus,
    getTranslatedLesson,
    loading
  };
};