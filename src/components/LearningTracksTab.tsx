import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, BookOpen, Grid3x3, List } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LearningTracksTabProps {
  userId: string;
}

const LearningTracksTab: React.FC<LearningTracksTabProps> = ({ userId }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Fetch user's learning track progress
  const { data: trackProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['user-learning-track-progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_learning_track_progress')
        .select(`
          *,
          learning_tracks (
            id,
            title,
            description,
            status
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch learning track lessons for lesson counts
  const { data: trackLessons = [] } = useQuery({
    queryKey: ['learning-track-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_track_lessons')
        .select('learning_track_id, lesson_id');
      
      if (error) throw error;
      return data || [];
    },
  });

  if (progressLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (trackProgress.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Learning Tracks</h3>
          <p className="mt-2 text-muted-foreground">
            You are not currently enrolled in any learning tracks.
          </p>
        </div>
      </div>
    );
  }

  // Group lessons by track
  const lessonsByTrack = trackLessons.reduce((acc, lesson) => {
    if (!acc[lesson.learning_track_id]) {
      acc[lesson.learning_track_id] = [];
    }
    acc[lesson.learning_track_id].push(lesson);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Learning Tracks</h2>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trackProgress.map((progress) => {
            const track = progress.learning_tracks;
            const lessonsCount = lessonsByTrack[track.id]?.length || 0;
            const progressPercentage = progress.progress_percentage || 0;

            return (
              <Card key={progress.id} className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{track.title}</CardTitle>
                      <Badge 
                        variant={progress.completed_at ? "default" : "secondary"}
                        className="mt-2"
                      >
                        {progress.completed_at ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {track.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {track.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{lessonsCount} {lessonsCount === 1 ? 'lesson' : 'lessons'}</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={!!progress.completed_at}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {progress.completed_at ? 'Completed' : 'Continue'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {trackProgress.map((progress) => {
            const track = progress.learning_tracks;
            const lessonsCount = lessonsByTrack[track.id]?.length || 0;
            const progressPercentage = progress.progress_percentage || 0;

            return (
              <Card key={progress.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold truncate">{track.title}</h3>
                        <Badge 
                          variant={progress.completed_at ? "default" : "secondary"}
                        >
                          {progress.completed_at ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      
                      {track.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {track.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>{lessonsCount} {lessonsCount === 1 ? 'lesson' : 'lessons'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span>Progress: {progressPercentage}%</span>
                        </div>
                      </div>
                      
                      <div className="w-full max-w-xs">
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button 
                        disabled={!!progress.completed_at}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {progress.completed_at ? 'Completed' : 'Continue'}
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
  );
};

export default LearningTracksTab;