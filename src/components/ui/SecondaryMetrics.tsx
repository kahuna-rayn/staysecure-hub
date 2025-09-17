
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp,
  Clock,
  Laptop
} from 'lucide-react';

interface SecondaryMetricsProps {
  recentlyOnboarded: number;
  pendingReviews: number;
  hardwareCount: number;
}

const SecondaryMetrics: React.FC<SecondaryMetricsProps> = ({
  recentlyOnboarded,
  pendingReviews,
  hardwareCount
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recently Onboarded</p>
              <p className="text-2xl font-bold">{recentlyOnboarded}</p>
              <p className="text-sm text-muted-foreground">Assets added in last 30 days</p>
            </div>
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
              <p className="text-2xl font-bold">{pendingReviews}</p>
              <p className="text-sm text-muted-foreground">Assets awaiting compliance review</p>
            </div>
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hardware Assets</p>
              <p className="text-2xl font-bold">{hardwareCount}</p>
              <p className="text-sm text-muted-foreground">Physical devices managed</p>
            </div>
            <Laptop className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecondaryMetrics;
