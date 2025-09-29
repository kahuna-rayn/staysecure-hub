import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Eye, Trash2, Search, BookOpen, Grid, List, ChevronUp, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LessonBuilder } from './LessonBuilder';
import { LessonViewer } from '@/components/lesson/LessonViewer';
import { Lesson as LessonType } from '@/types/lesson';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { loadLessonForPreview } from '@/lib/lessonPreview';
import { useLessonsWithAllTranslations } from '@/hooks/useLessonsWithAllTranslations';
import { useLanguages } from '@/hooks/useLanguages';

interface Lesson {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  estimated_duration: number;
  translations: LessonTranslation[];
}

interface LessonTranslation {
  language_code: string;
  title_translated: string;
  description_translated?: string;
  status: string;
  updated_at: string;
}

export const LessonManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<LessonType | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<'title' | 'status' | 'estimated_duration' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [viewingLanguage, setViewingLanguage] = useState<string>('en');
  const [previewLanguage, setPreviewLanguage] = useState<string>('en');
  const { toast } = useToast();
  
  const { lessons, loading, refetch } = useLessonsWithAllTranslations();
  const { getLanguageName, getLanguageByCode } = useLanguages();

  const handleCreateLesson = () => {
    setSelectedLesson(null);
    setShowBuilder(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowBuilder(true);
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonToDelete(lessonId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;

    try {
      // Delete related records in the correct order based on foreign key relationships
      
      // 1. Delete translation-related records
      const { error: translationError } = await supabase
        .from('lesson_translations')
        .delete()
        .eq('lesson_id', lessonToDelete);

      if (translationError) {
        console.error('Error deleting lesson translations:', translationError);
      }

      const { error: translationJobsError } = await supabase
        .from('translation_jobs')
        .delete()
        .eq('lesson_id', lessonToDelete);

      if (translationJobsError) {
        console.error('Error deleting translation jobs:', translationJobsError);
      }

      const { error: translationChangeLogError } = await supabase
        .from('translation_change_log')
        .delete()
        .eq('lesson_id', lessonToDelete);

      if (translationChangeLogError) {
        console.error('Error deleting translation change log:', translationChangeLogError);
      }

      // 2. Delete user behavior and response data
      const { error: behaviorError } = await supabase
        .from('user_behavior_analytics')
        .delete()
        .eq('lesson_id', lessonToDelete);

      if (behaviorError) {
        console.error('Error deleting user behavior analytics:', behaviorError);
      }

      const { error: answerResponsesError } = await supabase
        .from('user_answer_responses')
        .delete()
        .eq('lesson_id', lessonToDelete);

      if (answerResponsesError) {
        console.error('Error deleting user answer responses:', answerResponsesError);
      }

      // 3. Delete lesson nodes and related data
      const { data: lessonNodes } = await supabase
        .from('lesson_nodes')
        .select('id')
        .eq('lesson_id', lessonToDelete);

      if (lessonNodes && lessonNodes.length > 0) {
        const nodeIds = lessonNodes.map(node => node.id);
        
        // Delete node translations
        const { error: nodeTranslationError } = await supabase
          .from('lesson_node_translations')
          .delete()
          .in('node_id', nodeIds);

        if (nodeTranslationError) {
          console.error('Error deleting node translations:', nodeTranslationError);
        }

        // Delete lesson answers
        const { error: answersError } = await supabase
          .from('lesson_answers')
          .delete()
          .in('node_id', nodeIds);

        if (answersError) {
          console.error('Error deleting lesson answers:', answersError);
        }
      }

      // 4. Delete lesson nodes (including those that reference this lesson as embedded)
      const { error: nodesError } = await supabase
        .from('lesson_nodes')
        .delete()
        .eq('lesson_id', lessonToDelete);

      if (nodesError) {
        console.error('Error deleting lesson nodes:', nodesError);
      }

      // Also delete nodes that reference this lesson as embedded_lesson_id
      const { error: embeddedNodesError } = await supabase
        .from('lesson_nodes')
        .delete()
        .eq('embedded_lesson_id', lessonToDelete);

      if (embeddedNodesError) {
        console.error('Error deleting embedded lesson nodes:', embeddedNodesError);
      }

      // 5. Delete user progress
      const { error: progressError } = await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('lesson_id', lessonToDelete);

      if (progressError) {
        console.error('Error deleting user progress:', progressError);
      }

      // 6. Delete learning track references
      const { error: trackLessonsError } = await supabase
        .from('learning_track_lessons')
        .delete()
        .eq('lesson_id', lessonToDelete);

      if (trackLessonsError) {
        console.error('Error deleting learning track lessons:', trackLessonsError);
      }

      // 7. Finally, delete the lesson itself
      const { error: lessonError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonToDelete);

      if (lessonError) throw lessonError;

      toast({
        title: "Success",
        description: "Lesson deleted successfully"
      });
      refetch();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Error",
        description: "Failed to delete lesson. Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setLessonToDelete(null);
    }
  };

  const handleRestartWithLanguage = async (language: string) => {
    console.log('🔄 LessonManagement: Restarting with language:', language);
    setPreviewLanguage(language);
    setLoadingPreview(true);
    
    try {
      // Find the lesson that's currently being previewed
      const currentLesson = lessons.find(l => l.id === previewLesson?.id);
      if (currentLesson) {
        console.log('🔄 Found current lesson for restart:', currentLesson.title);
        await handlePreviewLesson(currentLesson, language);
      } else {
        console.error('❌ Could not find current lesson for restart');
        toast({
          title: "Error",
          description: "Could not find lesson to restart",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error restarting lesson with new language:', error);
      toast({
        title: "Error",
        description: "Failed to restart lesson with new language",
        variant: "destructive"
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePreviewLesson = async (lesson: Lesson, languageCode: string = 'en') => {
    console.log('🔄 LessonManagement: Loading lesson preview for:', lesson.title, 'language:', languageCode);
    setLoadingPreview(true);
    setPreviewLanguage(languageCode);
    try {
      let transformedLesson = await loadLessonForPreview(lesson.id);
      
      if (transformedLesson) {
        console.log('✅ Loaded lesson with', transformedLesson.nodes.length, 'nodes');
        // If viewing in a specific language, load the translated content
        if (languageCode !== 'en') {
          console.log('🔄 Loading translations for language:', languageCode);
          
          // Fetch lesson translation
          const { data: lessonTranslation, error: lessonError } = await supabase
            .from('lesson_translations')
            .select('*')
            .eq('lesson_id', lesson.id)
            .eq('language_code', languageCode)
            .single();

          if (lessonTranslation) {
            console.log('✅ Found lesson translation:', lessonTranslation.title_translated);
            
            // Fetch node translations
            const { data: nodeTranslations, error: nodeError } = await supabase
              .from('lesson_node_translations')
              .select('*')
              .eq('language_code', languageCode)
              .in('node_id', transformedLesson.nodes.map(node => node.id));

            console.log('📝 Node translations found:', nodeTranslations?.length || 0);
            
            if (!nodeError && nodeTranslations) {
              // Create translated nodes
              const translatedNodes = transformedLesson.nodes.map(node => {
                const nodeTranslation = nodeTranslations.find(nt => nt.node_id === node.id);
                
                if (nodeTranslation) {
                  console.log(`🔄 Translating node ${node.id}: "${node.content}" → "${nodeTranslation.content_translated}"`);
                  return {
                    ...node,
                    content: nodeTranslation.content_translated || node.content,
                    answers: node.answers // Keep original answers as translation doesn't support answer translation yet
                  };
                }
                console.log(`⚠️ No translation found for node ${node.id}, keeping original: "${node.content}"`);
                return node;
              });

              // Create translated lesson
              transformedLesson = {
                ...transformedLesson,
                title: lessonTranslation.title_translated || transformedLesson.title,
                description: lessonTranslation.description_translated || transformedLesson.description,
                nodes: translatedNodes,
              };
              console.log('✅ Created translated lesson with', translatedNodes.length, 'translated nodes');
            } else {
              console.log('⚠️ No node translations found, keeping original content');
            }
          } else {
            console.log('⚠️ No lesson translation found, keeping original content');
          }
        } else {
          console.log('🌐 Using English content (no translation needed)');
        }
        
        console.log('🔄 Setting preview lesson with language:', languageCode);
        setPreviewLesson(transformedLesson);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error loading lesson preview:', error);
      toast({
        title: "Error",
        description: "Failed to load lesson preview",
        variant: "destructive"
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSort = (field: 'title' | 'status' | 'estimated_duration' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredLessons = lessons
    .filter(lesson =>
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.translations.some(t => 
        t.title_translated.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'estimated_duration':
          aValue = a.estimated_duration || 0;
          bValue = b.estimated_duration || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getLanguageDisplay = (languageCode: string) => {
    const language = getLanguageByCode(languageCode);
    if (!language) return languageCode;
    
    return language.native_name || language.display_name || language.name;
  };

  if (showBuilder) {
    return (
      <LessonBuilder
        lesson={selectedLesson}
        onClose={() => {
          setShowBuilder(false);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-learning-primary">Lesson Management</h2>
          <p className="text-muted-foreground">Create and manage training lessons</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleCreateLesson} className="bg-learning-accent hover:bg-learning-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Lesson
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search lessons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lessons View */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(6)].map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-muted rounded w-32"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-16"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-12"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-24"></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {sortedAndFilteredLessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{lesson.title}</CardTitle>
                    <CardDescription className="mb-3">{lesson.description}</CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Duration: {lesson.estimated_duration || 'Not set'} min</span>
                      <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={lesson.status === 'published' ? 'default' : 'secondary'}>
                    {lesson.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* English (Original) Row */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🇺🇸</span>
                    <div>
                      <div className="font-medium">English</div>
                      <div className="text-sm text-muted-foreground">{lesson.title}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLesson(lesson)}
                      title="Edit lesson"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewLesson(lesson, 'en')}
                      disabled={loadingPreview}
                      title="View lesson in English"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Translation Rows */}
                {lesson.translations.map((translation) => (
                  <div key={translation.language_code} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getLanguageByCode(translation.language_code)?.flag_emoji || '🌐'}</span>
                      <div>
                        <div className="font-medium">{getLanguageDisplay(translation.language_code)}</div>
                        <div className="text-sm text-muted-foreground">{translation.title_translated}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewLesson(lesson, translation.language_code)}
                        disabled={loadingPreview}
                        title={`View lesson in ${getLanguageDisplay(translation.language_code)}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Delete Button */}
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Title
                    {sortField === 'title' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('estimated_duration')}
                >
                  <div className="flex items-center">
                    Duration
                    {sortField === 'estimated_duration' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Created
                    {sortField === 'created_at' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredLessons.map((lesson) => (
                <TableRow key={lesson.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-sm text-muted-foreground">{lesson.description}</div>
                      {lesson.translations.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {lesson.translations.length} translation{lesson.translations.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lesson.status === 'published' ? 'default' : 'secondary'} title={lesson.status}>
                      {lesson.status === 'published' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lesson.estimated_duration || 'Not set'} min
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLesson(lesson)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewLesson(lesson, 'en')}
                        disabled={loadingPreview}
                        title="Preview"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {sortedAndFilteredLessons.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-learning-primary mb-2">No lessons found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No lessons match your search criteria.' : 'Get started by creating your first lesson.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateLesson}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Lesson
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Lesson Preview - {getLanguageName(previewLanguage)}
            </DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto">
            {previewLesson && (
              <LessonViewer
                lesson={previewLesson}
                onComplete={() => setShowPreview(false)}
                isPreview={true}
                initialLanguage={previewLanguage}
                onLanguageChange={(language) => setPreviewLanguage(language)}
                onRestartWithLanguage={handleRestartWithLanguage}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Lesson"
        description="Are you sure you want to delete this lesson? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteLesson}
        variant="destructive"
      />
    </div>
  );
};