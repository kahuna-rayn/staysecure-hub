import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Save, X, Variable } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

interface TemplateVariable {
  id: string;
  key: string;
  category: string;
  display_name: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  default_value?: string;
}

interface VariableTranslation {
  id: string;
  variable_id: string;
  language_code: string;
  display_name: string;
  default_value: string;
}

export const VariableManagement = () => {
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newVariable, setNewVariable] = useState({
    key: '',
    category: '',
    display_name: '',
    default_value: ''
  });
  const { toast } = useToast();
  const { role } = useUserRole();
  
  const isSuperAdmin = role === 'super_admin';
  const canEdit = role === 'super_admin' || role === 'client_admin';

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      // First get the variables
      const { data: variablesData, error: variablesError } = await supabase
        .from('template_variables')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (variablesError) throw variablesError;

      // Then get the translations separately to avoid join issues
      const { data: translationsData, error: translationsError } = await supabase
        .from('template_variable_translations')
        .select('variable_id, default_value')
        .eq('language_code', 'en');

      if (translationsError) throw translationsError;

      // Map translations by variable_id for easy lookup
      const translationsMap = new Map();
      translationsData?.forEach(translation => {
        translationsMap.set(translation.variable_id, translation.default_value);
      });

      const mappedVariables = variablesData?.map(variable => ({
        ...variable,
        default_value: translationsMap.get(variable.id) || ''
      })) || [];

      setVariables(mappedVariables);
    } catch (error) {
      console.error('Error fetching variables:', error);
      toast({
        title: "Error",
        description: "Failed to load variables",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariable = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // Insert variable
      const { data: variableData, error: variableError } = await supabase
        .from('template_variables')
        .insert({
          key: newVariable.key,
          category: newVariable.category,
          display_name: newVariable.display_name,
          is_system: false,
          is_active: true
        })
        .select()
        .single();

      if (variableError) throw variableError;

      // Insert translation
      const { error: translationError } = await supabase
        .from('template_variable_translations')
        .insert({
          variable_id: variableData.id,
          language_code: 'en',
          display_name: newVariable.display_name,
          default_value: newVariable.default_value
        });

      if (translationError) throw translationError;

      toast({
        title: "Success",
        description: "Variable created successfully"
      });

      setIsDialogOpen(false);
      setNewVariable({ key: '', category: '', display_name: '', default_value: '' });
      fetchVariables();
    } catch (error) {
      console.error('Error creating variable:', error);
      toast({
        title: "Error",
        description: "Failed to create variable",
        variant: "destructive"
      });
    }
  };

  const handleUpdateDefaultValue = async (variable: TemplateVariable, newValue: string) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('template_variable_translations')
        .update({ default_value: newValue })
        .eq('variable_id', variable.id)
        .eq('language_code', 'en');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variable updated successfully"
      });

      fetchVariables();
      setEditingVariable(null);
    } catch (error) {
      console.error('Error updating variable:', error);
      toast({
        title: "Error",
        description: "Failed to update variable",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVariable = async (variable: TemplateVariable) => {
    if (!isSuperAdmin || variable.is_system) return;

    try {
      const { error } = await supabase
        .from('template_variables')
        .delete()
        .eq('id', variable.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variable deleted successfully"
      });

      fetchVariables();
    } catch (error) {
      console.error('Error deleting variable:', error);
      toast({
        title: "Error",
        description: "Failed to delete variable",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Organization': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'User': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'IT': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Key Personnel': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'System': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading variables...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Variables</h2>
          <p className="text-muted-foreground">
            Manage dynamic variables for lessons and email templates
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Variable
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Variable</DialogTitle>
                <DialogDescription>
                  Add a new template variable that can be used in lessons and emails.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key">Variable Key</Label>
                  <Input
                    id="key"
                    placeholder="e.g., company_phone"
                    value={newVariable.key}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, key: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Contact Information"
                    value={newVariable.category}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    placeholder="e.g., Company Phone Number"
                    value={newVariable.display_name}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, display_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="default_value">Default Value</Label>
                  <Textarea
                    id="default_value"
                    placeholder="e.g., +1-800-COMPANY"
                    value={newVariable.default_value}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, default_value: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVariable}>Create Variable</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Variable className="w-5 h-5" />
            Variables
          </CardTitle>
          <CardDescription>
            {isSuperAdmin 
              ? "Create, edit, and manage all template variables"
              : "Edit default values for existing variables"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Default Value</TableHead>
                <TableHead>Type</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map((variable) => (
                <TableRow key={variable.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{variable.display_name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {`{{${variable.key}}}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCategoryColor(variable.category)}>
                      {variable.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingVariable?.id === variable.id ? (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={editingVariable.default_value || ''}
                          onChange={(e) => setEditingVariable(prev => 
                            prev ? { ...prev, default_value: e.target.value } : null
                          )}
                          className="min-h-[60px]"
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateDefaultValue(variable, editingVariable.default_value || '')}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingVariable(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-xs">
                        <div className="text-sm break-words">
                          {variable.default_value || 'No default value'}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variable.is_system ? "secondary" : "default"}>
                      {variable.is_system ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingVariable?.id !== variable.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingVariable(variable)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {isSuperAdmin && !variable.is_system && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this variable?')) {
                                handleDeleteVariable(variable);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};