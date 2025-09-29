import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Plus, Edit, Save } from 'lucide-react';

// Mock data since email_templates table is not in the generated types  
interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject_template: string;
  html_body_template: string;
  text_body_template?: string;
  is_active: boolean;
  variables: string[];
}

const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome Email',
    type: 'welcome',
    subject_template: 'Welcome to {{organization_name}}!',
    html_body_template: '<h1>Welcome {{user_name}}</h1><p>We are excited to have you join {{organization_name}}.</p>',
    text_body_template: 'Welcome {{user_name}}! We are excited to have you join {{organization_name}}.',
    is_active: true,
    variables: ['user_name', 'organization_name']
  },
  {
    id: '2',
    name: 'Document Assignment',
    type: 'document_assignment',
    subject_template: 'New Document Assignment: {{document_title}}',
    html_body_template: '<h2>New Document Assignment</h2><p>You have been assigned: {{document_title}}</p><p>Due Date: {{due_date}}</p>',
    text_body_template: 'New Document Assignment: {{document_title}}. Due Date: {{due_date}}',
    is_active: true,
    variables: ['document_title', 'due_date']
  }
];

const EmailTemplateEditor: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate({ ...template });
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;

    setTemplates(prev => 
      prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t)
    );
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      type: 'custom',
      subject_template: '',
      html_body_template: '',
      text_body_template: '',
      is_active: true,
      variables: []
    };
    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-learning-primary flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Template Editor
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage email templates for notifications and communications (Demo)
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Select a template to edit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-learning-primary bg-learning-primary/5'
                    : 'border-learning-border hover:border-learning-primary/50'
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.type}</p>
                  </div>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Template Editor */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isEditing ? 'Editing' : 'Viewing'}: {selectedTemplate.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {isEditing && (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate(prev => prev ? {...prev, name: e.target.value} : null)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={selectedTemplate.type}
                      onValueChange={(value) => setSelectedTemplate(prev => prev ? {...prev, type: value} : null)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="document_assignment">Document Assignment</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject Template</Label>
                  <Input
                    id="subject"
                    value={selectedTemplate.subject_template}
                    onChange={(e) => setSelectedTemplate(prev => prev ? {...prev, subject_template: e.target.value} : null)}
                    disabled={!isEditing}
                    placeholder="Use {{variable_name}} for dynamic content"
                  />
                </div>

                <div>
                  <Label htmlFor="html_body">HTML Body Template</Label>
                  <Textarea
                    id="html_body"
                    value={selectedTemplate.html_body_template}
                    onChange={(e) => setSelectedTemplate(prev => prev ? {...prev, html_body_template: e.target.value} : null)}
                    disabled={!isEditing}
                    rows={8}
                    placeholder="HTML content with {{variable_name}} placeholders"
                  />
                </div>

                <div>
                  <Label>Available Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variables.map((variable, index) => (
                      <Badge key={index} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a template to edit</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;