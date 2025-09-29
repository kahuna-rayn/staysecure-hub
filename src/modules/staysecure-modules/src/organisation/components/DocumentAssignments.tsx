import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Search, FileText, Building, User, Calendar, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import DocumentAssignmentsDrillDown from './DocumentAssignmentsDrillDown';

interface Document {
  document_id: string;
  title: string;
  description?: string;
  category?: string;
  required: boolean;
  version: number;
  due_days: number;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Role {
  role_id: string;
  name: string;
  description?: string;
  department_id?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
}

const DocumentAssignments: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [assignmentType, setAssignmentType] = useState<'roles' | 'departments' | 'users'>('roles');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectedDocumentForDrillDown, setSelectedDocumentForDrillDown] = useState<{id: string, title: string} | null>(null);

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('title');

      if (error) throw error;
      return data as Document[];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Department[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Role[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ['document-assignments-overview'],
    queryFn: async () => {
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('document_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignmentsData || assignmentsData.length === 0) {
        return [];
      }

      // Get unique document IDs and user IDs
      const documentIds = [...new Set(assignmentsData.map(a => a.document_id))];
      const userIds = [...new Set(assignmentsData.map(a => a.user_id))];

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('document_id, title')
        .in('document_id', documentIds);

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        throw documentsError;
      }

      // Fetch user profiles  
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Create lookup maps
      const documentMap = new Map(documentsData?.map(d => [d.document_id, d]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Join the data
      return assignmentsData.map(assignment => ({
        ...assignment,
        document: documentMap.get(assignment.document_id),
        user: profileMap.get(assignment.user_id)
      }));
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) return;

      console.log('Creating assignment for document:', selectedDocument.document_id);
      console.log('Assignment type:', assignmentType);
      console.log('Selected targets:', selectedTargets);

      // Create assignments based on type
      if (assignmentType === 'roles') {
        const promises = selectedTargets.map(async roleId => {
          console.log('Inserting document_roles:', {
            document_id: selectedDocument.document_id,
            role_id: roleId
          });
          
          const result = await supabase.from('document_roles').insert({
            document_id: selectedDocument.document_id,
            role_id: roleId
          });
          
          console.log('Insert result:', result);
          
          if (result.error) {
            console.error('Error inserting document_roles:', result.error);
            throw result.error;
          }
          
          return result;
        });
        await Promise.all(promises);
      } else if (assignmentType === 'departments') {
        const promises = selectedTargets.map(async departmentId => {
          console.log('Inserting document_departments:', {
            document_id: selectedDocument.document_id,
            department_id: departmentId
          });
          
          const result = await supabase.from('document_departments').insert({
            document_id: selectedDocument.document_id,
            department_id: departmentId
          });
          
          console.log('Insert result:', result);
          
          if (result.error) {
            console.error('Error inserting document_departments:', result.error);
            throw result.error;
          }
          
          return result;
        });
        await Promise.all(promises);
      } else if (assignmentType === 'users') {
        const promises = selectedTargets.map(async userId => {
          console.log('Inserting document_users:', {
            document_id: selectedDocument.document_id,
            user_id: userId
          });
          
          const result = await supabase.from('document_users').insert({
            document_id: selectedDocument.document_id,
            user_id: userId
          });
          
          console.log('Insert result:', result);
          
          if (result.error) {
            console.error('Error inserting document_users:', result.error);
            throw result.error;
          }
          
          return result;
        });
        await Promise.all(promises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-assignments-overview'] });
      setIsAssignDialogOpen(false);
      setSelectedDocument(null);
      setSelectedTargets([]);
      toast({
        title: "Success",
        description: "Document assignments created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedDocument || selectedTargets.length === 0) return;
    createAssignmentMutation.mutate();
  };

  const handleTargetToggle = (targetId: string) => {
    setSelectedTargets(prev => 
      prev.includes(targetId) 
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );
  };

  const filteredDocuments = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssignmentTargets = () => {
    switch (assignmentType) {
      case 'roles':
        return roles || [];
      case 'departments':
        return departments || [];
      case 'users':
        return users || [];
      default:
        return [];
    }
  };

  const getTargetLabel = (target: any) => {
    if (assignmentType === 'roles') return target.name;
    if (assignmentType === 'departments') return target.name;
    if (assignmentType === 'users') return target.full_name;
    return '';
  };

  const getTargetId = (target: any) => {
    if (assignmentType === 'roles') return target.role_id;
    if (assignmentType === 'departments') return target.id;
    if (assignmentType === 'users') return target.id;
    return '';
  };

  // If drill-down is selected, show the drill-down component
  if (selectedDocumentForDrillDown) {
    return (
      <DocumentAssignmentsDrillDown
        documentId={selectedDocumentForDrillDown.id}
        documentTitle={selectedDocumentForDrillDown.title}
        onBack={() => setSelectedDocumentForDrillDown(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Assignments</h2>
          <p className="text-muted-foreground">
            Assign documents to roles, departments, or specific users
          </p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Document Assignment</DialogTitle>
              <DialogDescription>
                Assign a document to roles, departments, or specific users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Document Selection */}
              <div>
                <Label htmlFor="document">Select Document</Label>
                <Select onValueChange={(value) => {
                  const doc = documents?.find(d => d.document_id === value);
                  setSelectedDocument(doc || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents?.map(doc => (
                      <SelectItem key={doc.document_id} value={doc.document_id}>
                        {doc.title} (v{doc.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment Type */}
              <div>
                <Label>Assignment Type</Label>
                <Tabs value={assignmentType} onValueChange={(value) => {
                  setAssignmentType(value as 'roles' | 'departments' | 'users');
                  setSelectedTargets([]);
                }}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="roles">
                      <Users className="h-4 w-4 mr-1" />
                      Roles
                    </TabsTrigger>
                    <TabsTrigger value="departments">
                      <Building className="h-4 w-4 mr-1" />
                      Departments
                    </TabsTrigger>
                    <TabsTrigger value="users">
                      <User className="h-4 w-4 mr-1" />
                      Users
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Target Selection */}
              <div>
                <Label>Select Targets</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                  {getAssignmentTargets().map(target => (
                    <div key={getTargetId(target)} className="flex items-center space-x-2">
                      <Checkbox
                        id={getTargetId(target)}
                        checked={selectedTargets.includes(getTargetId(target))}
                        onCheckedChange={() => handleTargetToggle(getTargetId(target))}
                      />
                      <Label htmlFor={getTargetId(target)} className="text-sm">
                        {getTargetLabel(target)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssign} 
                  disabled={!selectedDocument || selectedTargets.length === 0}
                >
                  Create Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Assignment Overview */}
      <div className="grid gap-4">
        {/* Group assignments by document */}
        {(() => {
          const groupedAssignments = assignments?.reduce((acc, assignment) => {
            const docId = assignment.document_id;
            if (!acc[docId]) {
              acc[docId] = {
                document: assignment.document,
                assignments: []
              };
            }
            acc[docId].assignments.push(assignment);
            return acc;
          }, {} as Record<string, {document: any, assignments: any[]}>);

          return Object.values(groupedAssignments || {}).map((group) => (
            <Card key={group.document.document_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{group.document.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4" />
                      {group.assignments.length} staff assigned
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocumentForDrillDown({
                        id: group.document.document_id,
                        title: group.document.title
                      })}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Breakdown
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Status summary */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>{group.assignments.filter(a => a.status === 'Completed').length} Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>{group.assignments.filter(a => a.status === 'In progress').length} In Progress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>{group.assignments.filter(a => a.status === 'Not started').length} Not Started</span>
                    </div>
                  </div>
                  
                  {/* Recent assignments preview */}
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(group.assignments[0]?.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ));
        })()}
      </div>
    </div>
  );
};

export default DocumentAssignments;