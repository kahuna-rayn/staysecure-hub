import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, CheckCircle, Clock, Calendar, BookOpen, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { LessonViewer } from '@/components/lesson/LessonViewer';
import { loadLessonForPreview } from '@/lib/lessonPreview';
import { useLessonDataReadOnly } from '@/hooks/useLessonDataReadOnly';
import { useAuth } from '@/components/auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { calculateLessonAvailability, calculateTrackProgress, formatAvailableDate } from '@/lib/scheduling';
import { useLessonsWithTranslations } from '@/hooks/useLessonsWithTranslations';

interface LearningTrack {
  id: string;
  title: string;
  description: string;
  status: string;
  allow_parallel_tracks: boolean;
  schedule_type: string;
  start_date?: string | null;
  end_date?: string | null;
  duration_weeks?: number | null;
  lessons_per_week?: number | null;
  allow_all_lessons_immediately?: boolean;
  schedule_days?: number[];
  max_lessons_per_week?: number | null;
  progress?: {
    id: string;
    progress_percentage: number;
    current_lesson_order: number;
    next_available_date: string;
    enrolled_at: string;
    started_at: string;
    completed_at: string;
  };
  lesson_count?: number;
}

interface TrackLesson {
  id: string;
  order_index: number;
  lesson: {
    id: string;
    title: string;
    description: string;
    estimated_duration: number;
    status: string;
  };
  completed: boolean;
  completed_at?: string;
  available_date?: string;
  available: boolean;
  availability_reason?: string;
}

interface LearningTrackViewerProps {
  track: LearningTrack;
  onBack: () => void;
}

export const LearningTrackViewer = ({ track, onBack }: LearningTrackViewerProps) => {
  const [lessons, setLessons] = useState<TrackLesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Remove lessonCompleted state - let LessonViewer handle completion
  const [flattenedLesson, setFlattenedLesson] = useState<any>(null);
  const [flattenedLessonLoading, setFlattenedLessonLoading] = useState(false);
  // Remove language state management - let LessonViewer handle it internally
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    fetchTrackLessons();
  }, [track.id]);

  // Remove language management - let LessonViewer handle language preferences internally

  // Load flattened lesson when selectedLessonId changes
  useEffect(() => {
    if (selectedLessonId && selectedLessonId !== 'temp-id') {
      setFlattenedLessonLoading(true);
      loadLessonForPreview(selectedLessonId)
        .then(async (lesson) => {
          if (lesson) {
            // Get the lesson title and description from the lessons array
            const lessonInfo = lessons.find(l => l.lesson.id === selectedLessonId);
            
            // Use original lesson content - LessonViewer will handle translations
            setFlattenedLesson(lesson);
          }
        })
        .catch((error) => {
          console.error('Error loading lesson for track:', error);
          toast({
            title: "Error loading lesson",
            description: "Failed to load the lesson. Please try again.",
            variant: "destructive"
          });
        })
        .finally(() => {
          setFlattenedLessonLoading(false);
        });
    } else {
      setFlattenedLesson(null);
    }
  }, [selectedLessonId, lessons]);

  const fetchTrackLessons = async () => {
    try {
      const { data: trackLessons, error } = await supabase
        .from('learning_track_lessons')
        .select(`
          id,
          order_index,
          lessons!inner(
            id,
            title,
            description,
            estimated_duration,
            status
          )
        `)
        .eq('learning_track_id', track.id)
        .order('order_index');

      if (error) throw error;

      // Get user progress for each lesson
      const lessonsWithProgress = await Promise.all(
        (trackLessons || []).map(async (trackLesson, index) => {
          const { data: progressData } = await supabase
            .from('user_lesson_progress')
            .select('completed_at')
            .eq('lesson_id', trackLesson.lessons.id)
            .eq('user_id', user?.id || '')
            .maybeSingle();

          // Get user's track enrollment progress
          const { data: trackProgress } = await supabase
            .from('user_learning_track_progress')
            .select('enrolled_at, started_at, completed_at, current_lesson_order')
            .eq('learning_track_id', track.id)
            .eq('user_id', user?.id || '')
            .maybeSingle();

          // Calculate availability based on track scheduling
          const schedulingConfig = {
            schedule_type: track.schedule_type as any,
            start_date: track.start_date,
            end_date: track.end_date,
            duration_weeks: track.duration_weeks,
            lessons_per_week: track.lessons_per_week,
            allow_all_lessons_immediately: track.allow_all_lessons_immediately,
            schedule_days: track.schedule_days,
            max_lessons_per_week: track.max_lessons_per_week
          };

          const userProgress = {
            enrolled_at: trackProgress?.enrolled_at || new Date().toISOString(),
            started_at: trackProgress?.started_at,
            completed_at: trackProgress?.completed_at,
            current_lesson_order: trackProgress?.current_lesson_order || 0
          };

          const availability = calculateLessonAvailability(
            index,
            trackLessons.length,
            schedulingConfig,
            userProgress
          );

          return {
            ...trackLesson,
            lesson: trackLesson.lessons,
            completed: !!progressData?.completed_at,
            completed_at: progressData?.completed_at,
            available_date: availability.available_date.toISOString(),
            available: availability.available,
            availability_reason: availability.reason
          };
        })
      );

      setLessons(lessonsWithProgress);
    } catch (error) {
      console.error('Error fetching track lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch track lessons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startLesson = (lesson: any) => {
    if (!lesson.available) {
      toast({
        title: "Lesson not available",
        description: lesson.availability_reason || "This lesson is not available yet.",
        variant: "destructive"
      });
      return;
    }
    setSelectedLessonId(lesson.lesson.id);
  };

  const handleLessonComplete = async () => {
    console.log('Lesson completed in track');
    
    try {
      if (!user?.id) {
        console.error('No user ID available for track progress update');
        return;
      }

      // Find the completed lesson index
      const completedLessonIndex = lessons.findIndex(l => l.lesson.id === selectedLessonId);
      if (completedLessonIndex === -1) {
        console.error('Completed lesson not found in track lessons');
        return;
      }

      const completedLesson = lessons[completedLessonIndex];
      const isLastLesson = completedLessonIndex === lessons.length - 1;
      const nextLessonOrder = completedLessonIndex + 1;

      console.log('Updating track progress:', {
        completedLessonIndex,
        isLastLesson,
        nextLessonOrder,
        totalLessons: lessons.length
      });

      // Update track progress
      const { error: trackProgressError } = await supabase
        .from('user_learning_track_progress')
        .upsert({
          user_id: user.id,
          learning_track_id: track.id,
          current_lesson_order: nextLessonOrder,
          progress_percentage: Math.round((completedLessonIndex + 1) / lessons.length * 100),
          started_at: completedLessonIndex === 0 ? new Date().toISOString() : undefined,
          completed_at: isLastLesson ? new Date().toISOString() : undefined,
          enrolled_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,learning_track_id',
          ignoreDuplicates: false
        });

      if (trackProgressError) {
        console.error('Error updating track progress:', trackProgressError);
        toast({
          title: "Error saving track progress",
          description: "Your lesson was completed but track progress couldn't be saved.",
          variant: "destructive"
        });
      } else {
        console.log('Track progress updated successfully');
        toast({
          title: "Progress saved!",
          description: isLastLesson 
            ? "Congratulations! You've completed the entire learning track!"
            : "Great job! Your track progress has been updated."
        });
      }
    } catch (error) {
      console.error('Error in handleLessonComplete:', error);
      toast({
        title: "Error saving progress",
        description: "There was an issue saving your track progress.",
        variant: "destructive"
      });
    }

    // Refresh progress and return to lesson list
    await fetchTrackLessons();
    setSelectedLessonId(null);
  };

  const handleContinueToNext = async () => {
    // First, save the completion of the current lesson
    await handleLessonComplete();
    
    // Then proceed to next lesson
    const currentLessonIndex = lessons.findIndex(l => l.lesson.id === selectedLessonId);
    const nextLesson = lessons[currentLessonIndex + 1];
    
    if (nextLesson) {
      const isCurrentCompleted = true; // We just completed it
      
      if (nextLesson.available && (isCurrentCompleted || track.allow_parallel_tracks)) {
        setSelectedLessonId(nextLesson.lesson.id);
        return;
      } else if (!nextLesson.available) {
        toast({
          title: "Next lesson not available",
          description: nextLesson.availability_reason || "The next lesson is not available yet.",
          variant: "destructive"
        });
      }
    }
    
    // If no next lesson available, go back to track view
    setSelectedLessonId(null);
  };

  // Remove handleRestartLesson - let LessonViewer handle restarts

  // Remove handleLanguageChange - let LessonViewer handle language changes internally

  // Remove handleRestartWithLanguage - let LessonViewer handle language changes and restarts

  const handleExitLesson = () => {
    // Return to lesson list within the track
    setSelectedLessonId(null);
  };

        const completedLessons = lessons.filter(l => l.completed).length;
    
    // Calculate progress based on scheduling
    const schedulingConfig = {
      schedule_type: track.schedule_type as any,
      start_date: track.start_date,
      end_date: track.end_date,
      duration_weeks: track.duration_weeks,
      lessons_per_week: track.lessons_per_week,
      allow_all_lessons_immediately: track.allow_all_lessons_immediately
    };

    const userProgress = {
      enrolled_at: track.progress?.enrolled_at || new Date().toISOString(),
      started_at: track.progress?.started_at,
      completed_at: track.progress?.completed_at,
      current_lesson_order: track.progress?.current_lesson_order || 0
    };

    const progressPercentage = calculateTrackProgress(
      completedLessons,
      lessons.length,
      schedulingConfig,
      userProgress
    );



  // Use the flattened lesson for consistent behavior with preview
  const selectedLesson = flattenedLesson;

  if (selectedLesson && !flattenedLessonLoading) {
      console.log('🔍 LearningTrackViewer - Rendering LessonViewer for lesson:', selectedLessonId);
      return (
        <LessonViewer
          key={selectedLessonId}
          lesson={selectedLesson}
          isPreview={false}
          learningTrackId={track.id}
          onComplete={handleLessonComplete}
          onContinueToNext={handleContinueToNext}
          onExitToTrack={handleExitLesson}
        />
      );
  }

  // Remove completion screen - let LessonViewer handle completion UI

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Learning Tracks
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-learning-primary">{track.title}</h2>
          <p className="text-muted-foreground">{track.description}</p>
          
          {/* Scheduling Info */}
          {track.schedule_type !== 'flexible' && (
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {track.schedule_type === 'fixed_dates' && track.start_date && track.end_date && (
                  <span>
                    {new Date(track.start_date).toLocaleDateString()} - {new Date(track.end_date).toLocaleDateString()}
                  </span>
                )}
                                 {track.schedule_type === 'duration_based' && track.duration_weeks && track.lessons_per_week && (
                   <span>
                     {track.duration_weeks} weeks, {track.lessons_per_week} lesson{track.lessons_per_week > 1 ? 's' : ''} per week
                   </span>
                 )}
                 {track.schedule_type === 'weekly_schedule' && track.schedule_days && (
                   <span>
                     {track.schedule_days.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
                     {track.duration_weeks && ` for ${track.duration_weeks} weeks`}
                   </span>
                 )}
              </div>
              {track.allow_all_lessons_immediately && (
                <Badge variant="secondary">All lessons available immediately</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Track Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-learning-primary">{lessons.length}</div>
                <div className="text-sm text-muted-foreground">Total Lessons</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{completedLessons}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-learning-accent">{lessons.length - completedLessons}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-learning-primary">Lessons</h3>
        
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => {
              const isPrevCompleted = index === 0 || lessons[index - 1].completed;
              const canStart = lesson.available && (isPrevCompleted || track.allow_parallel_tracks);

              return (
                <Card key={lesson.id} className={`transition-all ${
                  lesson.completed ? 'bg-green-50 border-green-200' : 
                  canStart ? 'hover:shadow-md' : 'opacity-60'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-learning-surface">
                            {lesson.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{lesson.lesson.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {lesson.lesson.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 ml-11 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.lesson.estimated_duration || 10} min
                          </div>
                          {lesson.completed_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Completed {new Date(lesson.completed_at).toLocaleDateString()}
                            </div>
                          )}
                          {!lesson.available && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatAvailableDate(new Date(lesson.available_date || ''))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {lesson.completed && (
                          <Badge variant="default" className="bg-green-500" title="Completed">
                            <CheckCircle className="w-3 h-3" />
                          </Badge>
                        )}
                        <Button
                          onClick={() => startLesson(lesson)}
                          disabled={!canStart}
                          variant={lesson.completed ? "outline" : "default"}
                          title={lesson.completed ? 'Review' : 'Start'}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};