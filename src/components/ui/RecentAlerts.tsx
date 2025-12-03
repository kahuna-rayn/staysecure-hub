
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface RecentAlertsProps {
  pendingReviews: number;
  recentlyOnboarded: number;
}

const RecentAlerts: React.FC<RecentAlertsProps> = ({
  pendingReviews,
  recentlyOnboarded
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Alerts</CardTitle>
        <Button variant="ghost" size="sm">View All</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingReviews > 0 && (
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Pending compliance reviews</p>
              <p className="text-xs text-muted-foreground">{pendingReviews} assets require compliance review</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
        )}

        {recentlyOnboarded > 0 && (
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">New assets onboarded</p>
              <p className="text-xs text-muted-foreground">{recentlyOnboarded} new assets require compliance assessment before deployment</p>
              <p className="text-xs text-muted-foreground">1 day ago</p>
            </div>
          </div>
        )}

        <div className="flex items-start space-x-3">
          <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Upcoming compliance assessment</p>
            <p className="text-xs text-muted-foreground">DPE assessment scheduled for next week. 5 assets need review</p>
            <p className="text-xs text-muted-foreground">1 day ago</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentAlerts;
