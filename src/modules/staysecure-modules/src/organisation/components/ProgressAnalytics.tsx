import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, BookOpen, Clock, LoaderCircle } from 'lucide-react';
import { useProgressAnalytics } from '@/hooks/useProgressAnalytics';
import { CybersecurityAssessmentInsights } from './CybersecurityAssessmentInsights';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const ProgressAnalytics = () => {
  const { data: analytics, isLoading, error } = useProgressAnalytics();

  // Fetch cybersecurity assessment data from csba_domain_score_view
  const { data: cybersecurityAssessmentData = [] } = useQuery({
    queryKey: ['cybersecurity-assessment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csba_domain_score_view' as any)
        .select('domain, domain_avg')
        .not('domain_avg', 'is', null);
      
      if (error) throw error;
      
      // Transform data to include colors and rename score field
      return (data || []).map((item: any) => ({
        domain: item.domain,
        score: item.domain_avg,
        color: '#3b82f6'
      }));
    },
  });

  // Fetch priority data for heat map using the existing priority column
  const { data: priorityData = [] } = useQuery({
    queryKey: ['cybersecurity-priority'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csba_domain_score_view' as any)
        .select('domain, priority')
        .not('priority', 'is', null);
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        domain: item.domain,
        priority: item.priority
      })).sort((a, b) => {
        // Sort positive priorities (best to worst) at top, then negative priorities (worst to best) below
        if (a.priority >= 0 && b.priority >= 0) {
          return b.priority - a.priority; // Positive: best to worst
        } else if (a.priority < 0 && b.priority < 0) {
          return a.priority - b.priority; // Negative: worst to best
        } else {
          return b.priority - a.priority; // Positive before negative
        }
      });
    },
  });

  // Fetch key insights data
  const { data: keyInsightsData = [] } = useQuery({
    queryKey: ['key-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csba_key_insights_view' as any)
        .select('*');
      
      if (error) throw error;
      return (data || []) as unknown as Array<{n: number, insight: string, domain: string}>;
    },
  });

  // Fetch detailed insights data for top 3 areas of improvement
  const { data: detailedInsightsData = [] } = useQuery({
    queryKey: ['detailed-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csba_detailed_insights_view' as any)
        .select('*')
        .limit(3); // Limit to top 3 areas
      
      if (error) throw error;
      return (data || []) as unknown as Array<{domain_short: string, domain: string, question: string, avg_score: number, recommendation: string}>;
    },
  });

  const isCybersecurityLoading = !cybersecurityAssessmentData.length && !priorityData.length && !keyInsightsData.length && !detailedInsightsData.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground">
        Failed to load analytics data
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Cybersecurity Assessment Insights */}
      <CybersecurityAssessmentInsights
        cybersecurityAssessmentData={cybersecurityAssessmentData}
        priorityData={priorityData}
        keyInsightsData={keyInsightsData}
        detailedInsightsData={detailedInsightsData}
        isLoading={isCybersecurityLoading}
      />

      {/* Divider */}
      <div className="border-t border-border my-8" />


    </div>
  );
};