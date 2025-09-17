
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  Upload,
  FileText
} from 'lucide-react';

interface QuickActionsProps {
  onAddNewAsset: () => void;
  onImportAssets: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddNewAsset,
  onImportAssets
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <p className="text-sm text-muted-foreground">Common tasks and actions</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="flex items-center gap-2 h-auto p-4" onClick={onAddNewAsset}>
            <Plus className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Add New Asset</div>
              <div className="text-sm text-muted-foreground">Register new hardware or software</div>
            </div>
          </Button>

          <Button variant="outline" className="flex items-center gap-2 h-auto p-4" onClick={onImportAssets}>
            <Upload className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Import Assets</div>
              <div className="text-sm text-muted-foreground">Bulk import from CSV/Excel</div>
            </div>
          </Button>

          <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
            <FileText className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Run Compliance Report</div>
              <div className="text-sm text-muted-foreground">Generate compliance assessment</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
