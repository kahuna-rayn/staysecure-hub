import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingUp, Users, Target } from 'lucide-react';
import { PerformanceReport } from './PerformanceReport';
import { UserReport } from './UserReport';
import { ComplianceReport } from './ComplianceReport';
import { CustomReport } from './CustomReport';

export const ReportingDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-learning-primary">Reporting Dashboard</h2>
        <p className="text-muted-foreground">Generate comprehensive reports and insights</p>
      </div>

      {/* Report Categories */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance Reports
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Reports
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Compliance Reports
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Custom Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceReport />
        </TabsContent>

        <TabsContent value="user" className="space-y-6">
          <UserReport />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceReport />
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <CustomReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};