import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface UserDetailProps {
  userId: string;
  userName: string;
  department: string;
  onBack: () => void;
}

const ComplianceUserDetail: React.FC<UserDetailProps> = ({ userId, userName, department, onBack }) => {
  const { data: userAssignments, isLoading } = useQuery({
    queryKey: ['user-assignments', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_assignments')
        .select(`
          assignment_id,
          document_id,
          status,
          due_date,
          completed_at,
          assigned_at,
          documents(title, category)
        `)
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data.map(assignment => ({
        ...assignment,
        document_title: assignment.documents?.title || 'Unknown Document',
        document_category: assignment.documents?.category || 'General',
        days_overdue: assignment.status !== 'Completed' && new Date(assignment.due_date) < new Date() 
          ? Math.ceil((new Date().getTime() - new Date(assignment.due_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));
    },
  });

  const stats = userAssignments ? {
    total: userAssignments.length,
    completed: userAssignments.filter(a => a.status === 'Completed').length,
    overdue: userAssignments.filter(a => a.status !== 'Completed' && new Date(a.due_date) < new Date()).length,
    pending: userAssignments.filter(a => a.status !== 'Completed' && new Date(a.due_date) >= new Date()).length,
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
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
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
          <h3 className="text-2xl font-bold">{userName}</h3>
          <p className="text-muted-foreground">{department}</p>
        </div>
      </div>

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

      {/* Detailed Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Assignments
          </CardTitle>
          <CardDescription>
            Detailed view of all document assignments for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userAssignments?.map((assignment) => (
                <TableRow key={assignment.assignment_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment)}
                      {getStatusBadge(assignment)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {assignment.document_title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {assignment.document_category}
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
          
          {(!userAssignments || userAssignments.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No document assignments found for this user.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceUserDetail;