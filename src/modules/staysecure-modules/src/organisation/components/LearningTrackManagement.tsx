import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Eye, Trash2, Search, Calendar, Users, Grid, List, ChevronUp, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LearningTrackBuilder } from './LearningTrackBuilder';
import { LearningTrackViewer } from '@/components/dashboard/LearningTrackViewer';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface LearningTrack {
  id: string;
  title: string;
  description: string;
  status: string;
  schedule_type: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  lessons_per_week: number;
  allow_all_lessons_immediately: boolean;
  allow_parallel_tracks: boolean;
  created_at: string;
}

export const LearningTrackManagement = () => {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<'title' | 'status' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch learning tracks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrack = () => {
    setSelectedTrack(null);
    setShowBuilder(true);
  };

  const handleEditTrack = (track: LearningTrack) => {
    setSelectedTrack(track);
    setShowBuilder(true);
  };

  const handleViewTrack = (track: LearningTrack) => {
    setSelectedTrack(track);
    setShowViewer(true);
  };

  const handleDeleteTrack = (trackId: string) => {
    setTrackToDelete(trackId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTrack = async () => {
    if (!trackToDelete) return;

    try {
      const { error } = await supabase
        .from('learning_tracks')
        .delete()
        .eq('id', trackToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Learning track deleted successfully"
      });
      fetchTracks();
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: "Error",
        description: "Failed to delete learning track",
        variant: "destructive"
      });
    } finally {
      setTrackToDelete(null);
    }
  };

  const handleSort = (field: 'title' | 'status' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredTracks = tracks
    .filter(track =>
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getScheduleText = (track: LearningTrack) => {
    switch (track.schedule_type) {
      case 'fixed_dates':
        return `${track.start_date} to ${track.end_date}`;
      case 'duration_based':
        return `${track.duration_weeks} weeks, ${track.lessons_per_week} lessons/week`;
      default:
        return 'Flexible scheduling';
    }
  };

  if (showBuilder) {
    return (
      <LearningTrackBuilder
        track={selectedTrack}
        onClose={() => {
          setShowBuilder(false);
          fetchTracks();
        }}
      />
    );
  }

  if (showViewer && selectedTrack) {
    return (
      <LearningTrackViewer
        track={selectedTrack}
        onBack={() => setShowViewer(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-learning-primary">Learning Track Management</h2>
          <p className="text-muted-foreground">Create and manage learning tracks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleCreateTrack} className="bg-learning-accent hover:bg-learning-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Learning Track
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search learning tracks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tracks View */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(6)].map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-muted rounded w-32"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-16"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-24"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded w-24"></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedAndFilteredTracks.map((track) => (
            <Card key={track.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{track.title}</CardTitle>
                  <Badge variant={track.status === 'published' ? 'default' : 'secondary'}>
                    {track.status}
                  </Badge>
                </div>
                <CardDescription>{track.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {getScheduleText(track)}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-3 h-3 mr-1" />
                    Created {new Date(track.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditTrack(track)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleViewTrack(track)}>
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTrack(track.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Title
                    {sortField === 'title' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Created
                    {sortField === 'created_at' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredTracks.map((track) => (
                <TableRow key={track.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{track.title}</div>
                      <div className="text-sm text-muted-foreground">{track.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={track.status === 'published' ? 'default' : 'secondary'} title={track.status}>
                      {track.status === 'published' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {getScheduleText(track)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(track.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditTrack(track)} title="Edit">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewTrack(track)} title="View">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTrack(track.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {sortedAndFilteredTracks.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-learning-primary mb-2">No learning tracks found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No tracks match your search criteria.' : 'Get started by creating your first learning track.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateTrack}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Learning Track
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Learning Track"
        description="Are you sure you want to delete this learning track? This action cannot be undone and will remove all associated lessons."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteTrack}
        variant="destructive"
      />
    </div>
  );
};