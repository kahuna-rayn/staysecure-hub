import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages, BarChart3, TrendingUp, Globe2, AlertTriangle, Clock, Eye, Activity, CheckCircle, Edit, Play, Loader2, Timer, DollarSign, PieChart, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { LessonViewer } from '@/components/lesson/LessonViewer';
import { loadLessonForPreview } from '@/lib/lessonPreview';

interface Language {
  code: string;
  name: string;
  display_name?: string;
  native_name?: string;
  flag_emoji?: string;
  is_active: boolean;
}

interface TranslationStats {
  total_lessons: number;
  translated_lessons: number;
  lessons_needing_updates: number;
}

interface OutdatedLesson {
  id: string;
  title: string;
  last_modified: string;
  created_by: string;
  translation_count: number;
  outdated_count: number;
  node_count: number;
  outdated_node_count: number;
  modified_by?: string;
  changes_summary?: string;
  outdated_translations?: Array<{
    language_code: string;
    last_translated: string;
    estimated_cost: number;
  }>;
  estimated_total_cost?: number;
}

interface RecentActivity {
  activity_type: string;
  lesson_title: string;
  language_code: string | null;
  activity_time: string;
  cost: number | null;
  user_email: string | null;
}

interface ActiveJob {
  id: string;
  lesson_title: string;
  target_language: string;
  status: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  total_cost: number | null;
  created_at: string;
  updated_at: string;
  progress_percentage: number;
  estimated_seconds_remaining: number | null;
}

interface MonthlySpend {
  total_monthly_spend: number;
  spend_by_language: Array<{
    language: string;
    spend: number;
    count: number;
  }>;
}

export const TranslationDashboard: React.FC = () => {
  const [stats, setStats] = useState<TranslationStats>({
    total_lessons: 0,
    translated_lessons: 0,
    lessons_needing_updates: 0
  });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [outdatedLessons, setOutdatedLessons] = useState<OutdatedLesson[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [monthlySpend, setMonthlySpend] = useState<MonthlySpend>({
    total_monthly_spend: 0,
    spend_by_language: []
  });
  const [loading, setLoading] = useState(true);
  const [showSpendDetails, setShowSpendDetails] = useState(false);
  const [showLessonPreview, setShowLessonPreview] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [previewLanguage, setPreviewLanguage] = useState('en');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [translatingLessons, setTranslatingLessons] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('activity');
  const { toast } = useToast();
  const { translateLesson, loading: translating } = useTranslation();

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
      // Don't show error toast as this is not critical
    }
  };

  useEffect(() => {
    fetchLanguages();
    fetchTranslationStats();
    fetchOutdatedLessons();
    fetchRecentActivity();
    fetchActiveJobs();
    fetchMonthlySpend();
  }, []);

  const fetchTranslationStats = async () => {
    try {
      setLoading(true);
      
      // Execute the SQL query for dashboard overview
      const { data, error } = await supabase.rpc('get_translation_dashboard_stats' as any);
      
      if (error) {
        console.error('Error fetching translation stats:', error);
        // Don't show error toast as the function might not exist yet
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching translation stats:', error);
      // Don't show error toast as the function might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data, error } = await supabase.rpc('get_recent_translation_activity' as any);
      
      if (error) {
        console.error('Error fetching recent activity:', error);
        // Don't show toast for this as it's not critical
        return;
      }

      if (data && Array.isArray(data)) {
        setRecentActivity(data);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchActiveJobs = async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_translation_jobs' as any);
      
      if (error) {
        console.error('Error fetching active jobs:', error);
        // Don't show toast for this as it's not critical
        return;
      }

      if (data && Array.isArray(data)) {
        setActiveJobs(data);
      }
    } catch (error) {
      console.error('Error fetching active jobs:', error);
    }
  };

  const fetchMonthlySpend = async () => {
    try {
      const { data, error } = await supabase.rpc('get_monthly_translation_spend' as any);
      
      if (error) {
        console.error('Error fetching monthly spend:', error);
        // Don't show toast for this as it's not critical
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setMonthlySpend(data[0]);
      }
    } catch (error) {
      console.error('Error fetching monthly spend:', error);
    }
  };

  const fetchOutdatedLessons = async () => {
    try {
      console.log('=== FETCHING OUTDATED LESSONS ===');
      
      // Execute the function for outdated lessons (using public version temporarily)
      const { data, error } = await supabase.rpc('get_lessons_with_outdated_content_public' as any);
      
      console.log('RPC Response:', { data, error });
      
      if (error) {
        console.error('Error fetching outdated lessons:', error);
        toast({
          title: "Error",
          description: `Failed to fetch outdated lessons: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data && Array.isArray(data)) {
        console.log('Raw outdated lessons data:', data);
        
        // Transform the data to match our interface
        const enhancedData = data.map((lesson: any) => ({
          id: lesson.lesson_id,
          title: lesson.lesson_title,
          last_modified: lesson.last_modified,
          created_by: lesson.created_by || 'Unknown',
          translation_count: 0,
          outdated_count: lesson.outdated_languages?.length || 0,
          node_count: 0,
          outdated_node_count: 0,
          modified_by: 'Unknown',
          outdated_translations: lesson.outdated_languages?.map((lang: any) => ({
            language_code: lang.language_code,
            last_translated: lang.last_translated,
            estimated_cost: 0
          })) || [],
          estimated_total_cost: 0,
          changes_summary: 'Content updated, translations need refresh'
        }));

        console.log('Enhanced outdated lessons:', enhancedData);
        setOutdatedLessons(enhancedData);
        
        toast({
          title: "Success",
          description: `Found ${enhancedData.length} lessons with outdated content`,
        });
      } else {
        console.log('No outdated lessons found');
        setOutdatedLessons([]);
        toast({
          title: "Info",
          description: "No lessons with outdated content found",
        });
      }
    } catch (error) {
      console.error('Error fetching outdated lessons:', error);
      toast({
        title: "Error",
        description: `Failed to fetch outdated lessons: ${error}`,
        variant: "destructive",
      });
    }
  };



  const handleViewSpendDetails = () => {
    setShowSpendDetails(true);
  };

  const handleTranslateLesson = async (lessonId: string, languageCode: string) => {
    const translationKey = `${lessonId}-${languageCode}`;
    
    // Add to translating set
    setTranslatingLessons(prev => new Set(prev).add(translationKey));
    
    try {
      const result = await translateLesson({
        lessonId,
        targetLanguage: languageCode,
        translateNodes: true
      });

      if (result.success) {
        toast({
          title: "Translation Started",
          description: `Translating lesson to ${getLanguageName(languageCode)}...`,
        });
        
        // Wait a moment for the translation to process, then refresh
        setTimeout(async () => {
          await fetchOutdatedLessons();
        }, 2000);
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Failed",
        description: "Failed to start translation",
        variant: "destructive"
      });
    } finally {
      // Remove from translating set
      setTranslatingLessons(prev => {
        const newSet = new Set(prev);
        newSet.delete(translationKey);
        return newSet;
      });
    }
  };

  const handleViewLesson = async (lessonId: string, languageCode: string) => {
    setLoadingPreview(true);
    setPreviewLanguage(languageCode);
    
    try {
      const transformedLesson = await loadLessonForPreview(lessonId);
      
      if (transformedLesson) {
        setPreviewLesson(transformedLesson);
        setShowLessonPreview(true);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(amount);
  };

  // Helper function to get language by code from database
  const getLanguageByCode = (code: string): Language | undefined => {
    return languages.find(lang => lang.code === code);
  };

  // Helper function to get language name from code
  const getLanguageName = (code: string): string => {
    const language = getLanguageByCode(code);
    return language?.display_name || language?.name || code;
  };

  // Helper function to get flag emoji for language code
  const getLanguageFlag = (code: string): string => {
    const language = getLanguageByCode(code);
    return language?.flag_emoji || '🌐';
  };

  // Helper function to get language display with flag
  const getLanguageDisplay = (code: string): string => {
    const language = getLanguageByCode(code);
    if (!language) return `${code.toUpperCase()}`;
    
    const flag = language.flag_emoji || '🌐';
    const name = language.display_name || language.name;
    return `${flag} ${name} (${code})`;
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'translation_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'content_modified':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'translation_started':
        return <Play className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadgeVariant = (activityType: string) => {
    switch (activityType) {
      case 'translation_completed':
        return 'default' as const;
      case 'content_modified':
        return 'secondary' as const;
      case 'translation_started':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getJobStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'processing':
        return 'default' as const;
      case 'pending':
        return 'secondary' as const;
      case 'failed':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatActivityType = (activityType: string) => {
    return activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Translation Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of translation progress and statistics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Languages</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{languages.length}</div>
            <p className="text-xs text-muted-foreground">Languages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.total_lessons}</div>
            <p className="text-xs text-muted-foreground">All lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translated Lessons</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.translated_lessons}</div>
            <p className="text-xs text-muted-foreground">Have translations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translation Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.total_lessons > 0 ? Math.round((stats.translated_lessons / stats.total_lessons) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>

        <Card className={stats.lessons_needing_updates > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${stats.lessons_needing_updates > 0 ? "text-orange-800" : ""}`}>
            Outdated Content
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.lessons_needing_updates > 0 ? "text-orange-600" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div 
              className={`cursor-pointer hover:bg-orange-100 p-2 rounded-lg transition-colors ${stats.lessons_needing_updates > 0 ? "hover:bg-orange-100" : "hover:bg-gray-100"}`}
              onClick={() => {
                if (stats.lessons_needing_updates > 0) {
                  setActiveTab('outdated');
                  fetchOutdatedLessons();
                }
              }}
            >
              <div className={`text-2xl font-bold ${stats.lessons_needing_updates > 0 ? "text-orange-800" : ""}`}>
                {loading ? '...' : stats.lessons_needing_updates}
              </div>
              <p className={`text-xs ${stats.lessons_needing_updates > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
              Lessons Needing Updates
              </p>
              {stats.lessons_needing_updates > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Click to view details
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div 
              className="cursor-pointer hover:bg-green-100 p-2 rounded-lg transition-colors"
              onClick={handleViewSpendDetails}
            >
              <div className="text-2xl font-bold text-green-800">
                {loading ? '...' : formatCurrency(monthlySpend.total_monthly_spend)}
              </div>
              <p className="text-xs text-green-600">This month</p>
              {monthlySpend.total_monthly_spend > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {monthlySpend.spend_by_language.length} languages • Click to view breakdown
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        // Load data when switching to outdated tab
        if (value === 'outdated') {
          fetchOutdatedLessons();
        }
      }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger 
            value="outdated"
            className={stats.lessons_needing_updates > 0 ? "bg-orange-100 text-orange-800 border-orange-200" : ""}
          >
            Outdated Content
            {stats.lessons_needing_updates > 0 && (
              <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800">
                {stats.lessons_needing_updates}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="languages">Language Status</TabsTrigger>
        </TabsList>

        {/* Recent Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Translation activities from the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getActivityIcon(activity.activity_type)}
                        <div>
                          <div className="font-medium">{activity.lesson_title}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.language_code && `${getLanguageDisplay(activity.language_code)} • `}
                            {activity.user_email && `by ${activity.user_email} • `}
                            {formatDate(activity.activity_time)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getActivityBadgeVariant(activity.activity_type)}>
                          {formatActivityType(activity.activity_type)}
                        </Badge>
                        {activity.cost && (
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(activity.cost)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent translation activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

                 {/* Outdated Content Tab */}
         <TabsContent value="outdated">
           <Card>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5 text-orange-600" />
                     Content with Outdated Translations
                   </CardTitle>
                   <CardDescription>
                     Lessons with content changes requiring translation updates
                   </CardDescription>
                 </div>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={async () => {
                     await fetchOutdatedLessons();
                     await fetchTranslationStats();
                   }}
                   disabled={loading}
                 >
                   <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                   Refresh
                 </Button>
               </div>
             </CardHeader>
             <CardContent>
               {outdatedLessons.length > 0 ? (
                 <div className="space-y-4">
                   {outdatedLessons.map((lesson) => (
                     <div key={lesson.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                       <div className="flex items-start justify-between mb-3">
                         <div className="flex items-center gap-2">
                           <AlertTriangle className="h-4 w-4 text-orange-600" />
                           <h3 className="font-semibold text-lg">{lesson.title}</h3>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                           <div className="text-sm text-muted-foreground mb-1">Modification Details:</div>
                           <div className="text-sm">
                             <div>Last modified: {formatDate(lesson.last_modified)} by {lesson.modified_by || 'Unknown'}</div>
                             <div>Changes: {lesson.changes_summary || 'Content updated, translations need refresh'}</div>
                           </div>
                         </div>
                         
                         <div>
                           <div className="text-sm text-muted-foreground mb-2">Outdated Translations:</div>
                           <div className="space-y-2">
                             {(() => {
                               // Get the outdated translations for this lesson
                               if (lesson.outdated_translations && lesson.outdated_translations.length > 0) {
                                 return lesson.outdated_translations.map((translation) => (
                                   <div key={translation.language_code} className="flex items-center justify-between">
                                     <Badge variant="outline" className="text-sm">
                                       {getLanguageDisplay(translation.language_code)}
                                       <span className="ml-1 text-muted-foreground">
                                         Last: {formatDate(translation.last_translated)}
                                       </span>
                                     </Badge>
                                     <div className="flex gap-1">
                                       <Button 
                                         variant="default" 
                                         size="sm" 
                                         title={`Update ${getLanguageName(translation.language_code)} translation`}
                                         onClick={() => handleTranslateLesson(lesson.id, translation.language_code)}
                                         disabled={translatingLessons.has(`${lesson.id}-${translation.language_code}`)}
                                       >
                                         {translatingLessons.has(`${lesson.id}-${translation.language_code}`) ? (
                                           <Languages className="h-4 w-4 animate-spin" />
                                         ) : (
                                           <Languages className="h-4 w-4" />
                                         )}
                                       </Button>
                                       <Button 
                                         variant="outline" 
                                         size="sm" 
                                         title={`View lesson in ${getLanguageName(translation.language_code)}`}
                                         onClick={() => handleViewLesson(lesson.id, translation.language_code)}
                                         disabled={loadingPreview}
                                       >
                                         {loadingPreview ? (
                                           <Loader2 className="h-4 w-4 animate-spin" />
                                         ) : (
                                           <Eye className="h-4 w-4" />
                                         )}
                                       </Button>
                                     </div>
                                   </div>
                                 ));
                               } else {
                                 // Fallback: show all active languages as potentially outdated
                                 return languages.map((language) => (
                                   <div key={language.code} className="flex items-center justify-between">
                                     <Badge variant="outline" className="text-sm">
                                       {getLanguageDisplay(language.code)}
                                       <span className="ml-1 text-muted-foreground">
                                         Last: {formatDate(lesson.last_modified)}
                                       </span>
                                     </Badge>
                                     <div className="flex gap-1">
                                       <Button 
                                         variant="default" 
                                         size="sm" 
                                         title={`Update ${getLanguageName(language.code)} translation`}
                                         onClick={() => handleTranslateLesson(lesson.id, language.code)}
                                         disabled={translatingLessons.has(`${lesson.id}-${language.code}`)}
                                       >
                                         {translatingLessons.has(`${lesson.id}-${language.code}`) ? (
                                           <RefreshCw className="h-4 w-4 animate-spin" />
                                         ) : (
                                           <RefreshCw className="h-4 w-4" />
                                         )}
                                       </Button>
                                       <Button 
                                         variant="outline" 
                                         size="sm" 
                                         title={`View lesson in ${getLanguageName(language.code)}`}
                                         onClick={() => handleViewLesson(lesson.id, language.code)}
                                         disabled={loadingPreview}
                                       >
                                         {loadingPreview ? (
                                           <Loader2 className="h-4 w-4 animate-spin" />
                                         ) : (
                                           <Eye className="h-4 w-4" />
                                         )}
                                       </Button>
                                     </div>
                                   </div>
                                 ));
                               }
                             })()}
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-muted-foreground">
                   <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                   <p>No lessons with outdated content found.</p>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>

        {/* Language Status Tab */}
        <TabsContent value="languages">
      <Card>
        <CardHeader>
          <CardTitle>Language Status</CardTitle>
          <CardDescription>
            Translation status for each supported language
          </CardDescription>
        </CardHeader>
        <CardContent>
              {languages.length > 0 ? (
          <div className="space-y-4">
                  {languages.map((language) => (
                    <div key={language.code} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                        <span className="text-lg">{language.flag_emoji || '🌐'}</span>
                <div>
                          <div className="font-medium">{language.display_name || language.name}</div>
                          {language.native_name && (
                            <div className="text-sm text-muted-foreground">{language.native_name}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant={language.is_active ? "secondary" : "outline"}>
                        {language.is_active ? "Ready" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No languages configured</p>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>



      {/* Monthly Spend Details Dialog */}
      <Dialog open={showSpendDetails} onOpenChange={setShowSpendDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Monthly Spend Breakdown
            </DialogTitle>
            <DialogDescription>
              Translation costs by language for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-800">Total Monthly Spend</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlySpend.total_monthly_spend)}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-800">Languages Used</div>
                <div className="text-2xl font-bold text-blue-600">
                  {monthlySpend.spend_by_language.length}
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Language</TableHead>
                  <TableHead>Translations</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySpend.spend_by_language.map((lang) => (
                  <TableRow key={lang.language}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getLanguageDisplay(lang.language)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{lang.count}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(lang.spend)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={monthlySpend.total_monthly_spend > 0 ? (lang.spend / monthlySpend.total_monthly_spend) * 100 : 0} 
                          className="w-20" 
                        />
                        <span className="text-sm">
                          {monthlySpend.total_monthly_spend > 0 
                            ? Math.round((lang.spend / monthlySpend.total_monthly_spend) * 100)
                            : 0}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Preview Dialog */}
      <Dialog open={showLessonPreview} onOpenChange={setShowLessonPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Lesson Preview - {getLanguageName(previewLanguage)}
            </DialogTitle>
            <DialogDescription>
              Previewing lesson in {getLanguageName(previewLanguage)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
                         {previewLesson && (
                <LessonViewer
                  lesson={previewLesson}
                  isPreview={true}
                  initialLanguage={previewLanguage}
                  onComplete={() => setShowLessonPreview(false)}
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