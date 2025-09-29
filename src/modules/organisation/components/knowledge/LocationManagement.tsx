import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { useOrganisationContext } from '../../context/OrganisationContext';
import type { Location } from '../../types';

export const LocationManagement: React.FC = () => {
  const { supabaseClient, hasPermission } = useOrganisationContext();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    building: '',
    floor: '',
    room: '',
    status: 'Active',
  });

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (locationData: typeof formData) => {
      const { error } = await supabaseClient
        .from('locations')
        .insert([{
          name: locationData.name,
          description: locationData.description || null,
          building: locationData.building || null,
          floor: locationData.floor || null,
          room: locationData.room || null,
          status: locationData.status,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: "Success",
        description: "Location created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, ...locationData }: Location & typeof formData) => {
      const { error } = await supabaseClient
        .from('locations')
        .update({
          name: locationData.name,
          description: locationData.description || null,
          building: locationData.building || null,
          floor: locationData.floor || null,
          room: locationData.room || null,
          status: locationData.status,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
      setEditingLocation(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseClient
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: "Success",
        description: "Location deleted successfully",
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      building: '',
      floor: '',
      room: '',
      status: 'Active',
    });
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      building: location.building || '',
      floor: location.floor || '',
      room: location.room || '',
      status: location.status,
    });
  };

  const handleSubmit = () => {
    if (editingLocation) {
      updateLocationMutation.mutate({ 
        ...editingLocation,
        ...formData 
      });
    } else {
      createLocationMutation.mutate(formData);
    }
  };

  if (locationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Locations
              </CardTitle>
              <CardDescription>
                Manage organizational locations and facilities
              </CardDescription>
            </div>
            {hasPermission('canManageLocations') && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Location</DialogTitle>
                    <DialogDescription>
                      Add a new location to your organization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Location Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter location name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter location description (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="building">Building</Label>
                        <Input
                          id="building"
                          value={formData.building}
                          onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                          placeholder="Building name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="floor">Floor</Label>
                        <Input
                          id="floor"
                          value={formData.floor}
                          onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                          placeholder="Floor number"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="room">Room</Label>
                      <Input
                        id="room"
                        value={formData.room}
                        onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                        placeholder="Room number/name"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="status"
                        checked={formData.status === 'Active'}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'Active' : 'Inactive' }))}
                      />
                      <Label htmlFor="status">Active Location</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                      Create Location
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                {hasPermission('canManageLocations') && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations?.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{location.name}</div>
                      {location.description && (
                        <div className="text-sm text-muted-foreground">{location.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{location.building || '-'}</TableCell>
                  <TableCell>{location.floor || '-'}</TableCell>
                  <TableCell>{location.room || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      location.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {location.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(location.created_at).toLocaleDateString()}
                  </TableCell>
                  {hasPermission('canManageLocations') && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(location)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteLocationMutation.mutate(location.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {locations?.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No locations found</p>
              <p className="text-sm text-muted-foreground">Create your first location to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {hasPermission('canManageLocations') && (
        <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>
                Update location information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Location Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter location name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter location description (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-building">Building</Label>
                  <Input
                    id="edit-building"
                    value={formData.building}
                    onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                    placeholder="Building name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-floor">Floor</Label>
                  <Input
                    id="edit-floor"
                    value={formData.floor}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                    placeholder="Floor number"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-room">Room</Label>
                <Input
                  id="edit-room"
                  value={formData.room}
                  onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="Room number/name"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-status"
                  checked={formData.status === 'Active'}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'Active' : 'Inactive' }))}
                />
                <Label htmlFor="edit-status">Active Location</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLocation(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                Update Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};