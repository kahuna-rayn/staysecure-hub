import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Building2, 
  Shield, 
  Plus,
  Send,
  Search,
  ArrowLeft,
  BarChart3,
  MapPin,
  User,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@staysecure/auth';
import LearningTrackAssignmentsDrillDown from './LearningTrackAssignmentsDrillDown';

interface Assignment {
  assignment_id: string;
  learning_track_id: string;
  user_id?: string;
  department_id?: string;
  role_id?: string;
  assigned_at: string;
  assigned_by: string | null;
  status: string;
  notes: string | null;
  completion_required: boolean;
  track_title?: string;
  user_name?: string;
  department_name?: string;
  role_name?: string;
}

interface LearningTrack {
  id: string;
  title: string;
  description: string;
  status: string;
}

interface User {
  id: string;
  full_name: string;
  status: string;
  location?: string;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface Role {
  role_id: string;
  name: string;
  description: string | null;
}

interface Location {
  id: string;
  name: string;
  description: string | null;
  building: string | null;
  floor: string | null;
  room: string | null;
}

type ViewMode = 'overview' | 'breakdown';

export const AssignmentManager = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userDepartments, setUserDepartments] = useState<{user_id: string, department_id: string}[]>([]);
  const [userRoles, setUserRoles] = useState<{user_id: string, role_id: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'roles' | 'departments' | 'users'>('departments');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [completionRequired, setCompletionRequired] = useState(true);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackForDrillDown, setSelectedTrackForDrillDown] = useState<{id: string, title: string} | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch learning tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('learning_tracks')
        .select('id, title, description, status')
        .eq('status', 'published');

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, status, location')
        .not('status', 'eq', 'inactive');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch departments
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('id, name, description');

      if (deptsError) throw deptsError;
      setDepartments(deptsData || []);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('role_id, name, description');

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, description, building, floor, room')
        .not('status', 'eq', 'inactive');

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);

      // Fetch user-department relationships (primary only)
      const { data: userDeptsData, error: userDeptsError } = await supabase
        .from('user_departments')
        .select('user_id, department_id')
        .eq('is_primary', true);

      if (userDeptsError) throw userDeptsError;
      setUserDepartments(userDeptsData || []);

      // Fetch user-role relationships (primary only)
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_profile_roles')
        .select('user_id, role_id')
        .eq('is_primary', true);

      if (userRolesError) throw userRolesError;
      setUserRoles(userRolesData || []);

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('learning_track_assignments')
        .select(`
          assignment_id,
          learning_track_id,
          user_id,
          assigned_at,
          assigned_by,
          status,
          notes,
          completion_required,
          learning_tracks!inner(title)
        `);

      if (assignmentsError) throw assignmentsError;

      // Fetch department assignments
      const { data: deptAssignmentsData, error: deptAssignmentsError } = await supabase
        .from('learning_track_department_assignments')
        .select(`
          assignment_id,
          learning_track_id,
          department_id,
          assigned_at,
          assigned_by,
          notes,
          learning_tracks!inner(title),
          departments!inner(name)
        `);

      if (deptAssignmentsError) throw deptAssignmentsError;

      // Fetch role assignments
      const { data: roleAssignmentsData, error: roleAssignmentsError } = await supabase
        .from('learning_track_role_assignments')
        .select(`
          assignment_id,
          learning_track_id,
          role_id,
          assigned_at,
          assigned_by,
          notes,
          learning_tracks!inner(title),
          roles!inner(name)
        `);

      if (roleAssignmentsError) throw roleAssignmentsError;

      // Combine all assignments
      const allAssignments: Assignment[] = [
        ...(assignmentsData || []).map(a => ({
          assignment_id: a.assignment_id,
          learning_track_id: a.learning_track_id,
          user_id: a.user_id,
          assigned_at: a.assigned_at,
          assigned_by: a.assigned_by,
          status: a.status || 'assigned',
          notes: a.notes,
          completion_required: a.completion_required,
          track_title: a.learning_tracks?.title,
          user_name: users.find(u => u.id === a.user_id)?.full_name
        })),
        ...(deptAssignmentsData || []).map(a => ({
          assignment_id: a.assignment_id,
          learning_track_id: a.learning_track_id,
          department_id: a.department_id,
          assigned_at: a.assigned_at,
          assigned_by: a.assigned_by,
          status: 'assigned',
          notes: a.notes,
          completion_required: true,
          track_title: a.learning_tracks?.title,
          department_name: a.departments?.name
        })),
        ...(roleAssignmentsData || []).map(a => ({
          assignment_id: a.assignment_id,
          learning_track_id: a.learning_track_id,
          role_id: a.role_id,
          assigned_at: a.assigned_at,
          assigned_by: a.assigned_by,
          status: 'assigned',
          notes: a.notes,
          completion_required: true,
          track_title: a.learning_tracks?.title,
          role_name: a.roles?.name
        }))
      ];

      setAssignments(allAssignments);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedTrack || selectedEntities.length === 0) {
      toast({
        title: "Error",
        description: "Please select a track and at least one target",
        variant: "destructive",
      });
      return;
    }

    try {
      let error;
      switch (assignmentType) {
        case 'users':
          const userAssignments = selectedEntities.map(entityId => ({
            learning_track_id: selectedTrack,
            user_id: entityId,
            assigned_by: user?.id,
            notes: notes || null,
            status: 'assigned',
            completion_required: completionRequired
          }));
          const { error: userError } = await supabase
            .from('learning_track_assignments')
            .insert(userAssignments);
          error = userError;
          break;
        case 'departments':
          const deptAssignments = selectedEntities.map(entityId => ({
            learning_track_id: selectedTrack,
            department_id: entityId,
            assigned_by: user?.id,
            notes: notes || null
          }));
          const { error: deptError } = await supabase
            .from('learning_track_department_assignments')
            .insert(deptAssignments);
          error = deptError;
          break;
        case 'roles':
          const roleAssignments = selectedEntities.map(entityId => ({
            learning_track_id: selectedTrack,
            role_id: entityId,
            assigned_by: user?.id,
            notes: notes || null
          }));
          const { error: roleError } = await supabase
            .from('learning_track_role_assignments')
            .insert(roleAssignments);
          error = roleError;
          break;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assignment created for ${selectedEntities.length} ${assignmentType}`,
      });

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedTrack('');
    setSelectedEntities([]);
    setNotes('');
    setCompletionRequired(true);
    setShowAssignmentDialog(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: 'Assigned', variant: 'secondary' as const },
      in_progress: { label: 'In Progress', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'default' as const },
      overdue: { label: 'Overdue', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Get unique tracks from assignments
  const uniqueTracks = [...new Set(assignments.map(a => a.learning_track_id))];

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment => {
    const track = tracks.find(t => t.id === assignment.learning_track_id);
    return track?.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get unique tracks from filtered assignments
  const filteredUniqueTracks = [...new Set(filteredAssignments.map(a => a.learning_track_id))];

  // Calculate breakdown statistics (following Document Assignments approach)
  const getBreakdownStats = () => {
    // Get all users who have learning track assignments (from learning_track_assignments table)
    const assignedUserIds = new Set(
      assignments
        .filter(assignment => assignment.user_id) // Only individual user assignments
        .map(assignment => assignment.user_id!)
    );
    
    // Get all assigned users
    const assignedUsers = users.filter(user => assignedUserIds.has(user.id));
    
    // Organization level (total assigned users)
    const organizationStats = {
      total: assignedUsers.length
    };

    // Location breakdown - group assigned users by location
    const locationStats = locations.map(location => {
      const locationUsers = assignedUsers.filter(user => user.location === location.name);
      
      return {
        id: location.id,
        name: location.name,
        count: locationUsers.length
      };
    }).filter(loc => loc.count > 0);

    // Department breakdown - group assigned users by their primary department
    const departmentStats = departments.map(dept => {
      const deptUsers = assignedUsers.filter(user => {
        const userDept = userDepartments.find(ud => ud.user_id === user.id);
        return userDept?.department_id === dept.id;
      });
      
      return {
        id: dept.id,
        name: dept.name,
        count: deptUsers.length
      };
    }).filter(dept => dept.count > 0);

    return {
      organization: organizationStats,
      locations: locationStats,
      departments: departmentStats
    };
  };

  // If drill-down is selected, show the drill-down component
  if (selectedTrackForDrillDown) {
    return (
      <LearningTrackAssignmentsDrillDown
        trackId={selectedTrackForDrillDown.id}
        trackTitle={selectedTrackForDrillDown.title}
        onBack={() => setSelectedTrackForDrillDown(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Learning Track Assignments</h1>
        </div>
        <div className="text-center py-8">Loading assignments...</div>
      </div>
    );
  }

  // Breakdown view (matching Document Assignments UI)
  if (viewMode === 'breakdown') {
    const stats = getBreakdownStats();

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode('overview')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assignment Breakdown</h1>
            <p className="text-muted-foreground">Organization-wide learning track assignments</p>
          </div>
        </div>

        {/* Organization Level */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Organization Level</h2>
          <h3 className="text-xl font-bold mb-4">Organization Level</h3>
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-semibold">Organization Overview</h4>
                    <p className="text-sm text-muted-foreground">Total assigned staff</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.organization.total}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Location</h2>
          <h3 className="text-xl font-bold mb-4">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.locations.map((location) => (
              <Card key={location.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold">{location.name}</h4>
                        <p className="text-sm text-muted-foreground">assigned staff</p>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">{location.count}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Departments</h2>
          <h3 className="text-xl font-bold mb-4">Departments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.departments.map((dept) => (
              <Card key={dept.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold">{dept.name}</h4>
                        <p className="text-sm text-muted-foreground">assigned staff</p>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">{dept.count}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main overview (assignments list)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Learning Track Assignments</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode('breakdown')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Breakdown
          </Button>
          <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Learning Track Assignment</DialogTitle>
                <DialogDescription>
                  Assign a learning track to roles, departments, or specific users.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Track Selection */}
                <div>
                  <Label>Select Learning Track</Label>
                  <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a learning track" />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          <div className="flex items-center gap-2">
                            <span>{track.title}</span>
                            <Badge variant={track.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                              {track.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignment Type */}
                <div>
                  <Label>Assignment Type</Label>
                   <Tabs value={assignmentType} onValueChange={(value) => setAssignmentType(value as any)} className="w-full">
                     <TabsList className="grid w-full grid-cols-3">
                       <TabsTrigger value="departments" className="flex items-center gap-2">
                         <Building2 className="w-4 h-4" />
                         Departments
                       </TabsTrigger>
                       <TabsTrigger value="roles" className="flex items-center gap-2">
                         <Shield className="w-4 h-4" />
                         Roles
                       </TabsTrigger>
                       <TabsTrigger value="users" className="flex items-center gap-2">
                         <Users className="w-4 h-4" />
                         Users
                       </TabsTrigger>
                     </TabsList>
                   </Tabs>
                </div>

                {/* Select Targets */}
                <div>
                  <Label>Select Targets</Label>
                   <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                     {assignmentType === 'departments' && (
                       <div className="space-y-2">
                         {departments
                           .sort((a, b) => a.name.localeCompare(b.name))
                           .map((dept) => (
                           <div key={dept.id} className="flex items-center space-x-2">
                             <Checkbox
                               id={`dept-${dept.id}`}
                               checked={selectedEntities.includes(dept.id)}
                               onCheckedChange={(checked) => {
                                 if (checked) {
                                   setSelectedEntities([...selectedEntities, dept.id]);
                                 } else {
                                   setSelectedEntities(selectedEntities.filter(id => id !== dept.id));
                                 }
                               }}
                             />
                             <Label htmlFor={`dept-${dept.id}`} className="text-sm font-normal">
                               {dept.name}
                             </Label>
                           </div>
                         ))}
                       </div>
                     )}
                     
                     {assignmentType === 'roles' && (
                       <div className="space-y-2">
                         {roles
                           .sort((a, b) => a.name.localeCompare(b.name))
                           .map((role) => (
                           <div key={role.role_id} className="flex items-center space-x-2">
                             <Checkbox
                               id={`role-${role.role_id}`}
                               checked={selectedEntities.includes(role.role_id)}
                               onCheckedChange={(checked) => {
                                 if (checked) {
                                   setSelectedEntities([...selectedEntities, role.role_id]);
                                 } else {
                                   setSelectedEntities(selectedEntities.filter(id => id !== role.role_id));
                                 }
                               }}
                             />
                             <Label htmlFor={`role-${role.role_id}`} className="text-sm font-normal">
                               {role.name}
                             </Label>
                           </div>
                         ))}
                       </div>
                     )}
                     
                     {assignmentType === 'users' && (
                       <div className="space-y-2">
                         {users
                           .sort((a, b) => a.full_name.localeCompare(b.full_name))
                           .map((user) => (
                           <div key={user.id} className="flex items-center space-x-2">
                             <Checkbox
                               id={`user-${user.id}`}
                               checked={selectedEntities.includes(user.id)}
                               onCheckedChange={(checked) => {
                                 if (checked) {
                                   setSelectedEntities([...selectedEntities, user.id]);
                                 } else {
                                   setSelectedEntities(selectedEntities.filter(id => id !== user.id));
                                 }
                               }}
                             />
                             <Label htmlFor={`user-${user.id}`} className="text-sm font-normal">
                               {user.full_name}
                             </Label>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this assignment..."
                  />
                </div>

                {/* Completion Required */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completion-required"
                    checked={completionRequired}
                    onCheckedChange={(checked) => setCompletionRequired(checked as boolean)}
                  />
                  <Label htmlFor="completion-required">Completion required</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment}>
                  Create Assignment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search learning tracks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Assignment Cards */}
      <div className="grid gap-4">
        {filteredUniqueTracks
          .sort((a, b) => {
            const trackA = tracks.find(t => t.id === a);
            const trackB = tracks.find(t => t.id === b);
            return (trackA?.title || '').localeCompare(trackB?.title || '');
          })
          .map(trackId => {
          const track = tracks.find(t => t.id === trackId);
          const trackAssignments = filteredAssignments.filter(a => a.learning_track_id === trackId);
          const trackStats = {
            total: trackAssignments.length,
            completed: trackAssignments.filter(a => a.status === 'completed').length,
            inProgress: trackAssignments.filter(a => a.status === 'in_progress').length,
            notStarted: trackAssignments.filter(a => a.status === 'assigned' || a.status === 'not_started').length
          };

          return (
            <Card key={trackId} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{track?.title || 'Unknown Track'}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{trackStats.total} staff assigned</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{trackStats.completed} Completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{trackStats.inProgress} In Progress</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>{trackStats.notStarted} Not Started</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTrackForDrillDown({
                        id: trackId,
                        title: track?.title || 'Unknown Track'
                      });
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Breakdown
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 