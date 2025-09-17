import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, BookOpen, Calendar, Clock, CheckCircle, Grid, List, ChevronUp, ChevronDown, Trophy, Target, Award, AlertTriangle, TrendingUp, Users, Star, Download, ExternalLink, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { LearningTrackViewer } from './LearningTrackViewer';

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
  assignment_id?: string;
  assignment_status?: string;
  completion_required?: boolean;
}

interface UserStats {
  totalLearningHours: number;
  tracksCompleted: number;
  currentStreak: number;
  overallCompletion: number;
  complianceScore: number;
  certificatesEarned: number;
  lessonsCompletedThisMonth: number;
}

interface RecentActivity {
  id: string;
  type: 'lesson_completed' | 'track_completed' | 'certificate_earned' | 'streak_achieved';
  title: string;
  description: string;
  timestamp: string;
  score?: number;
}

interface Certificate {
  id: string;
  track_id: string;
  track_title: string;
  completed_at: string;
  progress_percentage: number;
  certificate_url?: string;
}

interface RequiredTraining {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  days_remaining?: number;
  progress_percentage: number;
}

interface ComparativeStats {
  organization: {
    totalUsers: number;
    userRank: number;
    userPercentile: number;
    avgLearningHours: number;
    avgTracksCompleted: number;
    avgComplianceScore: number;
    topPerformers: Array<{ name: string; tracksCompleted: number; learningHours: number }>;
  };
  department: {
    departmentName: string;
    departmentRank: number;
    totalDepartments: number;
    avgLearningHours: number;
    avgTracksCompleted: number;
    avgComplianceScore: number;
    topPerformers: Array<{ name: string; tracksCompleted: number; learningHours: number }>;
  };
  location: {
    locationName: string;
    locationRank: number;
    totalLocations: number;
    avgLearningHours: number;
    avgTracksCompleted: number;
    avgComplianceScore: number;
    topPerformers: Array<{ name: string; tracksCompleted: number; learningHours: number }>;
  };
  peers: {
    totalPeers: number;
    userRank: number;
    userPercentile: number;
    avgLearningHours: number;
    avgTracksCompleted: number;
    avgComplianceScore: number;
    topPeers: Array<{ name: string; tracksCompleted: number; learningHours: number }>;
  };
}

export const UserDashboard = () => {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<'title' | 'status' | 'progress_percentage'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [requiredTraining, setRequiredTraining] = useState<RequiredTraining[]>([]);
  const [comparativeStats, setComparativeStats] = useState<ComparativeStats | null>(null);
  const [comparativeStatsLoading, setComparativeStatsLoading] = useState(false);
  const [finalUserCompletedTracks, setFinalUserCompletedTracks] = useState(0);
  const [finalUserLearningHours, setFinalUserLearningHours] = useState(0);
  const [hasRealData, setHasRealData] = useState(false);
  const [showCertificates, setShowCertificates] = useState(false);
  const [showRequiredTraining, setShowRequiredTraining] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchUserTracks();
    fetchUserStats();
    fetchRecentActivity();
    fetchCertificates();
    fetchRequiredTraining();
    fetchComparativeStats();
  }, []);

  const fetchCertificates = async () => {
    try {
      if (!user?.id) return;

      // Get completed tracks that would earn certificates
      const { data: completedTracks } = await supabase
        .from('user_learning_track_progress')
        .select(`
          id,
          completed_at,
          progress_percentage,
          learning_tracks!inner(
            id,
            title,
            description
          )
        `)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      const certificatesData = completedTracks?.map(track => ({
        id: track.id,
        track_id: track.learning_tracks.id,
        track_title: track.learning_tracks.title,
        completed_at: track.completed_at || '',
        progress_percentage: track.progress_percentage || 100,
        certificate_url: undefined // Could be enhanced with actual certificate URLs
      })) || [];

      setCertificates(certificatesData);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const fetchRequiredTraining = async () => {
    try {
      if (!user?.id) return;

      // Get tracks that are required but not completed
      const { data: requiredTracks } = await supabase
        .from('learning_track_assignments')
        .select(`
          assignment_id,
          learning_track_id,
          due_date,
          completion_required,
          learning_tracks!inner(
            id,
            title,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('completion_required', true);

      const requiredTrainingData: RequiredTraining[] = [];

      for (const assignment of requiredTracks || []) {
        // Check if this track is completed
        const { data: progress } = await supabase
          .from('user_learning_track_progress')
          .select('completed_at, progress_percentage')
          .eq('user_id', user.id)
          .eq('learning_track_id', assignment.learning_track_id)
          .maybeSingle();

        if (!progress?.completed_at) {
          // Calculate days remaining
          const dueDate = assignment.due_date ? new Date(assignment.due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const daysRemaining = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          requiredTrainingData.push({
            id: assignment.learning_track_id,
            title: assignment.learning_tracks.title,
            description: assignment.learning_tracks.description,
            due_date: dueDate.toISOString(),
            days_remaining: daysRemaining,
            progress_percentage: progress?.progress_percentage || 0
          });
        }
      }

      setRequiredTraining(requiredTrainingData);
    } catch (error) {
      console.error('Error fetching required training:', error);
    }
  };

  const fetchComparativeStats = async () => {
    try {
      if (!user?.id) return;
      
      setComparativeStatsLoading(true);

      // Get user's profile to determine location and department
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', user.id)
        .single();

      // Get user's primary department
      const { data: userDepartment } = await supabase
        .from('user_departments')
        .select(`
          departments!inner(name)
        `)
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();

      const userLocation = userProfile?.location || 'Unknown';
      const userDepartmentName = userDepartment?.departments?.name || 'Unknown';

      // Get all users' learning data for comparisons
      const { data: allUserProgress, error: trackProgressError } = await supabase
        .from('user_learning_track_progress')
        .select(`
          user_id,
          progress_percentage,
          completed_at,
          learning_tracks!inner(title)
        `);

      // Also try a simpler query without the join to test RLS
      const { data: simpleTrackProgress, error: simpleTrackError } = await supabase
        .from('user_learning_track_progress')
        .select('user_id, progress_percentage, completed_at');

      console.log('🔍 Simple Track Progress Test:', {
        simpleTrackCount: simpleTrackProgress?.length || 0,
        simpleTrackError,
        sampleSimpleTrack: simpleTrackProgress?.[0]
      });

      // Get lesson progress with actual duration data
      const { data: allLessonProgress, error: lessonProgressError } = await supabase
        .from('user_lesson_progress')
        .select(`
          user_id,
          completed_at,
          lessons!inner(estimated_duration)
        `)
        .not('completed_at', 'is', null);

      console.log('🔍 Track Progress Debug:', {
        trackProgressCount: allUserProgress?.length || 0,
        trackProgressError,
        sampleTrackProgress: allUserProgress?.[0],
        completedTracks: allUserProgress?.filter(p => p.completed_at).length || 0
      });

      console.log('🔍 Lesson Progress Debug:', {
        lessonProgressCount: allLessonProgress?.length || 0,
        lessonProgressError,
        sampleLessonProgress: allLessonProgress?.[0],
        completedLessons: allLessonProgress?.length || 0
      });

      // Get all profiles for location/department mapping
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, location');

      // Get all user departments for department mapping
      const { data: allUserDepartments } = await supabase
        .from('user_departments')
        .select(`
          user_id,
          departments!inner(name)
        `)
        .eq('is_primary', true);

      // Check if we have any real progress data
      const hasRealDataValue = (allUserProgress && allUserProgress.length > 0) || (allLessonProgress && allLessonProgress.length > 0);
      
      // Use real data when available
      const useSampleData = false; // Use real data only
      setHasRealData(!useSampleData);

      // Debug logging
      console.log('=== Comparative Stats Debug ===');
      console.log('All user progress:', allUserProgress?.length || 0, 'records');
      console.log('All lesson progress:', allLessonProgress?.length || 0, 'records');
      console.log('All profiles:', allProfiles?.length || 0, 'records');
      console.log('Using sample data:', useSampleData);

      // Calculate user stats with actual lesson duration
      const userProgress = allUserProgress?.filter(p => p.user_id === user.id) || [];
      const userCompletedTracks = userProgress.filter(p => p.completed_at).length;
      
      // Calculate actual learning hours from completed lessons
      const userCompletedLessons = allLessonProgress?.filter(p => p.user_id === user.id) || [];
      const userLearningHours = Math.round(
        userCompletedLessons.reduce((total, lesson) => 
          total + (lesson.lessons?.estimated_duration || 10), 0
        ) / 60
      );

      const userCompletedTracksFinal = userCompletedTracks;
      const userLearningHoursFinal = userLearningHours;
      
      // Set the final user stats for display
      setFinalUserCompletedTracks(userCompletedTracksFinal);
      setFinalUserLearningHours(userLearningHoursFinal);

      console.log('Final user stats:', {
        completedTracks: userCompletedTracksFinal,
        learningHours: userLearningHoursFinal,
        useSampleData: useSampleData
      });

      // Calculate organization stats with actual lesson duration
      const allUsers = allProfiles?.map(p => p.id) || [];
      
      const userStats = allUsers.map((userId, index) => {
        const userProg = allUserProgress?.filter(p => p.user_id === userId) || [];
        const completedTracks = userProg.filter(p => p.completed_at).length;
        
        // Calculate actual learning hours from completed lessons
        const userCompletedLessons = allLessonProgress?.filter(p => p.user_id === userId) || [];
        const learningHours = Math.round(
          userCompletedLessons.reduce((total, lesson) => 
            total + (lesson.lessons?.estimated_duration || 10), 0
          ) / 60
        );
        
        return { userId, completedTracks, learningHours };
      });

      // Sort by completed tracks, then by learning hours, then by user name for consistent ordering
      userStats.sort((a, b) => {
        // Primary sort: completed tracks (descending)
        if (b.completedTracks !== a.completedTracks) {
          return b.completedTracks - a.completedTracks;
        }
        // Secondary sort: learning hours (descending)
        if (b.learningHours !== a.learningHours) {
          return b.learningHours - a.learningHours;
        }
        // Tertiary sort: user name (ascending) for consistent ordering
        const aProfile = allProfiles?.find(p => p.id === a.userId);
        const bProfile = allProfiles?.find(p => p.id === b.userId);
        const aName = aProfile?.full_name || aProfile?.username || 'Unknown User';
        const bName = bProfile?.full_name || bProfile?.username || 'Unknown User';
        return aName.localeCompare(bName);
      });
      const userRank = userStats.findIndex(stat => stat.userId === user.id) + 1;
      const userPercentile = Math.round(((userStats.length - userRank + 1) / userStats.length) * 100);

      // Update user stats with final values (real or sample)
      const finalUserStats = {
        ...userStats.find(stat => stat.userId === user.id),
        completedTracks: userCompletedTracksFinal,
        learningHours: userLearningHoursFinal
      };
      
      // Update the user's entry in userStats array
      const userIndex = userStats.findIndex(stat => stat.userId === user.id);
      if (userIndex !== -1) {
        userStats[userIndex] = finalUserStats;
      }

      // Calculate averages
      const avgTracksCompleted = Math.round(userStats.reduce((sum, stat) => sum + stat.completedTracks, 0) / userStats.length);
      const avgLearningHours = Math.round(userStats.reduce((sum, stat) => sum + stat.learningHours, 0) / userStats.length);

      console.log('User stats array:', userStats.slice(0, 5)); // Show first 5 users
      console.log('Averages:', { avgTracksCompleted, avgLearningHours });

      // Get top performers - ensure we show real users even if they have 0 tracks
      const topPerformers = userStats.slice(0, 5).map(stat => {
        const profile = allProfiles?.find(p => p.id === stat.userId);
        return {
          name: profile?.full_name || profile?.username || 'Unknown User',
          tracksCompleted: stat.completedTracks,
          learningHours: stat.learningHours
        };
      });

      // If we don't have enough users with completed tracks, fill with users who have 0 tracks
      if (topPerformers.length < 3) {
        const remainingUsers = allProfiles?.slice(0, 3 - topPerformers.length).map(profile => ({
          name: profile?.full_name || profile?.username || 'Unknown User',
          tracksCompleted: 0,
          learningHours: 0
        })) || [];
        topPerformers.push(...remainingUsers);
      }

      // Calculate department stats
      const departmentUsers = allUserDepartments?.filter(ud => ud.departments?.name === userDepartmentName) || [];
      const departmentUserIds = departmentUsers.map(ud => ud.user_id);
      const departmentStats = userStats.filter(stat => departmentUserIds.includes(stat.userId));
      
      const deptAvgTracksCompleted = Math.round(departmentStats.reduce((sum, stat) => sum + stat.completedTracks, 0) / departmentStats.length);
      const deptAvgLearningHours = Math.round(departmentStats.reduce((sum, stat) => sum + stat.learningHours, 0) / departmentStats.length);

      // Calculate location stats
      const locationUsers = allProfiles?.filter(p => p.location === userLocation) || [];
      const locationUserIds = locationUsers.map(p => p.id);
      const locationStats = userStats.filter(stat => locationUserIds.includes(stat.userId));
      
      const locAvgTracksCompleted = Math.round(locationStats.reduce((sum, stat) => sum + stat.completedTracks, 0) / locationStats.length);
      const locAvgLearningHours = Math.round(locationStats.reduce((sum, stat) => sum + stat.learningHours, 0) / locationStats.length);

      // Get unique departments and locations for ranking
      const uniqueDepartments = [...new Set(allUserDepartments?.map(ud => ud.departments?.name).filter(Boolean))];
      const uniqueLocations = [...new Set(allProfiles?.map(p => p.location).filter(Boolean))];

      // Calculate department and location rankings based on average performance
      const departmentAverages = uniqueDepartments.map(deptName => {
        const deptUsers = allUserDepartments?.filter(ud => ud.departments?.name === deptName) || [];
        const deptUserIds = deptUsers.map(ud => ud.user_id);
        const deptStats = userStats.filter(stat => deptUserIds.includes(stat.userId));
        const avgCourses = deptStats.length > 0 ? deptStats.reduce((sum, stat) => sum + stat.completedTracks, 0) / deptStats.length : 0;
        return { deptName, avgCourses };
      });
      
      const locationAverages = uniqueLocations.map(locName => {
        const locUsers = allProfiles?.filter(p => p.location === locName) || [];
        const locUserIds = locUsers.map(p => p.id);
        const locStats = userStats.filter(stat => locUserIds.includes(stat.userId));
        const avgCourses = locStats.length > 0 ? locStats.reduce((sum, stat) => sum + stat.completedTracks, 0) / locStats.length : 0;
        return { locName, avgCourses };
      });
      
      // Sort by average performance and find ranks
      departmentAverages.sort((a, b) => b.avgCourses - a.avgCourses);
      locationAverages.sort((a, b) => b.avgCourses - a.avgCourses);
      
      const departmentRank = departmentAverages.findIndex(dept => dept.deptName === userDepartmentName) + 1;
      const locationRank = locationAverages.findIndex(loc => loc.locName === userLocation) + 1;

      // Calculate peer stats (users in same department)
      const peerStats = departmentStats;
      const peerRank = peerStats.findIndex(stat => stat.userId === user.id) + 1;
      const peerPercentile = Math.round(((peerStats.length - peerRank + 1) / peerStats.length) * 100);

      const peerAvgTracksCompleted = Math.round(peerStats.reduce((sum, stat) => sum + stat.completedTracks, 0) / peerStats.length);
      const peerAvgLearningHours = Math.round(peerStats.reduce((sum, stat) => sum + stat.learningHours, 0) / peerStats.length);

      // Get top peers - ensure we show real users even if they have 0 tracks
      const topPeers = peerStats.slice(0, 5).map(stat => {
        const profile = allProfiles?.find(p => p.id === stat.userId);
        return {
          name: profile?.full_name || profile?.username || 'Unknown User',
          tracksCompleted: stat.completedTracks,
          learningHours: stat.learningHours
        };
      });

      // If we don't have enough peers with completed tracks, fill with department users who have 0 tracks
      if (topPeers.length < 3) {
        const departmentProfiles = allProfiles?.filter(p => departmentUserIds.includes(p.id)) || [];
        const remainingPeers = departmentProfiles
          .filter(profile => !topPeers.some(peer => peer.name === (profile?.full_name || profile?.username)))
          .slice(0, 3 - topPeers.length)
          .map(profile => ({
            name: profile?.full_name || profile?.username || 'Unknown User',
            tracksCompleted: 0,
            learningHours: 0
          }));
        topPeers.push(...remainingPeers);
      }

      // Calculate real compliance scores based on required vs completed tracks
      const calculateComplianceScore = async (userStats: any[], userIds: string[]) => {
        if (userIds.length === 0) return 0;
        
        try {
          // Get required tracks for these users
          const { data: requiredAssignments } = await supabase
            .from('learning_track_assignments')
            .select('user_id, learning_track_id, completion_required')
            .eq('completion_required', true)
            .in('user_id', userIds);
          
          if (!requiredAssignments || requiredAssignments.length === 0) return 100;
          
          // Get completed required tracks
          const { data: completedRequired } = await supabase
            .from('user_learning_track_progress')
            .select('user_id, learning_track_id, completed_at')
            .in('user_id', userIds)
            .not('completed_at', 'is', null);
          
          const totalRequired = requiredAssignments.length;
          const totalCompleted = completedRequired?.filter(completed => 
            requiredAssignments.some(required => 
              required.user_id === completed.user_id && 
              required.learning_track_id === completed.learning_track_id
            )
          ).length || 0;
          
          return totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 100;
        } catch (error) {
          console.error('Error calculating compliance score:', error);
          return 0;
        }
      };

      const orgComplianceScore = await calculateComplianceScore(userStats, allUsers);
      const deptComplianceScore = await calculateComplianceScore(departmentStats, departmentUserIds);
      const locComplianceScore = await calculateComplianceScore(locationStats, locationUserIds);
      const peerComplianceScore = await calculateComplianceScore(peerStats, departmentUserIds);

      setComparativeStats({
        organization: {
          totalUsers: allUsers.length,
          userRank,
          userPercentile,
          avgLearningHours,
          avgTracksCompleted,
          avgComplianceScore: orgComplianceScore,
          topPerformers
        },
        department: {
          departmentName: userDepartmentName,
          departmentRank,
          totalDepartments: uniqueDepartments.length,
          avgLearningHours: deptAvgLearningHours,
          avgTracksCompleted: deptAvgTracksCompleted,
          avgComplianceScore: deptComplianceScore,
          topPerformers: topPeers
        },
        location: {
          locationName: userLocation,
          locationRank,
          totalLocations: uniqueLocations.length,
          avgLearningHours: locAvgLearningHours,
          avgTracksCompleted: locAvgTracksCompleted,
          avgComplianceScore: locComplianceScore,
          topPerformers: topPeers.slice(0, 3) // Top 3 from location
        },
        peers: {
          totalPeers: peerStats.length,
          userRank: peerRank,
          userPercentile: peerPercentile,
          avgLearningHours: peerAvgLearningHours,
          avgTracksCompleted: peerAvgTracksCompleted,
          avgComplianceScore: peerComplianceScore,
          topPeers
        }
      });

    } catch (error) {
      console.error('Error fetching comparative stats:', error);
      toast({
        title: "Error",
        description: "Failed to load comparative statistics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setComparativeStatsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      if (!user?.id) return;

      // Get user's learning progress data
      const { data: lessonProgress } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      const { data: trackProgress } = await supabase
        .from('user_learning_track_progress')
        .select('*')
        .eq('user_id', user.id);

      const { data: answerResponses } = await supabase
        .from('user_answer_responses')
        .select('*')
        .eq('user_id', user.id);

      // Calculate stats
      const completedLessons = lessonProgress?.length || 0;
      const completedTracks = trackProgress?.filter(t => t.completed_at).length || 0;
      
      // Estimate learning hours (assuming 10 minutes per lesson)
      const totalLearningHours = Math.round((completedLessons * 10) / 60);
      
      // Calculate current streak (simplified - could be enhanced with actual login data)
      const currentStreak = Math.min(completedTracks * 2, 7); // Placeholder calculation
      
      // Calculate overall completion
      const totalAssignedTracks = tracks.filter(t => t.assignment_status === 'assigned').length;
      const overallCompletion = totalAssignedTracks > 0 ? Math.round((completedTracks / totalAssignedTracks) * 100) : 0;
      
      // Calculate compliance score (based on required completions)
      const requiredTracks = tracks.filter(t => t.completion_required);
      const completedRequired = requiredTracks.filter(t => t.progress?.completed_at).length;
      const complianceScore = requiredTracks.length > 0 ? Math.round((completedRequired / requiredTracks.length) * 100) : 100;
      
      // Lessons completed this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const lessonsThisMonth = lessonProgress?.filter(l => 
        new Date(l.completed_at || '') >= thisMonth
      ).length || 0;

      setUserStats({
        totalLearningHours,
        tracksCompleted: completedTracks,
        currentStreak,
        overallCompletion,
        complianceScore,
        certificatesEarned: completedTracks, // Simplified - could be enhanced with actual certificates
        lessonsCompletedThisMonth: lessonsThisMonth
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      if (!user?.id) return;

      const activities: RecentActivity[] = [];

      // Get recent lesson completions
      const { data: recentLessons, error: recentLessonsError } = await supabase
        .from('user_lesson_progress')
        .select(`
          id,
          completed_at,
          lessons!inner(title)
        `)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5);

      console.log('🔍 UserDashboard Recent Activity Debug:', {
        userId: user.id,
        recentLessonsCount: recentLessons?.length || 0,
        recentLessonsError,
        sampleLesson: recentLessons?.[0]
      });

      recentLessons?.forEach(lesson => {
        activities.push({
          id: lesson.id,
          type: 'lesson_completed',
          title: `Completed: ${lesson.lessons?.title}`,
          description: 'Lesson completed successfully',
          timestamp: lesson.completed_at || '',
        });
      });

      // Get recent track completions
      const { data: recentTracks } = await supabase
        .from('user_learning_track_progress')
        .select(`
          id,
          completed_at,
          learning_tracks!inner(title)
        `)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(3);

      recentTracks?.forEach(track => {
        activities.push({
          id: track.id,
          type: 'track_completed',
          title: `Track Completed: ${track.learning_tracks?.title}`,
          description: 'Learning track completed!',
          timestamp: track.completed_at || '',
        });
      });

      // Sort by timestamp and take top 8
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 8));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchUserTracks = async () => {
    try {
      // First, get assigned tracks
      const { data: assignedTracksData, error: assignedError } = await supabase
        .rpc('get_user_assigned_tracks', { user_id: user?.id || '' });

      if (assignedError) throw assignedError;

      // Get track details for assigned tracks
      const assignedTrackIds = assignedTracksData?.map(at => at.track_id) || [];
      
      let tracksQuery = supabase
        .from('learning_tracks')
        .select(`
          id,
          title,
          description,
          status,
          allow_parallel_tracks,
          schedule_type,
          start_date,
          end_date,
          duration_weeks,
          lessons_per_week,
          allow_all_lessons_immediately,
          schedule_days,
          max_lessons_per_week
        `)
        .eq('status', 'published')
        .order('title');

      // If user has assigned tracks, prioritize them
      if (assignedTrackIds.length > 0) {
        tracksQuery = tracksQuery.in('id', assignedTrackIds);
      }

      const { data: tracksData, error: tracksError } = await tracksQuery;

      if (tracksError) throw tracksError;

      // Get user progress for each track
      const tracksWithProgress = await Promise.all(
        (tracksData || []).map(async (track) => {
          // Get user progress
          const { data: progressData } = await supabase
            .from('user_learning_track_progress')
            .select('*')
            .eq('learning_track_id', track.id)
            .eq('user_id', user?.id || '')
            .maybeSingle();

          // Get lesson count and completed lessons
          const { data: trackLessons } = await supabase
            .from('learning_track_lessons')
            .select('lesson_id')
            .eq('learning_track_id', track.id)
            .order('order_index');

          const lessonIds = trackLessons?.map(tl => tl.lesson_id) || [];
          
          // Get completed lessons count
          const { count: completedLessonsCount } = await supabase
            .from('user_lesson_progress')
            .select('*', { count: 'exact' })
            .eq('user_id', user?.id || '')
            .in('lesson_id', lessonIds)
            .not('completed_at', 'is', null);

          const lessonCount = lessonIds.length;
          const completedCount = completedLessonsCount || 0;
          const progressPercentage = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

          // Find assignment data for this track
          const assignmentData = assignedTracksData?.find(at => at.track_id === track.id);

          return {
            ...track,
            progress: {
              ...progressData,
              progress_percentage: progressPercentage
            },
            lesson_count: lessonCount,
            assignment_id: assignmentData?.assignment_id,
            assignment_status: assignmentData?.status,
            completion_required: assignmentData?.completion_required
          };
        })
      );

      setTracks(tracksWithProgress);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch learning tracks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const enrollInTrack = async (trackId: string) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to enroll in learning tracks.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_learning_track_progress')
        .insert({
          learning_track_id: trackId,
          user_id: user.id,
          current_lesson_order: 0,
          progress_percentage: 0
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Enrolled in learning track successfully"
      });
      
      fetchUserTracks();
    } catch (error) {
      console.error('Error enrolling in track:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in learning track",
        variant: "destructive"
      });
    }
  };

  const startTrack = (track: LearningTrack) => {
    setSelectedTrack(track);
  };

  const handleSort = (field: 'title' | 'status' | 'progress_percentage') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedTracks = () => {
    return [...tracks].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          if (a.progress?.completed_at && b.progress?.completed_at) {
            aValue = 'completed';
            bValue = 'completed';
          } else if (a.progress && !a.progress.completed_at && b.progress && !b.progress.completed_at) {
            aValue = 'in_progress';
            bValue = 'in_progress';
          } else if (a.progress?.completed_at) {
            aValue = 'completed';
            bValue = b.progress ? 'in_progress' : 'available';
          } else if (b.progress?.completed_at) {
            aValue = a.progress ? 'in_progress' : 'available';
            bValue = 'completed';
          } else {
            aValue = a.progress ? 'in_progress' : 'available';
            bValue = b.progress ? 'in_progress' : 'available';
          }
          break;
        case 'progress_percentage':
          aValue = a.progress?.progress_percentage || 0;
          bValue = b.progress?.progress_percentage || 0;
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  if (selectedTrack) {
    return (
      <LearningTrackViewer
        track={selectedTrack}
        onBack={() => setSelectedTrack(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Continue Learning</TabsTrigger>
          <TabsTrigger value="analytics">🏆 Leaderboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-8">
          {/* Personal Progress Overview */}
          {userStats && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-learning-primary mb-2">Welcome Back!</h2>
                <p className="text-muted-foreground">Here's your learning progress and what's next</p>
              </div>
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-learning-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Learning Hours</p>
                    <p className="text-2xl font-bold text-learning-primary">{userStats.totalLearningHours}h</p>
                  </div>
                  <Clock className="w-8 h-8 text-learning-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-learning-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tracks Completed</p>
                    <p className="text-2xl font-bold text-learning-primary">{userStats.tracksCompleted}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-learning-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-learning-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold text-learning-primary">{userStats.currentStreak} days</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-learning-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-learning-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                    <p className="text-2xl font-bold text-learning-primary">{userStats.complianceScore}%</p>
                  </div>
                  <Target className="w-8 h-8 text-learning-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress and Activity Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Progress */}
            <Card className="border-learning-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-learning-accent" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion Rate</span>
                      <span>{userStats.overallCompletion}%</span>
                    </div>
                    <Progress value={userStats.overallCompletion} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">This Month</p>
                      <p className="font-semibold">{userStats.lessonsCompletedThisMonth} lessons</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Certificates</p>
                      <p className="font-semibold">{userStats.certificatesEarned} earned</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-learning-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-learning-accent" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tracks.find(t => t.progress && !t.progress.completed_at) ? (
                    <Button 
                      onClick={() => {
                        const inProgressTrack = tracks.find(t => t.progress && !t.progress.completed_at);
                        if (inProgressTrack) startTrack(inProgressTrack);
                      }}
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        const availableTrack = tracks.find(t => !t.progress);
                        if (availableTrack) enrollInTrack(availableTrack.id);
                      }}
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start New Track
                    </Button>
                  )}
                  
                  {requiredTraining.length > 0 && (
                    <Button 
                      variant="outline"
                      className="w-full justify-start border-orange-200 text-orange-700 hover:bg-orange-50"
                      size="sm"
                      onClick={() => setShowRequiredTraining(true)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Required Training Due ({requiredTraining.length})
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setShowCertificates(true)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Certificates ({certificates.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-learning-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-learning-accent" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 4).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-learning-accent rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Learning Tracks Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-learning-primary">Your Learning Tracks</h2>
            <p className="text-muted-foreground">Continue your learning journey</p>
          </div>
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
        </div>

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
                    <TableHead>Track</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(6)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-4 bg-muted rounded w-32"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-20"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-12"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-20"></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getSortedTracks().map((track) => (
              <Card key={track.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{track.title}</CardTitle>
                    <div className="flex flex-col gap-1">
                      {(track.progress?.completed_at || track.progress?.progress_percentage === 100) && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {track.progress && !track.progress.completed_at && track.progress.progress_percentage < 100 && (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                      {!track.progress && (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{track.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{track.progress?.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={track.progress?.progress_percentage || 0} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Lessons</p>
                        <p className="font-semibold">{track.lesson_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-semibold capitalize">{track.status}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!track.progress && (
                        <Button 
                          onClick={() => enrollInTrack(track.id)}
                          className="flex-1"
                          disabled={loading}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Enroll
                        </Button>
                      )}
                      {track.progress && !track.progress.completed_at && (
                        <Button 
                          onClick={() => startTrack(track)}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      )}
                      {track.progress?.completed_at && (
                        <Button 
                          onClick={() => startTrack(track)}
                          variant="outline"
                          className="flex-1"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      )}
                    </div>
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('title')}
                      className="h-auto p-0 font-semibold"
                    >
                      Track
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-semibold"
                    >
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('progress_percentage')}
                      className="h-auto p-0 font-semibold"
                    >
                      Progress
                      {sortField === 'progress_percentage' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Lessons</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedTracks().map((track) => (
                  <TableRow key={track.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{track.title}</div>
                        <div className="text-sm text-muted-foreground">{track.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(track.progress?.completed_at || track.progress?.progress_percentage === 100) && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {track.progress && !track.progress.completed_at && track.progress.progress_percentage < 100 && (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                      {!track.progress && (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={track.progress?.progress_percentage || 0} className="w-16 h-2" />
                        <span className="text-sm">{track.progress?.progress_percentage || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{track.lesson_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!track.progress && (
                          <Button 
                            onClick={() => enrollInTrack(track.id)}
                            size="sm"
                            disabled={loading}
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            Enroll
                          </Button>
                        )}
                        {track.progress && !track.progress.completed_at && (
                          <Button 
                            onClick={() => startTrack(track)}
                            size="sm"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Continue
                          </Button>
                        )}
                        {track.progress?.completed_at && (
                          <Button 
                            onClick={() => startTrack(track)}
                            variant="outline"
                            size="sm"
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          {/* Comparative Analytics Section */}
          <div className="space-y-6">
         
            {comparativeStatsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-learning-border">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : comparativeStats ? (
              <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Organization Comparison */}
                <Card className="border-learning-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-learning-accent" />
                      Organization Rank
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-learning-primary">
                          #{comparativeStats.organization.userRank}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          out of {comparativeStats.organization.totalUsers} employees
                        </div>
                        <div className="text-lg font-semibold text-green-600 mt-1">
                          Top {comparativeStats.organization.userPercentile}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Your Tracks</p>
                          <p className="font-semibold">{finalUserCompletedTracks}</p>
                          <p className="text-xs text-muted-foreground">
                            vs {comparativeStats.organization.avgTracksCompleted} avg
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Your Hours</p>
                          <p className="font-semibold">{finalUserLearningHours}h</p>
                          <p className="text-xs text-muted-foreground">
                            vs {comparativeStats.organization.avgLearningHours}h avg
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Top Performers</p>
                        <div className="space-y-2">
                          {comparativeStats.organization.topPerformers.slice(0, 3).map((performer, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                  {index + 1}
                                </span>
                                <span className="truncate">{performer.name}</span>
                              </span>
                              <span className="text-muted-foreground">{performer.tracksCompleted} tracks</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Department Comparison */}
                <Card className="border-learning-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-learning-accent" />
                      {comparativeStats.department.departmentName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-learning-primary">
                          #{comparativeStats.peers.userRank}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          in your department
                        </div>
                        <div className="text-lg font-semibold text-blue-600 mt-1">
                          Top {comparativeStats.peers.userPercentile}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Dept Average</p>
                          <p className="font-semibold">{comparativeStats.department.avgTracksCompleted} tracks</p>
                          <p className="text-xs text-muted-foreground">
                            {comparativeStats.department.avgLearningHours}h learning
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dept Rank</p>
                          <p className="font-semibold">#{comparativeStats.department.departmentRank}</p>
                          <p className="text-xs text-muted-foreground">
                            of {comparativeStats.department.totalDepartments} depts
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Top in Your Department</p>
                        <div className="space-y-2">
                          {comparativeStats.peers.topPeers.slice(0, 3).map((peer, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                  {index + 1}
                                </span>
                                <span className="truncate">{peer.name}</span>
                              </span>
                              <span className="text-muted-foreground">{peer.tracksCompleted} tracks</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Comparison */}
                <Card className="border-learning-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-learning-accent" />
                      {comparativeStats.location.locationName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-learning-primary">
                          #{comparativeStats.location.locationRank}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          location ranking
                        </div>
                        <div className="text-lg font-semibold text-purple-600 mt-1">
                          of {comparativeStats.location.totalLocations} locations
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Location Avg</p>
                          <p className="font-semibold">{comparativeStats.location.avgTracksCompleted} tracks</p>
                          <p className="text-xs text-muted-foreground">
                            {comparativeStats.location.avgLearningHours}h learning
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Compliance</p>
                          <p className="font-semibold">{comparativeStats.location.avgComplianceScore}%</p>
                          <p className="text-xs text-muted-foreground">
                            location average
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Top at Your Location</p>
                        <div className="space-y-2">
                          {comparativeStats.location.topPerformers.slice(0, 3).map((performer, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                  {index + 1}
                                </span>
                                <span className="truncate">{performer.name}</span>
                              </span>
                              <span className="text-muted-foreground">{performer.tracksCompleted} tracks</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Peer Comparison */}
                <Card className="border-learning-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-learning-accent" />
                      Peer Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-learning-primary">
                          {comparativeStats.peers.userPercentile}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          percentile
                        </div>
                        <div className="text-lg font-semibold text-orange-600 mt-1">
                          {comparativeStats.peers.userRank} of {comparativeStats.peers.totalPeers} peers
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Peer Average</p>
                          <p className="font-semibold">{comparativeStats.peers.avgTracksCompleted} tracks</p>
                          <p className="text-xs text-muted-foreground">
                            {comparativeStats.peers.avgLearningHours}h learning
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Your Performance</p>
                          <p className="font-semibold">{finalUserCompletedTracks} tracks</p>
                          <p className="text-xs text-muted-foreground">
                            {finalUserLearningHours}h learning
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Your Department Leaders</p>
                        <div className="space-y-2">
                          {comparativeStats.peers.topPeers.slice(0, 3).map((peer, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                  {index + 1}
                                </span>
                                <span className="truncate">{peer.name}</span>
                              </span>
                              <span className="text-muted-foreground">{peer.tracksCompleted} tracks</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Unable to load comparative statistics. Please try again later.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>


      {/* Certificates Modal */}
      <Dialog open={showCertificates} onOpenChange={setShowCertificates}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-learning-accent" />
              Your Certificates
            </DialogTitle>
            <DialogDescription>
              Certificates earned from completed learning tracks
            </DialogDescription>
          </DialogHeader>
          
          {certificates.length > 0 ? (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="border-learning-border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{cert.track_title}</CardTitle>
                        <CardDescription>
                          Completed on {new Date(cert.completed_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="ml-1 font-semibold">{cert.progress_percentage}%</span>
                        </div>
                        {cert.certificate_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-1" />
                              Download Certificate
                            </a>
                          </Button>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const track = tracks.find(t => t.id === cert.track_id);
                          if (track) {
                            setShowCertificates(false);
                            startTrack(track);
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Review Track
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-learning-primary mb-2">No certificates yet</h3>
              <p className="text-muted-foreground">
                Complete learning tracks to earn certificates.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Required Training Modal */}
      <Dialog open={showRequiredTraining} onOpenChange={setShowRequiredTraining}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Required Training Due
            </DialogTitle>
            <DialogDescription>
              Training that must be completed to maintain compliance
            </DialogDescription>
          </DialogHeader>
          
          {requiredTraining.length > 0 ? (
            <div className="space-y-4">
              {requiredTraining.map((training) => (
                <Card key={training.id} className="border-learning-border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{training.title}</CardTitle>
                        <CardDescription>{training.description}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant="outline" 
                          className={
                            training.days_remaining && training.days_remaining <= 0 
                              ? 'border-red-500 text-red-700' 
                              : training.days_remaining && training.days_remaining <= 7
                              ? 'border-orange-500 text-orange-700'
                              : 'border-blue-500 text-blue-700'
                          }
                        >
                          {training.days_remaining && training.days_remaining <= 0 
                            ? 'Overdue' 
                            : training.days_remaining && training.days_remaining <= 7
                            ? `${training.days_remaining} days left`
                            : `${training.days_remaining} days left`
                          }
                        </Badge>
                        {training.due_date && (
                          <div className="text-xs text-muted-foreground">
                            Due: {new Date(training.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{training.progress_percentage}%</span>
                        </div>
                        <Progress value={training.progress_percentage} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            const track = tracks.find(t => t.id === training.id);
                            if (track) {
                              setShowRequiredTraining(false);
                              startTrack(track);
                            }
                          }}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {training.progress_percentage > 0 ? 'Continue Training' : 'Start Training'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-learning-primary mb-2">All required training completed!</h3>
              <p className="text-muted-foreground">
                You're up to date with all mandatory training requirements.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};