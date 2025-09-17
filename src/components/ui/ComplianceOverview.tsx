
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ComplianceOverviewProps {
  approvedHardware: number;
  totalHardware: number;
  approvedSoftware: number;
  totalSoftware: number;
  approvedAccounts: number;
  totalAccounts: number;
}

const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({
  approvedHardware,
  totalHardware,
  approvedSoftware,
  totalSoftware,
  approvedAccounts,
  totalAccounts
}) => {
  const hardwareComplianceRate = Math.round((approvedHardware / Math.max(totalHardware, 1)) * 100);
  const softwareComplianceRate = Math.round((approvedSoftware / Math.max(totalSoftware, 1)) * 100);
  const accountsComplianceRate = Math.round((approvedAccounts / Math.max(totalAccounts, 1)) * 100);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Compliance Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Hardware Assets</span>
            <span className="text-sm text-muted-foreground">{hardwareComplianceRate}% compliant</span>
          </div>
          <Progress value={hardwareComplianceRate} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{approvedHardware} Approved</span>
            <span>{totalHardware - approvedHardware} Pending/Issues</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Software Assets</span>
            <span className="text-sm text-muted-foreground">{softwareComplianceRate}% compliant</span>
          </div>
          <Progress value={softwareComplianceRate} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{approvedSoftware} Active</span>
            <span>{totalSoftware - approvedSoftware} Inactive/Issues</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">User Accounts</span>
            <span className="text-sm text-muted-foreground">{accountsComplianceRate}% compliant</span>
          </div>
          <Progress value={accountsComplianceRate} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{approvedAccounts} Approved</span>
            <span>{totalAccounts - approvedAccounts} Pending/Issues</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceOverview;
