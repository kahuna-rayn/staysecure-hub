import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, X, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ImportError {
  rowNumber: number;
  identifier: string; // email, name, or other identifying field
  field?: string;
  error: string;
  rawData?: any;
  type?: 'error' | 'warning';
}

interface ImportErrorReportProps {
  errors: ImportError[];
  warnings?: ImportError[];
  successCount: number;
  totalCount: number;
  isOpen: boolean;
  onClose: () => void;
  importType: string; // "users", "hardware", "software", etc.
}

export const ImportErrorReport: React.FC<ImportErrorReportProps> = ({
  errors,
  warnings = [],
  successCount,
  totalCount,
  isOpen,
  onClose,
  importType
}) => {
  const downloadErrorReport = () => {
    const headers = ['Row Number', 'Identifier', 'Field', 'Type', 'Message'];
    const allIssues = [
      ...errors.map(err => [err.rowNumber, err.identifier, err.field || 'N/A', 'Error', err.error]),
      ...warnings.map(warn => [warn.rowNumber, warn.identifier, warn.field || 'N/A', 'Warning', warn.error])
    ];
    
    const csvContent = [headers, ...allIssues]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `import_report_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const errorRate = totalCount > 0 ? ((errors.length / totalCount) * 100).toFixed(1) : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {errors.length > 0 ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : warnings.length > 0 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            Import Report: {importType}
          </DialogTitle>
          <DialogDescription>
            Review the import results and download detailed error and warning information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{successCount}</div>
              <div className="text-sm text-green-600">Successful</div>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{errors.length}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{warnings.length}</div>
              <div className="text-sm text-yellow-600">Warnings</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{errorRate}%</div>
              <div className="text-sm text-blue-600">Error Rate</div>
            </div>
          </div>

          {/* Action Buttons */}
          {(errors.length > 0 || warnings.length > 0) && (
            <div className="flex gap-2">
              <Button onClick={downloadErrorReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          )}

          {/* Error/Warning List */}
          {(errors.length > 0 || warnings.length > 0) ? (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                Issues ({errors.length + warnings.length})
              </h4>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-3">
                  {/* Show errors first */}
                  {errors.map((error, index) => (
                    <Alert 
                      key={`error-${index}`} 
                      variant="destructive"
                      className="relative"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Row {error.rowNumber}
                            </Badge>
                            <span className="font-semibold text-sm">{error.identifier}</span>
                            {error.field && (
                              <Badge variant="secondary" className="text-xs">
                                Field: {error.field}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1 text-destructive">{error.error}</p>
                          {error.rawData && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer hover:underline">
                                View raw data
                              </summary>
                              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(error.rawData, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  
                  {/* Show warnings second */}
                  {warnings.map((warning, index) => (
                    <Alert 
                      key={`warning-${index}`} 
                      variant="default"
                      className="relative bg-yellow-50 border-yellow-200 text-yellow-900"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs bg-yellow-200 text-yellow-800">
                              Warning
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Row {warning.rowNumber}
                            </Badge>
                            <span className="font-semibold text-sm">{warning.identifier}</span>
                            {warning.field && (
                              <Badge variant="secondary" className="text-xs">
                                Field: {warning.field}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1 text-yellow-800">{warning.error}</p>
                          {warning.rawData && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer hover:underline">
                                View raw data
                              </summary>
                              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(warning.rawData, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                All rows imported successfully! No errors or warnings to report.
              </AlertDescription>
            </Alert>
          )}

          {/* Common Error/Warning Patterns (if we detect them) */}
          {(errors.length > 0 || warnings.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-yellow-900 mb-2">
                Troubleshooting Tips
              </h4>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside pr-2">
                  {errors.length > 0 && (
                    <>
                      <li>Verify that all required fields are present in your CSV</li>
                      <li>Check for special characters or formatting issues</li>
                      <li>Ensure email addresses are valid and not duplicates</li>
                      <li>Review the error messages for specific guidance</li>
                    </>
                  )}
                  {warnings.length > 0 && (
                    <>
                      <li>Users with invalid locations were still created successfully</li>
                      <li>You can assign locations manually after import using the user management interface</li>
                      <li>Check the locations table to see available valid location names</li>
                      <li>Consider updating your import template with correct location names</li>
                    </>
                  )}
                  <li>Download the report to fix issues in bulk</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
