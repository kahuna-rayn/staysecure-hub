import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Users, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DocumentDetailProps {
  documentId: string;
  documentTitle: string;
  onBack: () => void;
}

const ComplianceDocumentDetail: React.FC<DocumentDetailProps> = ({ documentId, documentTitle, onBack }) => {
  const { data: documentAssignments, isLoading } = useQuery({
    queryKey: ['document-assignments', documentId],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from('document_assignments')
        .select(`
          assignment_id,
          user_id,
          status,
          due_date,
          completed_at,
          assigned_at
        `)
        .eq('document_id', documentId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Get user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      // Get user departments
      const { data: userDepartments } = await supabase
        .from('user_departments')
        .select(`
          user_id,
          is_primary,
          departments(name)
        `);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Create department map, prioritizing primary departments
      const departmentMap = new Map<string, string>();
      userDepartments?.forEach(ud => {
        const deptName = ud.departments?.name || 'Unknown';
        if (ud.is_primary || !departmentMap.has(ud.user_id)) {
          departmentMap.set(ud.user_id, deptName);
        }
      });

      return assignments.map(assignment => ({
        ...assignment,
        user_name: profileMap.get(assignment.user_id)?.full_name || 'Unknown User',
        department: departmentMap.get(assignment.user_id) || 'Unknown Department',
        days_overdue: assignment.status !== 'Completed' && new Date(assignment.due_date) < new Date() 
          ? Math.ceil((new Date().getTime() - new Date(assignment.due_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));
    },
  });

  const { data: documentInfo } = useQuery({
    queryKey: ['document-info', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('title, description, category, required, due_days')
        .eq('document_id', documentId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const stats = documentAssignments ? {
    total: documentAssignments.length,
    completed: documentAssignments.filter(a => a.status === 'Completed').length,
    overdue: documentAssignments.filter(a => a.status !== 'Completed' && new Date(a.due_date) < new Date()).length,
    pending: documentAssignments.filter(a => a.status !== 'Completed' && new Date(a.due_date) >= new Date()).length,
  } : { total: 0, completed: 0, overdue: 0, pending: 0 };

  const complianceRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  const getStatusIcon = (assignment: any) => {
    if (assignment.status === 'Completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (assignment.days_overdue > 0) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (assignment: any) => {
    if (assignment.status === 'Completed') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (assignment.days_overdue > 0) {
      return <Badge className="bg-red-100 text-red-800">{assignment.days_overdue}d overdue</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h3 className="text-2xl font-bold">{documentTitle}</h3>
          {documentInfo && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{documentInfo.category}</Badge>
              {documentInfo.required && (
                <Badge className="bg-red-100 text-red-800">Required</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Due in {documentInfo.due_days} days
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Document Description */}
      {documentInfo?.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{documentInfo.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${complianceRate >= 90 ? 'text-green-600' : complianceRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {Math.round(complianceRate)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{stats.completed} / {stats.total} completed</span>
            </div>
            <Progress value={complianceRate} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* User Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Assignments
          </CardTitle>
          <CardDescription>
            Status of all users assigned to read this document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentAssignments?.map((assignment) => (
                <TableRow key={assignment.assignment_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment)}
                      {getStatusBadge(assignment)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {assignment.user_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {assignment.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {assignment.completed_at 
                      ? format(new Date(assignment.completed_at), 'MMM dd, yyyy')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(assignment.assigned_at), 'MMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {(!documentAssignments || documentAssignments.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No assignments found for this document.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceDocumentDetail;