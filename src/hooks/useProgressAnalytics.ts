import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProgressAnalyticsData {
  totalLearners: number;
  activeLessons: number;
  completionRate: number;
  avgSessionTime: number;
  lessonCompletionRates: Array<{
    title: string;
    completionRate: number;
    usersAttempted: number;
    usersCompleted: number;
  }>;
  recentActivity: Array<{
    timestamp: string;
    userFullName: string;
    lessonTitle: string;
    action: string;
    score?: number;
  }>;
}

export const useProgressAnalytics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['progress-analytics'],
    queryFn: async (): Promise<ProgressAnalyticsData> => {
      // Check if user has admin privileges for analytics
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasAdminRole = userRoles?.some(role => 
        ['super_admin', 'client_admin', 'manager'].includes(role.role)
      );

      console.log('🔍 Admin Check Debug:', {
        userId: user.id,
        userRoles: userRoles?.map(r => r.role),
        hasAdminRole
      });

      if (!hasAdminRole) {
        console.log('🚫 User is not admin, returning empty analytics data');
        // Return empty data for non-admin users
        return {
          totalLearners: 0,
          activeLessons: 0,
          completionRate: 0,
          avgSessionTime: 0,
          lessonCompletionRates: [],
          recentActivity: []
        };
      }

      console.log('✅ User is admin, proceeding with analytics queries');
      
      // Get total learners
      const { count: totalLearners, error: totalLearnersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Total Learners Query:', { totalLearners, totalLearnersError });

      // Get active lessons
      const { count: activeLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Get lesson progress data for recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      console.log('🔍 Querying user_lesson_progress with date filter:', sevenDaysAgo);
      
      const { data: allProgress, error: allProgressError } = await supabase
        .from('user_lesson_progress')
        .select('user_id, completed_at, lessons(title), profiles(full_name)')
        .not('completed_at', 'is', null)
        .gte('completed_at', sevenDaysAgo);

      console.log('🔍 Progress Analytics Debug:', {
        allProgressCount: allProgress?.length || 0,
        allProgressError: allProgressError ? {
          message: allProgressError.message,
          details: allProgressError.details,
          hint: allProgressError.hint,
          code: allProgressError.code
        } : null,
        sampleProgress: allProgress?.[0]
      });

      // Get lesson progress data for completion rate and avg session time
      const { data: progressData, error: progressDataError } = await supabase
        .from('user_lesson_progress')
        .select('user_id, completed_at, lessons(estimated_duration)')
        .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      console.log('📊 Progress Data Query:', {
        progressDataCount: progressData?.length || 0,
        progressDataError: progressDataError ? {
          message: progressDataError.message,
          details: progressDataError.details,
          hint: progressDataError.hint,
          code: progressDataError.code
        } : null
      });

      const uniqueActiveLearners = new Set(progressData?.map(d => d.user_id) || []).size;
      const completionRate = (totalLearners || 0) > 0 ? Math.round((uniqueActiveLearners / (totalLearners || 1)) * 100) : 0;
      
      // Calculate average session time from lesson durations
      const completedLessons = progressData?.filter(p => p.completed_at) || [];
      const avgSessionTime = completedLessons.length > 0 ? 
        Math.round(completedLessons.reduce((acc, curr) => acc + (curr.lessons?.estimated_duration || 10), 0) / completedLessons.length) : 0;

      // Get lessons that have progress activity, with completion rates
      const { data: lessonProgressData } = await supabase
        .from('user_lesson_progress')
        .select(`
          lesson_id,
          user_id,
          completed_at,
          lessons!inner(id, title, status)
        `)
        .eq('lessons.status', 'published');

      // Group progress by lesson and calculate completion rates
      const lessonProgressMap = new Map();
      
      if (lessonProgressData) {
        lessonProgressData.forEach(progress => {
          const lessonId = progress.lesson_id;
          const lessonTitle = progress.lessons?.title;
          
          if (!lessonProgressMap.has(lessonId)) {
            lessonProgressMap.set(lessonId, {
              title: lessonTitle,
              usersAttempted: new Set(),
              usersCompleted: new Set()
            });
          }
          
          const lessonData = lessonProgressMap.get(lessonId);
          lessonData.usersAttempted.add(progress.user_id);
          
          if (progress.completed_at) {
            lessonData.usersCompleted.add(progress.user_id);
          }
        });
      }

      // Convert to completion rates array and sort alphabetically
      let lessonCompletionRates = Array.from(lessonProgressMap.values())
        .map(lessonData => ({
          title: lessonData.title,
          completionRate: lessonData.usersAttempted.size > 0 
            ? Math.round((lessonData.usersCompleted.size / lessonData.usersAttempted.size) * 100) 
            : 0,
          usersAttempted: lessonData.usersAttempted.size,
          usersCompleted: lessonData.usersCompleted.size,
        }))
        .sort((a, b) => a.title.localeCompare(b.title)) // Sort alphabetically
        .slice(0, 10); // Show top 10 lessons

      console.log('📊 Lesson Completion Rates Debug:', {
        totalLessonsWithProgress: lessonProgressMap.size,
        lessonCompletionRates: lessonCompletionRates.map(lesson => ({
          title: lesson.title,
          completionRate: lesson.completionRate,
          usersAttempted: lesson.usersAttempted,
          usersCompleted: lesson.usersCompleted
        }))
      });

      // Use real lesson completion rates from database

      // Get real recent activity from user_lesson_progress
      let recentActivity = [];
      if (allProgress && allProgress.length > 0) {
        recentActivity = allProgress
          .filter(progress => progress.lessons && progress.completed_at)
          .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
          .slice(0, 10)
          .map(progress => {
            const profiles = progress.profiles as any;
            return {
              timestamp: progress.completed_at!,
              userFullName: (profiles && profiles.full_name) || 'Unknown User',
              lessonTitle: progress.lessons.title,
              action: 'completed',
              score: undefined, // TODO: Add score tracking from separate table
            };
          });
      }

      // Return real data only
      const hasRealData = (totalLearners && totalLearners > 0) || (activeLessons && activeLessons > 0);
      
      return {
        totalLearners: totalLearners || 0,
        activeLessons: activeLessons || 0,
        completionRate: completionRate,
        avgSessionTime: avgSessionTime,
        lessonCompletionRates,
        recentActivity,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  return { data, isLoading, error };
};