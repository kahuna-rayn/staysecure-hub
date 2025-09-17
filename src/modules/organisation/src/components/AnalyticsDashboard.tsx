import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgressAnalytics } from './ProgressAnalytics';
import EnhancedMetrics from './EnhancedMetrics';
import { BarChart3, GraduationCap } from 'lucide-react';

export const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-learning-primary">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Monitor progress and education metrics across the organization</p>
      </div>

      {/* Nested Tabs */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Cybersecurity Behaviour Analytics
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Lesson Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <ProgressAnalytics />
        </TabsContent>

        <TabsContent value="education">
          <EnhancedMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};