import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Languages, Save, Edit, Eye, CheckCircle, AlertCircle, ArrowLeft, Search, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguages } from '@/hooks/useLanguages';
import { LessonViewer } from '@/components/lesson/LessonViewer';
import { loadLessonForPreview } from '@/lib/lessonPreview';

interface LessonTranslation {
  lesson_id: string;
  language_code: string;
  title_translated: string;
  description_translated?: string;
  status: string;
  updated_at: string;
  // Original lesson data
  original_title?: string;
  original_description?: string;
}

interface NodeTranslation {
  node_id: string;
  language_code: string;
  content_translated: string;
  media_alt_translated?: string;
  status: string;
  updated_at: string;
  // Original node data
  original_content?: string;
  original_media_alt?: string;
}

export const TranslationEditor: React.FC = () => {
  const [lessonTranslations, setLessonTranslations] = useState<LessonTranslation[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [nodeTranslations, setNodeTranslations] = useState<NodeTranslation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [previewLanguage, setPreviewLanguage] = useState('en');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { languages, getLanguageName } = useLanguages();

  useEffect(() => {
    fetchLessonTranslations();
  }, []);

  useEffect(() => {
    if (selectedLessonId && selectedLanguage) {
      fetchNodeTranslations();
    }
  }, [selectedLessonId, selectedLanguage]);

  const fetchLessonTranslations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('lesson_translations')
        .select('*')
        .not('title_translated', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch original lesson data for each translation
      const translationsWithOriginals = await Promise.all(
        (data || []).map(async (translation) => {
          const { data: lessonData } = await supabase
            .from('lessons')
            .select('title, description')
            .eq('id', translation.lesson_id)
            .single();

          return {
            ...translation,
            original_title: lessonData?.title,
            original_description: lessonData?.description
          };
        })
      );

      setLessonTranslations(translationsWithOriginals);
    } catch (error: any) {
      console.error('Error fetching lesson translations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lesson translations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNodeTranslations = async () => {
    if (!selectedLessonId || !selectedLanguage) return;

    try {
      setLoading(true);

      // First get all nodes for this lesson
      const { data: nodesData, error: nodesError } = await supabase
        .from('lesson_nodes')
        .select('id, content, media_alt')
        .eq('lesson_id', selectedLessonId)
        .order('created_at');

      if (nodesError) throw nodesError;

      // Then get translations for these nodes
      const nodeIds = nodesData.map(node => node.id);
      const { data: translationsData, error: translationsError } = await supabase
        .from('lesson_node_translations')
        .select('*')
        .in('node_id', nodeIds)
        .eq('language_code', selectedLanguage);

      if (translationsError) throw translationsError;

      // Combine original node data with translations
      const nodesWithOriginals = (translationsData || []).map(translation => {
        const originalNode = nodesData.find(node => node.id === translation.node_id);
        return {
          ...translation,
          original_content: originalNode?.content,
          original_media_alt: originalNode?.media_alt
        };
      });

      setNodeTranslations(nodesWithOriginals);
    } catch (error: any) {
      console.error('Error fetching node translations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch node translations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLessonTranslation = async (lessonId: string, languageCode: string, title: string, description?: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('lesson_translations')
        .update({
          title_translated: title,
          description_translated: description,
          status: 'completed',
          engine_used: 'manual_edit',
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId)
        .eq('language_code', languageCode);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson translation saved successfully",
      });
      
      // Refresh the list
      fetchLessonTranslations();
    } catch (error: any) {
      console.error('Error saving lesson translation:', error);
      toast({
        title: "Error",
        description: "Failed to save lesson translation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNodeTranslation = async (nodeId: string, languageCode: string, content: string, mediaAlt?: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('lesson_node_translations')
        .upsert({
          node_id: nodeId,
          language_code: languageCode,
          content_translated: content,
          media_alt_translated: mediaAlt,
          status: 'completed',
          engine_used: 'manual_edit',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Node translation saved successfully",
      });
      
      // Refresh node translations
      if (selectedLessonId && selectedLanguage) {
        fetchNodeTranslations();
      }
    } catch (error: any) {
      console.error('Error saving node translation:', error);
      toast({
        title: "Error",
        description: "Failed to save node translation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewLesson = async () => {
    if (!selectedLessonId) return;

    setLoadingPreview(true);
    setPreviewLanguage(selectedLanguage);
    
    try {
      const transformedLesson = await loadLessonForPreview(selectedLessonId);
      
      if (transformedLesson) {
        setPreviewLesson(transformedLesson);
        setShowPreview(true);
      } else {
        toast({
          title: "Error",
          description: "Could not load lesson for preview",
          variant: "destructive"
        });
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

  const filteredTranslations = lessonTranslations.filter(translation =>
    translation.title_translated.toLowerCase().includes(searchTerm.toLowerCase()) ||
    translation.description_translated?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getLanguageName(translation.language_code).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedLessonId && selectedLanguage) {
    const selectedTranslation = lessonTranslations.find(t => 
      t.lesson_id === selectedLessonId && t.language_code === selectedLanguage
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedLessonId(null);
                setSelectedLanguage('');
              }}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Translations
            </Button>
            <h2 className="text-2xl font-bold text-learning-primary">Edit Translation</h2>
            <p className="text-muted-foreground">
              {selectedTranslation?.original_title || 'Unknown Lesson'} - {getLanguageName(selectedLanguage)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePreviewLesson} disabled={loadingPreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Lesson Translation */}
        {selectedTranslation && (
          <Card>
            <CardHeader>
              <CardTitle>Lesson Translation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="h-5 flex items-center">
                    <label className="text-sm font-medium">Original Title (English)</label>
                  </div>
                  <div className="mt-1 p-3 bg-muted rounded-md min-h-[40px] flex items-center">
                    {selectedTranslation.original_title || 'No original title'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-5 flex items-center">
                    <label className="text-sm font-medium">Translated Title</label>
                  </div>
                  <div className="mt-1 p-3 bg-white border border-input rounded-md min-h-[40px] flex items-center">
                    <input
                      value={selectedTranslation.title_translated}
                      onChange={(e) => {
                        setLessonTranslations(prev => 
                          prev.map(t => 
                            t.lesson_id === selectedLessonId && t.language_code === selectedLanguage
                              ? { ...t, title_translated: e.target.value }
                              : t
                          )
                        );
                      }}
                      className="w-full bg-transparent border-none outline-none"
                      placeholder="Enter translated title"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="h-5 flex items-center">
                    <label className="text-sm font-medium">Original Description (English)</label>
                  </div>
                  <div className="mt-1 p-3 bg-muted rounded-md h-[120px] overflow-y-auto">
                    <div className="whitespace-pre-wrap">
                      {selectedTranslation.original_description || 'No original description'}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-5 flex items-center">
                    <label className="text-sm font-medium">Translated Description</label>
                  </div>
                  <div className="mt-1 p-3 bg-white border border-input rounded-md h-[120px]">
                    <textarea
                      value={selectedTranslation.description_translated || ''}
                      onChange={(e) => {
                        setLessonTranslations(prev => 
                          prev.map(t => 
                            t.lesson_id === selectedLessonId && t.language_code === selectedLanguage
                              ? { ...t, description_translated: e.target.value }
                              : t
                          )
                        );
                      }}
                      className="w-full h-full bg-transparent border-none outline-none resize-none"
                      placeholder="Enter translated description"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => handleSaveLessonTranslation(
                  selectedLessonId, 
                  selectedLanguage, 
                  selectedTranslation.title_translated,
                  selectedTranslation.description_translated
                )} 
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />

              </Button>
            </CardContent>
          </Card>
        )}

        {/* Node Translations */}
        <Card>
          <CardHeader>
            <CardTitle>Node Translations</CardTitle>
            <CardDescription>
              {nodeTranslations.length} node translations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nodeTranslations.map((translation, index) => (
                <div key={translation.node_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Node {index + 1}</h3>
                    <Badge variant={translation.content_translated ? "default" : "secondary"}>
                      {translation.content_translated ? "Translated" : "Not Translated"}
                    </Badge>
                  </div>
                  
                                                       <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="h-5 flex items-center">
                        <label className="text-sm font-medium">Original Content (English)</label>
                      </div>
                      <div className="mt-1 p-3 bg-muted rounded-md h-[120px] overflow-y-auto">
                        <div className="whitespace-pre-wrap">
                          {translation.original_content || 'No original content'}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="h-5 flex items-center">
                          <label className="text-sm font-medium">Original Media Alt Text</label>
                        </div>
                        <div className="mt-1 p-2 bg-muted rounded-md text-sm h-[40px] flex items-center overflow-y-auto">
                          {translation.original_media_alt || 'No media alt text'}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="h-5 flex items-center">
                        <label className="text-sm font-medium">Translated Content</label>
                      </div>
                      <div className="mt-1 p-3 bg-white border border-input rounded-md h-[120px]">
                        <textarea
                          value={translation.content_translated}
                          onChange={(e) => {
                            setNodeTranslations(prev => 
                              prev.map(t => 
                                t.node_id === translation.node_id && t.language_code === translation.language_code
                                  ? { ...t, content_translated: e.target.value }
                                  : t
                              )
                            );
                          }}
                          className="w-full h-full bg-transparent border-none outline-none resize-none"
                          placeholder="Enter translated content"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="h-5 flex items-center">
                          <label className="text-sm font-medium">Translated Media Alt Text</label>
                        </div>
                        <div className="mt-1 p-2 bg-white border border-input rounded-md text-sm h-[40px] flex items-center">
                          <input
                            value={translation.media_alt_translated || ''}
                            onChange={(e) => {
                              setNodeTranslations(prev => 
                                prev.map(t => 
                                  t.node_id === translation.node_id && t.language_code === translation.language_code
                                    ? { ...t, media_alt_translated: e.target.value }
                                    : t
                                )
                              );
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm"
                            placeholder="Enter translated media alt text"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      onClick={() => handleSaveNodeTranslation(
                        translation.node_id, 
                        translation.language_code, 
                        translation.content_translated, 
                        translation.media_alt_translated
                      )}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                  onLanguageChange={() => {}}
                  onRestartWithLanguage={() => {}}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-learning-primary">Translation Editor</h2>
        <p className="text-muted-foreground">
          Edit existing lesson translations
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search translations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Translations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Translations</CardTitle>
          <CardDescription>
            {filteredTranslations.length} translations found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-learning-accent border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading translations...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson Title</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Translated Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTranslations.map((translation) => (
                  <TableRow key={`${translation.lesson_id}-${translation.language_code}`}>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={translation.original_title}>
                        {translation.original_title || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getLanguageName(translation.language_code)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate" title={translation.title_translated}>
                        {translation.title_translated}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={translation.status === 'completed' ? "default" : "secondary"} title={translation.status}>
                        {translation.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(translation.updated_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLessonId(translation.lesson_id);
                          setSelectedLanguage(translation.language_code);
                        }}
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
