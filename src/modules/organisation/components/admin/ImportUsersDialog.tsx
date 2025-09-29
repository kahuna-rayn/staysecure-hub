import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

const ImportUsersDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { createProfile } = useUserProfiles();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} is ready for import`,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const generateSampleCSV = () => {
    const headers = ['Email', 'Full Name', 'First Name', 'Last Name', 'Phone', 'Location', 'Bio', 'Employee ID'];
    const sampleData = [
      ['john.doe@company.com', 'John Doe', 'John', 'Doe', '+1-555-0123', 'New York Office', 'Software Engineer with 5 years experience', 'EMP-2024-001'],
      ['jane.smith@company.com', 'Jane Smith', 'Jane', 'Smith', '+1-555-0124', 'London Office', 'Marketing Manager', 'EMP-2024-002']
    ];
    
    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSampleXLSX = () => {
    // For now, just download the CSV version with .xlsx extension
    // In a full implementation, you'd use a library like xlsx
    generateSampleCSV();
  };

  const processUserImport = async (row: any) => {
    const email = row['Email'] || row['email'];
    
    if (!email) {
      console.error('Missing email for row:', row);
      throw new Error('Missing email');
    }

    console.log('Processing user:', email);

    // Use our create-user edge function instead of direct signUp
    const { data: authData, error: authError } = await supabase.functions.invoke('create-user', {
      body: {
        email: email,
        full_name: row['Full Name'] || row['full_name'] || 'Unknown User',
        first_name: row['First Name'] || row['first_name'] || '',
        last_name: row['Last Name'] || row['last_name'] || '',
        username: row['Username'] || row['username'] || '',
        phone: row['Phone'] || row['phone'] || '',
        location: row['Location'] || row['location'] || '',
        status: 'Pending',
        bio: row['Bio'] || row['bio'] || '',
        employee_id: row['Employee ID'] || row['employee_id'] || '',
        access_level: 'User'
      }
    });

    if (authError) {
      console.error('Auth error for user:', email, authError);
      throw authError;
    }

    if (authData && authData.user) {
      console.log('User created successfully:', email);
    } else if (authData && authData.error) {
      console.error('Create user error:', authData.error);
      throw new Error(authData.error);
    }

    return { email, success: true };
  };

  const handleImport = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const text = await uploadedFile.text();
      
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          const data = results.data as any[];
          
          if (data.length === 0) {
            toast({
              title: "Empty file",
              description: "The uploaded file contains no data",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          console.log('Processing', data.length, 'rows');
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          // Process users sequentially to avoid overwhelming the system
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Skip empty rows
            if (!row['Email'] && !row['email'] && !row['Full Name'] && !row['full_name']) {
              console.log('Skipping empty row at index', i);
              continue;
            }

            try {
              console.log(`Processing user ${i + 1} of ${data.length}:`, row['Email'] || row['email']);
              await processUserImport(row);
              successCount++;
              console.log(`Successfully processed user ${i + 1}`);
            } catch (error: any) {
              console.error(`Error importing user ${i + 1}:`, error);
              errorCount++;
              const email = row['Email'] || row['email'] || 'Unknown';
              errors.push(`${email}: ${error.message}`);
            }

            // Add a small delay between users to prevent rate limiting
            if (i < data.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          console.log('Import completed. Success:', successCount, 'Errors:', errorCount);

          toast({
            title: "Import completed",
            description: `Successfully imported ${successCount} users. ${errorCount} errors occurred. Users will need to activate their accounts via email. Roles and departments can be assigned after import.`,
          });

          if (errors.length > 0) {
            console.log('Import errors:', errors);
          }

          setUploadedFile(null);
          setIsProcessing(false);
          setIsOpen(false);
        },
        error: (error) => {
          console.error('Parse error:', error);
          toast({
            title: "Parse error",
            description: "Failed to parse the CSV file",
            variant: "destructive",
          });
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing the file",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isProcessing) {
      setUploadedFile(null);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import users in bulk. Users will be created with authentication accounts and will need to activate via email. Roles and departments can be assigned after import.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : uploadedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              
              {uploadedFile ? (
                <div>
                  <p className="text-lg font-medium text-green-700">File Ready for Import</p>
                  <p className="text-sm text-green-600 mt-1">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Click to select a different file or drop a new one here
                  </p>
                </div>
              ) : isDragActive ? (
                <p className="text-lg font-medium text-blue-700">Drop your user file here</p>
              ) : (
                <div>
                  <p className="text-lg font-medium">Drag and drop your user file here, or browse</p>
                  <p className="text-sm text-gray-500 mt-1">Supports CSV and Excel files (.xlsx, .xls)</p>
                </div>
              )}
            </div>

            {uploadedFile && (
              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUploadedFile(null)}
                  disabled={isProcessing}
                >
                  X
                </Button>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">User Import Template</h4>
            <p className="text-sm text-yellow-700 mb-3">Download a template for importing users with sample data.</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Users Template (CSV)</span>
                  <Badge variant="secondary" className="text-xs">Ready to use template</Badge>
                </div>
                <Button size="sm" variant="outline" onClick={generateSampleCSV}>Download</Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Required Columns</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                'Email', 'Full Name', 'First Name', 'Last Name', 
                'Phone', 'Location', 'Bio', 'Employee ID'
              ].map((column) => (
                <Badge key={column} variant="outline" className="text-xs">
                  {column}
                </Badge>
              ))}
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Email</strong> is required for each user</p>
              <p>• Users will be created with 'Pending' status and must activate via email</p>
              <p>• Roles and departments can be assigned after bulk import</p>
              <p>• All other fields are optional and will use default values if not provided</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersDialog;