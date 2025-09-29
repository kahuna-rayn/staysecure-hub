import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Users, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface RoleDetailProps {
  role: string;
  onBack: () => void;
}

const ComplianceRoleDetail: React.FC<RoleDetailProps> = ({ role, onBack }) => {
  const { data: roleAssignments, isLoading } = useQuery({
    queryKey: ['role-assignments', role],
    queryFn: async () => {
      // First get all users with this role
      const { data: userRoles } = await supabase
        .from('user_profile_roles')
        .select(`
          user_id,
          roles!inner(name)
        `)
        .eq('roles.name', role);

      if (!userRoles || userRoles.length === 0) {
        return [];
      }

      const userIds = userRoles.map(ur => ur.user_id);

      // Get all assignments for users with this role
      const { data: assignments, error } = await supabase
        .from('document_assignments')
        .select(`
          assignment_id,
          user_id,
          document_id,
          status,
          due_date,
          completed_at,
          assigned_at,
          documents(title, category)
        `)
        .in('user_id', userIds)
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
        document_title: assignment.documents?.title || 'Unknown Document',
        document_category: assignment.documents?.category || 'General',
        days_overdue: assignment.status !== 'Completed' && new Date(assignment.due_date) < new Date() 
          ? Math.ceil((new Date().getTime() - new Date(assignment.due_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));
    },
  });

  const { data: roleUsers } = useQuery({
    queryKey: ['role-users', role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profile_roles')
        .select(`
          user_id,
          roles!inner(name),
          profiles!inner(full_name)
        `)
        .eq('roles.name', role);

      if (error) throw error;
      return data;
    },
  });

  const stats = roleAssignments ? {
    total: roleAssignments.length,
    completed: roleAssignments.filter(a => a.status === 'Completed').length,
    overdue: roleAssignments.filter(a => a.status !== 'Completed' && new Date(a.due_date) < new Date()).length,
    pending: roleAssignments.filter(a => a.status !== 'Completed' && new Date(a.due_date) >= new Date()).length,
  } : { total: 0, completed: 0, overdue: 0, pending: 0 };

  const complianceRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  // Group assignments by user for user-level view
  const userStats = roleAssignments ? 
    Object.entries(
      roleAssignments.reduce((acc, assignment) => {
        const userId = assignment.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_name: assignment.user_name,
            department: assignment.department,
            assignments: [],
          };
        }
        acc[userId].assignments.push(assignment);
        return acc;
      }, {} as Record<string, any>)
    ).map(([userId, data]) => {
      const assignments = data.assignments;
      const completed = assignments.filter((a: any) => a.status === 'Completed').length;
      const overdue = assignments.filter((a: any) => a.status !== 'Completed' && new Date(a.due_date) < new Date()).length;
      
      return {
        user_id: userId,
        user_name: data.user_name,
        department: data.department,
        total_assignments: assignments.length,
        completed_assignments: completed,
        overdue_assignments: overdue,
        compliance_rate: assignments.length > 0 ? (completed / assignments.length) * 100 : 0,
      };
    }) : [];

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
          <h3 className="text-2xl font-bold">{role}</h3>
          <p className="text-muted-foreground">
            {roleUsers?.length || 0} users with this role
          </p>
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
          <CardTitle>Role Progress</CardTitle>
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

      {/* User Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Performance
          </CardTitle>
          <CardDescription>
            Individual compliance performance for users with this role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {userStats.map((user) => (
              <Card key={user.user_id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{user.user_name}</CardTitle>
                      <CardDescription>{user.department}</CardDescription>
                    </div>
                    <Badge className={user.compliance_rate >= 90 ? 'bg-green-100 text-green-800' : user.compliance_rate >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                      {Math.round(user.compliance_rate)}% Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{user.completed_assignments} / {user.total_assignments}</span>
                    </div>
                    <Progress value={user.compliance_rate} className="w-full" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Completed: {user.completed_assignments}</span>
                      <span>Overdue: {user.overdue_assignments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {userStats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found with this role.
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            All Assignments
          </CardTitle>
          <CardDescription>
            Detailed view of all document assignments for this role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleAssignments?.map((assignment) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {(!roleAssignments || roleAssignments.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No assignments found for this role.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceRoleDetail;