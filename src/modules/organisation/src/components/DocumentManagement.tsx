import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Search, Edit, Trash2, Users, Calendar, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@staysecure/auth';

interface Document {
  document_id: string;
  title: string;
  description?: string;
  category?: string;
  required: boolean;
  url?: string;
  file_name?: string;
  file_type?: string;
  version: number;
  due_days: number;
  created_at: string;
  updated_at: string;
}

interface DocumentManagementProps {
  onNavigateToAssignments: () => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onNavigateToAssignments }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (documentData: Omit<Document, 'document_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('documents')
        .insert([documentData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Document created successfully",
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

  const updateDocumentMutation = useMutation({
    mutationFn: async (documentData: Partial<Document> & { document_id: string }) => {
      const { error } = await supabase
        .from('documents')
        .update(documentData)
        .eq('document_id', documentData.document_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingDocument(null);
      toast({
        title: "Success",
        description: "Document updated successfully",
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

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('document_id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
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

  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(documents?.map(doc => doc.category).filter(Boolean)));

  const handleCreateDocument = (formData: FormData) => {
    const documentData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      required: formData.get('required') === 'on',
      url: formData.get('url') as string,
      version: parseInt(formData.get('version') as string) || 1,
      due_days: parseInt(formData.get('due_days') as string) || 30,
    };

    createDocumentMutation.mutate(documentData);
  };

  const handleUpdateDocument = (formData: FormData) => {
    if (!editingDocument) return;

    const documentData = {
      document_id: editingDocument.document_id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      required: formData.get('required') === 'on',
      url: formData.get('url') as string,
      version: parseInt(formData.get('version') as string) || 1,
      due_days: parseInt(formData.get('due_days') as string) || 30,
    };

    updateDocumentMutation.mutate(documentData);
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-muted-foreground">
            Create and manage organizational documents
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
              <DialogDescription>
                Add a new document to the knowledge base
              </DialogDescription>
            </DialogHeader>
            <DocumentForm onSubmit={handleCreateDocument} />
          </DialogContent>
        </Dialog>
      </div>

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
          <Label>Filter by Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category!}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document List */}
      <div className="grid gap-4">
        {filteredDocuments?.map((document) => (
          <Card key={document.document_id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{document.title}</CardTitle>
                    {document.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      v{document.version}
                    </Badge>
                  </div>
                  {document.description && (
                    <CardDescription className="mt-2">
                      {document.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDocument(document)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(document.document_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due in {document.due_days} days
                  </div>
                  {document.category && (
                    <Badge variant="outline" className="text-xs">
                      {document.category}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {document.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={document.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNavigateToAssignments}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingDocument && (
        <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>
                Update document information
              </DialogDescription>
            </DialogHeader>
            <DocumentForm
              initialData={editingDocument}
              onSubmit={handleUpdateDocument}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface DocumentFormProps {
  initialData?: Document;
  onSubmit: (formData: FormData) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ initialData, onSubmit }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initialData?.title}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={initialData?.category}
            placeholder="e.g., Policy, Training"
          />
        </div>
        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            name="version"
            type="number"
            min="1"
            defaultValue={initialData?.version || 1}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="url">Document URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          defaultValue={initialData?.url}
          placeholder="https://example.com/document.pdf"
        />
      </div>

      <div>
        <Label htmlFor="due_days">Due Days</Label>
        <Input
          id="due_days"
          name="due_days"
          type="number"
          min="1"
          defaultValue={initialData?.due_days || 30}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          name="required"
          defaultChecked={initialData?.required}
        />
        <Label htmlFor="required">Required reading</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">
          {initialData ? 'Update' : 'Create'} Document
        </Button>
      </div>
    </form>
  );
};

export default DocumentManagement;