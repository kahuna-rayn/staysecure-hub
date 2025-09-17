import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Folder, FileText, Languages, Globe, Bot, RefreshCw, Play, CheckCircle2, AlertCircle, BarChart3, Settings, Edit, LanguagesIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguages } from '@/hooks/useLanguages';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TranslationDashboard } from './TranslationDashboard';
import { TranslationEditor } from './TranslationEditor';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
}

export const TranslationManagement: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { translateLesson, loading: translating } = useTranslation();
  const { languages, getLanguageName } = useLanguages();
  const { toast } = useToast();

  useEffect(() => {
    fetchLessons();
  }, []);

  // Bulk Translation Icon
const BulkTranslationIcon = ({ className = "" }) => (
  <span className={`relative inline-block ${className}`}>
    {/* First language icon (base) */}
    <Languages size={16} className="text-white" />
    {/* Second language icon (overlapping) */}
    <Languages size={16} className="absolute -top-0.5 -right-0.5 text-white opacity-70" />
  </span>
);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, description, status, created_at')
        .eq('status', 'published')
        .order('title', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error: any) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lessons",
        variant: "destructive",
      });
    }
  };

  const handleTranslateLesson = async (lessonId: string) => {
    if (!selectedLanguage) return;

    const result = await translateLesson({
      lessonId,
      targetLanguage: selectedLanguage,
      translateNodes: true
    });

    if (result.success) {
      toast({
        title: "Translation Complete",
        description: "Lesson has been translated successfully",
      });
    }
  };

  const handleBulkTranslate = async () => {
    if (!selectedLanguage || lessons.length === 0) return;

    setLoading(true);
    try {
      toast({
        title: "Bulk Translation Started",
        description: `Translating ${lessons.length} lessons to ${getLanguageName(selectedLanguage)}`,
      });

      let successCount = 0;
      let errorCount = 0;

      for (const lesson of lessons) {
        try {
          const result = await translateLesson({
            lessonId: lesson.id,
            targetLanguage: selectedLanguage,
            translateNodes: true
          });

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Failed to translate lesson ${lesson.id}:`, error);
        }

        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast({
        title: "Bulk Translation Complete",
        description: `Successfully translated ${successCount} lessons. ${errorCount} failed.`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-learning-primary">Translation</h2>
        <p className="text-muted-foreground">
          Manage translations and view translation insights
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Translation Dashboard
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Translation Editor
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Translation Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <TranslationDashboard />
        </TabsContent>

        <TabsContent value="editor">
          <TranslationEditor />
        </TabsContent>

        <TabsContent value="management">
          <div className="space-y-6">
            {/* Language Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Target Language
                </CardTitle>
                <CardDescription>
                  Select the language you want to use for translation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center gap-2">
                          {language.flag_emoji && <span>{language.flag_emoji}</span>}
                          <span>{language.native_name || language.display_name || language.name}</span>
                          {language.is_beta && (
                            <Badge variant="outline" className="text-xs">BETA</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Bulk Translation */}
            {selectedLanguage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Bulk Translation
                  </CardTitle>
                  <CardDescription>
                    Translate all published lessons to {getLanguageName(selectedLanguage)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{lessons.length}</div>
                    <div className="text-sm text-muted-foreground">
                      published lessons available for translation
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkTranslate}
                      disabled={loading || translating}
                      className="flex items-center gap-2"
                      title="Translate All Lessons"
                    >
                      {loading ? (
                        <Languages className="h-4 w-4 animate-spin" />
                      ) : (
                        <BulkTranslationIcon className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={fetchLessons}
                      className="flex items-center gap-2"
                      title="Refresh Lessons"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Lessons */}
            {selectedLanguage && lessons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Individual Lesson Translation</CardTitle>
                  <CardDescription>
                    Translate specific lessons to {getLanguageName(selectedLanguage)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground break-words">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTranslateLesson(lesson.id)}
                            disabled={translating}
                            className="flex items-center gap-1"
                            title="Translate"
                          >
                            {translating ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Languages className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};