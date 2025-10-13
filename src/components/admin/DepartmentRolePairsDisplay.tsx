import React from 'react';
import { Badge } from '@/components/ui/badge';

interface DepartmentRolePair {
  department: string;
  role: string;
}

interface DepartmentRolePairsDisplayProps {
  pairs?: DepartmentRolePair[];
  userId?: string;
}

export const DepartmentRolePairsDisplay: React.FC<DepartmentRolePairsDisplayProps> = ({ pairs, userId }) => {
  // If userId is provided, we could fetch the pairs here
  // For now, just display the pairs if provided
  if (!pairs || pairs.length === 0) {
    return <span className="text-muted-foreground">No assignments</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {pairs.map((pair, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {pair.department} - {pair.role}
        </Badge>
      ))}
    </div>
  );
};