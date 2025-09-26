import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Save, Eye, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@staysecure/auth';
import { DecisionTreeBuilder } from './DecisionTreeBuilder';
import { LessonViewer } from '@/components/lesson/LessonViewer';
import { Lesson as LessonType } from '@/types/lesson';
import { loadLessonForPreview } from '@/lib/lessonPreview';

interface LessonBuilderProps {
  lesson?: {
    id: string;
    title: string;
    description: string;
    status: string;
    estimated_duration: number;
    is_module?: boolean;
  } | null;
  onClose: () => void;
}

export const LessonBuilder = ({ lesson, onClose }: LessonBuilderProps) => {
  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [status, setStatus] = useState(lesson?.status || 'draft');
  const [estimatedDuration, setEstimatedDuration] = useState(lesson?.estimated_duration || 10);
  const [isModule, setIsModule] = useState(lesson?.is_module || false);
  const [currentStep, setCurrentStep] = useState<'details' | 'builder'>('details');
  const [saving, setSaving] = useState(false);
  const [lessonId, setLessonId] = useState(lesson?.id || '');
  const [showPreview, setShowPreview] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<LessonType | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSaveLesson = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a lesson title",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save a lesson",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      if (lesson?.id) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update({
            title,
            description,
            status,
            estimated_duration: estimatedDuration,
            is_module: isModule
          })
          .eq('id', lesson.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Lesson updated successfully"
        });
      } else {
        // Create new lesson
        const { data, error } = await supabase
          .from('lessons')
          .insert({
            title,
            description,
            status,
            estimated_duration: estimatedDuration,
            is_module: isModule,
            created_by: user?.id
          })
          .select()
          .single();

        if (error) throw error;
        
        setLessonId(data.id);
        toast({
          title: "Success",
          description: "Lesson created successfully"
        });
      }

    } catch (error) {
      console.error('Error saving lesson:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to save lesson";
      if (error && typeof error === 'object' && 'message' in error) {
        const errorObj = error as any;
        if (errorObj.message?.includes('created_by')) {
          errorMessage = "Authentication error. Please log in again.";
        } else if (errorObj.message?.includes('permission')) {
          errorMessage = "Permission denied. You may not have the required access.";
        } else if (errorObj.message?.includes('foreign key')) {
          errorMessage = "Invalid reference. Please check your lesson data.";
        } else {
          errorMessage = errorObj.message || errorMessage;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewLesson = async () => {
    if (!lessonId) {
      toast({
        title: "Error",
        description: "Please save the lesson first before previewing",
        variant: "destructive"
      });
      return;
    }

    setLoadingPreview(true);
    try {
      const transformedLesson = await loadLessonForPreview(lessonId);
      
      if (transformedLesson) {
        // Set the title and description from the current form
        transformedLesson.title = title;
        transformedLesson.description = description;
        
        setPreviewLesson(transformedLesson);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error loading lesson preview:', error);
      if (error instanceof Error && error.message === 'No content found for this lesson') {
        toast({
          title: "No content",
          description: "This lesson has no content to preview. Please add content first.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load lesson preview",
          variant: "destructive"
        });
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  if (currentStep === 'builder' && lessonId) {
    return (
      <DecisionTreeBuilder
        lessonId={lessonId}
        lessonTitle={title}
        onBack={() => setCurrentStep('details')}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lessons
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-learning-primary">
            {lesson ? 'Edit Lesson' : 'Create New Lesson'}
          </h2>
          <p className="text-muted-foreground">Step 1: Lesson Details</p>
        </div>
      </div>

      {/* Lesson Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Information</CardTitle>
          <CardDescription>
            Configure the basic information for your lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter lesson title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 0)}
                placeholder="3"
              />
            </div>
          </div>

                      <div className="flex items-center space-x-2">
              <Switch
                id="isModule"
                checked={isModule}
                onCheckedChange={setIsModule}
              />
              <Label htmlFor="isModule">Mark as Module (can be embedded in other lessons)</Label>
            </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this lesson covers..."
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

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSaveLesson} disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Lesson
                </>
              )}
            </Button>
            {(lesson || lessonId) && (
              <Button variant="outline" onClick={() => setCurrentStep('builder')}>
                <Edit className="w-4 h-4 mr-2" />
                Lesson Editor
              </Button>
            )}
            {lessonId && (
              <Button variant="outline" onClick={handlePreviewLesson} disabled={loadingPreview}>
                <Eye className="w-4 h-4 mr-2" />
                {loadingPreview ? 'Loading...' : 'Preview Lesson'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Lesson Preview</DialogTitle>
            <DialogDescription>
              Preview how your lesson will appear to learners
            </DialogDescription>
          </DialogHeader>
          <div className="h-full overflow-auto">
            {previewLesson && (
              <LessonViewer
                lesson={previewLesson}
                onComplete={() => setShowPreview(false)}
                isPreview={true}
                onLanguageChange={() => {}}
                onRestartWithLanguage={() => {}}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};