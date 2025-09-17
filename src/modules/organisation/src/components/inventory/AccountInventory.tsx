import React, { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AccountInventory: React.FC = () => {
  const { accountInventory, addAccountItem, loading } = useInventory();
  const { profiles } = useUserProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    username_email: '',
    software: '',
    department: '',
    role_account_type: '',
    data_class: '',
    approval_status: 'Not submitted',
    authorized_by: '',
    date_access_created: '',
    date_access_revoked: '',
    created_by: '',
    modified_by: '',
    date_column: '',
    status: 'Active',
  });

  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = profiles.find(profile => profile.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        full_name: selectedUser.full_name || '',
        username_email: selectedUser.email || selectedUser.username || '',
        department: selectedUser.department || '',
        role_account_type: selectedUser.role || '',
      }));
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setFormData({
      full_name: '',
      username_email: '',
      software: '',
      department: '',
      role_account_type: '',
      data_class: '',
      approval_status: 'Not submitted',
      authorized_by: '',
      date_access_created: '',
      date_access_revoked: '',
      created_by: '',
      modified_by: '',
      date_column: '',
      status: 'Active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAccountItem({
        ...formData,
        date_access_created: formData.date_access_created || undefined,
        date_access_revoked: formData.date_access_revoked || undefined,
        date_column: formData.date_column || undefined,
      });
      toast({
        title: "Account item added",
        description: "Account inventory item has been successfully added.",
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-red-500';
      case 'Suspended': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div>Loading account inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Account Inventory</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Account Item</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="user_select">Select User *</Label>
                  <Select value={selectedUserId} onValueChange={handleUserSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user from User Management" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name || 'No name'} ({profile.email || profile.username || 'No email'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUserId && (
                  <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Selected User Details:</h4>
                    <p><strong>Name:</strong> {formData.full_name}</p>
                    <p><strong>Email/Username:</strong> {formData.username_email}</p>
                    <p><strong>Department:</strong> {formData.department || 'Not specified'}</p>
                    <p><strong>Role:</strong> {formData.role_account_type || 'Not specified'}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Auto-filled when user is selected"
                    required
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="username_email">Username/Email *</Label>
                  <Input
                    id="username_email"
                    value={formData.username_email}
                    onChange={(e) => setFormData({ ...formData, username_email: e.target.value })}
                    placeholder="Auto-filled when user is selected"
                    required
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="software">Software</Label>
                  <Input
                    id="software"
                    value={formData.software}
                    onChange={(e) => setFormData({ ...formData, software: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="role_account_type">Role/Account Type</Label>
                  <Input
                    id="role_account_type"
                    value={formData.role_account_type}
                    onChange={(e) => setFormData({ ...formData, role_account_type: e.target.value })}
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="data_class">Data Class</Label>
                  <Select value={formData.data_class} onValueChange={(value) => setFormData({ ...formData, data_class: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                      <SelectItem value="Confidential">Confidential</SelectItem>
                      <SelectItem value="Restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="approval_status">Approval Status</Label>
                  <Select value={formData.approval_status} onValueChange={(value) => setFormData({ ...formData, approval_status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not submitted">Not submitted</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="authorized_by">Authorized By</Label>
                  <Input
                    id="authorized_by"
                    value={formData.authorized_by}
                    onChange={(e) => setFormData({ ...formData, authorized_by: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date_access_created">Date Access Created</Label>
                  <Input
                    id="date_access_created"
                    type="date"
                    value={formData.date_access_created}
                    onChange={(e) => setFormData({ ...formData, date_access_created: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date_access_revoked">Date Access Revoked</Label>
                  <Input
                    id="date_access_revoked"
                    type="date"
                    value={formData.date_access_revoked}
                    onChange={(e) => setFormData({ ...formData, date_access_revoked: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="created_by">Created By</Label>
                  <Input
                    id="created_by"
                    value={formData.created_by}
                    onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedUserId}>
                  Add Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accountInventory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No account items found</p>
          <p className="text-sm">Add your first account item to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Username/Email</TableHead>
                <TableHead>Software</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role/Type</TableHead>
                <TableHead>Data Class</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.full_name}</TableCell>
                  <TableCell>{item.username_email}</TableCell>
                  <TableCell>{item.software || 'Not specified'}</TableCell>
                  <TableCell>{item.department || 'Not specified'}</TableCell>
                  <TableCell>{item.role_account_type || 'Not specified'}</TableCell>
                  <TableCell>{item.data_class || 'Not specified'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(item.status)} text-white`}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AccountInventory;
