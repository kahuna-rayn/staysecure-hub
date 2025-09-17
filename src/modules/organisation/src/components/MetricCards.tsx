import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Package, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface MetricCardsProps {
  totalStaff: number;
  cyberLearners: number;
  dataProtectionLearners: number;
  enrolledInLearnPercentage: number;
  completedLearnPercentage: number;
  completedPDPAPercentage: number;
}

const MetricCards: React.FC<MetricCardsProps> = ({
  totalStaff,
  cyberLearners,
  dataProtectionLearners,
  enrolledInLearnPercentage,
  completedLearnPercentage,
  completedPDPAPercentage
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
              <p className="text-3xl font-bold">{totalStaff}</p>
              <p className="text-sm text-muted-foreground">All registered staff members</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cyber Learners</p>
              <p className="text-3xl font-bold">{cyberLearners}</p>
              <p className="text-sm text-muted-foreground">Staff enrolled in cyber security learning</p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data Protection Learners</p>
              <p className="text-3xl font-bold">{dataProtectionLearners}</p>
              <p className="text-sm text-muted-foreground">Staff enrolled in data protection learning</p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Enrolled in Learn</p>
              <p className="text-3xl font-bold text-chart-1">{enrolledInLearnPercentage}%</p>
              <p className="text-sm text-muted-foreground">Staff participation rate</p>
            </div>
            <Users className="h-8 w-8 text-chart-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Learn</p>
              <p className="text-3xl font-bold text-chart-2">{completedLearnPercentage}%</p>
              <p className="text-sm text-muted-foreground">Cyber learning completion rate</p>
            </div>
            <CheckCircle className="h-8 w-8 text-chart-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed PDPA e-Learning</p>
              <p className="text-3xl font-bold text-chart-2">{completedPDPAPercentage}%</p>
              <p className="text-sm text-muted-foreground">Data protection completion rate</p>
            </div>
            <CheckCircle className="h-8 w-8 text-chart-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricCards;