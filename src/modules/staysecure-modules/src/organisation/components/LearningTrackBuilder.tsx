import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LearningTrackBuilderProps {
  track?: {
    id: string;
    title: string;
    description: string;
    status: string;
    schedule_type: string;
    start_date: string;
    end_date: string;
    duration_weeks: number;
    lessons_per_week: number;
    allow_all_lessons_immediately: boolean;
    schedule_days?: number[];
    max_lessons_per_week?: number | null;
  } | null;
  onClose: () => void;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
}

interface TrackLesson {
  id: string;
  lesson_id: string;
  order_index: number;
  lesson?: Lesson;
}

export const LearningTrackBuilder = ({ track, onClose }: LearningTrackBuilderProps) => {
  const [title, setTitle] = useState(track?.title || '');
  const [description, setDescription] = useState(track?.description || '');
  const [status, setStatus] = useState(track?.status || 'draft');
  const [scheduleType, setScheduleType] = useState(track?.schedule_type || 'flexible');
  const [startDate, setStartDate] = useState(track?.start_date || '');
  const [endDate, setEndDate] = useState(track?.end_date || '');
  const [durationWeeks, setDurationWeeks] = useState(track?.duration_weeks || 4);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(track?.lessons_per_week || 1);
  const [allowAllLessons, setAllowAllLessons] = useState(track?.allow_all_lessons_immediately || false);
  const [scheduleDays, setScheduleDays] = useState<number[]>(track?.schedule_days || [1, 3]); // Monday, Wednesday by default
  const [maxLessonsPerWeek, setMaxLessonsPerWeek] = useState<number | null>(track?.max_lessons_per_week || null);
  
  // Assignment settings are handled at the assignment level, not the track level
  
  const [trackLessons, setTrackLessons] = useState<TrackLesson[]>([]);
  const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [track?.id]);

  const fetchData = async () => {
    try {
      // Fetch available lessons (published only)
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, description, estimated_duration')
        .eq('status', 'published')
        .order('title');

      if (lessonsError) throw lessonsError;
      setAvailableLessons(lessons || []);

      // If editing existing track, fetch track lessons
      if (track?.id) {
        const { data: trackLessonsData, error: trackLessonsError } = await supabase
          .from('learning_track_lessons')
          .select(`
            id,
            lesson_id,
            order_index,
            lessons!inner(id, title, description, estimated_duration)
          `)
          .eq('learning_track_id', track.id)
          .order('order_index');

        if (trackLessonsError) throw trackLessonsError;
        
        const formattedTrackLessons = (trackLessonsData || []).map(item => ({
          id: item.id,
          lesson_id: item.lesson_id,
          order_index: item.order_index,
          lesson: item.lessons as Lesson
        }));
        
        setTrackLessons(formattedTrackLessons);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a track title",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      let trackId = track?.id;

      if (track?.id) {
        // Update existing track
        const { error } = await supabase
          .from('learning_tracks')
          .update({
            title,
            description,
            status,
            schedule_type: scheduleType,
            start_date: startDate || null,
            end_date: endDate || null,
            duration_weeks: (scheduleType === 'duration_based' || scheduleType === 'weekly_schedule') ? durationWeeks : null,
            lessons_per_week: scheduleType === 'duration_based' ? lessonsPerWeek : null,
            allow_all_lessons_immediately: allowAllLessons,
            schedule_days: scheduleType === 'weekly_schedule' ? scheduleDays : null,
            max_lessons_per_week: scheduleType === 'weekly_schedule' ? maxLessonsPerWeek : null
          })
          .eq('id', track.id);

        if (error) throw error;
      } else {
        // Create new track
        const { data, error } = await supabase
          .from('learning_tracks')
          .insert({
            title,
            description,
            status,
            schedule_type: scheduleType,
            start_date: startDate || null,
            end_date: endDate || null,
            duration_weeks: (scheduleType === 'duration_based' || scheduleType === 'weekly_schedule') ? durationWeeks : null,
            lessons_per_week: scheduleType === 'duration_based' ? lessonsPerWeek : null,
            allow_all_lessons_immediately: allowAllLessons,
            schedule_days: scheduleType === 'weekly_schedule' ? scheduleDays : null,
            max_lessons_per_week: scheduleType === 'weekly_schedule' ? maxLessonsPerWeek : null
          })
          .select()
          .single();

        if (error) throw error;
        trackId = data.id;
      }

      // Update track lessons
      if (trackId) {
        // Delete existing track lessons
        await supabase
          .from('learning_track_lessons')
          .delete()
          .eq('learning_track_id', trackId);

        // Insert new track lessons
        if (trackLessons.length > 0) {
          const { error: insertError } = await supabase
            .from('learning_track_lessons')
            .insert(
              trackLessons.map((tl, index) => ({
                learning_track_id: trackId,
                lesson_id: tl.lesson_id,
                order_index: index
              }))
            );

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Success",
        description: `Learning track ${track?.id ? 'updated' : 'created'} successfully`
      });
      onClose();
    } catch (error) {
      console.error('Error saving track:', error);
      toast({
        title: "Error",
        description: "Failed to save learning track",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addLesson = (lessonId: string) => {
    const lesson = availableLessons.find(l => l.id === lessonId);
    if (lesson && !trackLessons.find(tl => tl.lesson_id === lessonId)) {
      setTrackLessons([...trackLessons, {
        id: `temp-${Date.now()}`,
        lesson_id: lessonId,
        order_index: trackLessons.length,
        lesson
      }]);
    }
  };

  const removeLesson = (lessonId: string) => {
    setTrackLessons(trackLessons.filter(tl => tl.lesson_id !== lessonId));
  };

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    const newLessons = [...trackLessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newLessons.length) {
      [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];
      setTrackLessons(newLessons);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Learning Tracks
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-learning-primary">
            {track ? 'Edit Learning Track' : 'Create Learning Track'}
          </h2>
          <p className="text-muted-foreground">Configure track settings and lessons</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Track Details */}
        <Card>
          <CardHeader>
            <CardTitle>Track Information</CardTitle>
            <CardDescription>Basic information about the learning track</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter track title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the learning track"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>Configure how lessons are scheduled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleType">Schedule Type</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="fixed_dates">Fixed Dates</SelectItem>
                  <SelectItem value="duration_based">Duration Based</SelectItem>
                  <SelectItem value="weekly_schedule">Weekly Schedule (Specific Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType === 'fixed_dates' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {scheduleType === 'duration_based' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="durationWeeks">Duration (weeks)</Label>
                  <Input
                    id="durationWeeks"
                    type="number"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessonsPerWeek">Lessons per week</Label>
                  <Input
                    id="lessonsPerWeek"
                    type="number"
                    value={lessonsPerWeek}
                    onChange={(e) => setLessonsPerWeek(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
              </>
            )}

            {scheduleType === 'weekly_schedule' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Leave empty to start on enrollment"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationWeeks">Duration (weeks)</Label>
                  <Input
                    id="durationWeeks"
                    type="number"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schedule Days</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <input
                          type="checkbox"
                          id={`day-${index}`}
                          checked={scheduleDays.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScheduleDays([...scheduleDays, index].sort());
                            } else {
                              setScheduleDays(scheduleDays.filter(d => d !== index));
                            }
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor={`day-${index}`}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs cursor-pointer transition-colors ${
                            scheduleDays.includes(index)
                              ? 'bg-learning-primary text-white border-learning-primary'
                              : 'bg-white border-gray-300 hover:border-learning-primary'
                          }`}
                        >
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLessonsPerWeek">Max Lessons per Week (Optional)</Label>
                  <Input
                    id="maxLessonsPerWeek"
                    type="number"
                    value={maxLessonsPerWeek || ''}
                    onChange={(e) => setMaxLessonsPerWeek(e.target.value ? parseInt(e.target.value) : null)}
                    min="1"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="allowAllLessons"
                checked={allowAllLessons}
                onCheckedChange={setAllowAllLessons}
              />
              <Label htmlFor="allowAllLessons">Allow access to all lessons immediately</Label>
            </div>
          </CardContent>
        </Card>

        {/* Assignment settings are handled at the assignment level, not the track level */}
      </div>

      {/* Track Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Track Lessons</CardTitle>
          <CardDescription>Add and organize lessons for this track</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add Lesson</Label>
            <Select onValueChange={addLesson}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lesson to add" />
              </SelectTrigger>
              <SelectContent>
                {availableLessons
                  .filter(lesson => !trackLessons.find(tl => tl.lesson_id === lesson.id))
                  .map(lesson => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {trackLessons.length > 0 && (
            <div className="space-y-2">
              <Label>Lesson Order</Label>
              <div className="space-y-2">
                {trackLessons.map((trackLesson, index) => (
                  <div
                    key={trackLesson.lesson_id}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-learning-surface"
                  >
                    <span className="text-sm font-medium w-8">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="font-medium">{trackLesson.lesson?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {trackLesson.lesson?.estimated_duration} min
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveLesson(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveLesson(index, 'down')}
                        disabled={index === trackLessons.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLesson(trackLesson.lesson_id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Learning Track
            </>
          )}
        </Button>
      </div>
    </div>
  );
};