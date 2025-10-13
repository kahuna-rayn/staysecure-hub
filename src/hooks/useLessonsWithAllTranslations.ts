import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LessonTranslation {
  language_code: string;
  title_translated: string;
  description_translated?: string;
  status: string;
  updated_at: string;
}

interface LessonWithAllTranslations {
  id: string;
  title: string; // Original English title
  description: string; // Original English description
  status: string;
  created_at: string;
  updated_at: string;
  estimated_duration: number;
  lesson_type?: string;
  translations: LessonTranslation[];
}

export const useLessonsWithAllTranslations = () => {
  const [lessons, setLessons] = useState<LessonWithAllTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLessons = async () => {
    try {
      // Fetch all lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (lessonsError) throw lessonsError;

      // Fetch all translations for all lessons
      const lessonIds = (lessonsData || []).map(lesson => lesson.id);
      const { data: translationsData, error: translationsError } = await supabase
        .from('lesson_translations')
        .select('*')
        .in('lesson_id', lessonIds)
        .not('title_translated', 'is', null); // Only get translations that have titles

      if (translationsError) {
        console.warn('Failed to fetch translations:', translationsError);
        // Fall back to lessons without translations
        const lessonsWithoutTranslations = (lessonsData || []).map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          status: lesson.status,
          created_at: lesson.created_at,
          updated_at: lesson.updated_at,
          estimated_duration: lesson.estimated_duration,
          lesson_type: lesson.lesson_type,
          translations: []
        }));
        setLessons(lessonsWithoutTranslations);
        return;
      }

      // Group translations by lesson
      const translationsByLesson = (translationsData || []).reduce((acc: any, translation: any) => {
        if (!acc[translation.lesson_id]) {
          acc[translation.lesson_id] = [];
        }
        acc[translation.lesson_id].push({
          language_code: translation.language_code,
          title_translated: translation.title_translated,
          description_translated: translation.description_translated,
          status: translation.status,
          updated_at: translation.updated_at
        });
        return acc;
      }, {});

      // Combine lessons with their translations
      const processedLessons = (lessonsData || []).map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        status: lesson.status,
        created_at: lesson.created_at,
        updated_at: lesson.updated_at,
        estimated_duration: lesson.estimated_duration,
        lesson_type: lesson.lesson_type,
        translations: translationsByLesson[lesson.id] || []
      }));

      setLessons(processedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lessons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  return {
    lessons,
    loading,
    refetch: fetchLessons
  };
};
