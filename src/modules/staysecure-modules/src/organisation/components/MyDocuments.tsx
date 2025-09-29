import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, AlertCircle, CheckCircle, Clock, ExternalLink, Search, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@staysecure/auth';

interface DocumentAssignment {
  assignment_id: string;
  document_id: string;
  document_version: number;
  assigned_at: string;
  due_date: string;
  status: 'Not started' | 'In progress' | 'Completed';
  completed_at?: string;
  notes?: string;
  document: {
    title: string;
    description?: string;
    category?: string;
    url?: string;
    file_name?: string;
    required: boolean;
  };
}

interface MyDocumentsProps {
  userId?: string; // Optional prop to view another user's documents
}

const MyDocuments: React.FC<MyDocumentsProps> = ({ userId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('assigned');

  // Use provided userId or fall back to current user
  const targetUserId = userId || user?.id;

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['document-assignments', targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_assignments')
        .select(`
          *,
          document:documents(*)
        `)
        .eq('user_id', targetUserId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as DocumentAssignment[];
    },
    enabled: !!targetUserId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'Not started') {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('document_assignments')
        .update(updateData)
        .eq('assignment_id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['document-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['document-compliance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-compliance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['department-compliance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['document-assignments-overview'] });
      toast({
        title: "Success",
        description: "Document status updated successfully",
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

  const handleStatusChange = (assignmentId: string, newStatus: string) => {
    updateStatusMutation.mutate({ assignmentId, status: newStatus });
  };

  const filteredAssignments = assignments?.filter(assignment => {
    const matchesSearch = assignment.document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.document.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const requiredAssignments = filteredAssignments?.filter(a => a.document.required);
  const optionalAssignments = filteredAssignments?.filter(a => !a.document.required);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'Completed';
  };

  const completedCount = assignments?.filter(a => a.status === 'Completed').length || 0;
  const totalCount = assignments?.length || 0;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Progress
          </CardTitle>
          <CardDescription>
            Your overall document reading progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} of {totalCount} documents completed
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progressPercentage}% Complete</span>
              <span>{totalCount - completedCount} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Documents</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label>Filter by Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Not started">Not Started</SelectItem>
              <SelectItem value="In progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document Lists */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assigned">
            All Assigned ({filteredAssignments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="required">
            Required ({requiredAssignments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="optional">
            Optional ({optionalAssignments?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <DocumentList assignments={filteredAssignments || []} onStatusChange={handleStatusChange} />
        </TabsContent>

        <TabsContent value="required" className="space-y-4">
          <DocumentList assignments={requiredAssignments || []} onStatusChange={handleStatusChange} />
        </TabsContent>

        <TabsContent value="optional" className="space-y-4">
          <DocumentList assignments={optionalAssignments || []} onStatusChange={handleStatusChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface DocumentListProps {
  assignments: DocumentAssignment[];
  onStatusChange: (assignmentId: string, status: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ assignments, onStatusChange }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'Completed';
  };

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <Card key={assignment.assignment_id} className={isOverdue(assignment.due_date, assignment.status) ? 'border-red-200' : ''}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{assignment.document.title}</CardTitle>
                  {assignment.document.required && (
                    <Badge variant="destructive" className="text-xs" title="Required">
                      <AlertTriangle className="w-3 h-3" />
                    </Badge>
                  )}
                  {isOverdue(assignment.due_date, assignment.status) && (
                    <Badge variant="destructive" className="text-xs" title="Overdue">
                      <Clock className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                {assignment.document.description && (
                  <CardDescription className="mt-2">
                    {assignment.document.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(assignment.status)}
                <Badge className={getStatusColor(assignment.status)} title={assignment.status}>
                  {getStatusIcon(assignment.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </div>
                {assignment.document.category && (
                  <Badge variant="outline" className="text-xs">
                    {assignment.document.category}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {assignment.document.url && (
                <Button variant="outline" size="sm" asChild title="View">
                  <a href={assignment.document.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                )}
                <Select 
                  value={assignment.status} 
                  onValueChange={(value) => onStatusChange(assignment.assignment_id, value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not started">Not Started</SelectItem>
                    <SelectItem value="In progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyDocuments;