import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle } from 'lucide-react';
import { EnhancedTextEditor } from './EnhancedTextEditor';
import { MediaUpload } from './MediaUpload';
import { AnswerManager } from './AnswerManager';
import { LessonNode, LessonAnswer } from '@/types/flowchart';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NodeEditorProps {
  selectedNode: LessonNode | null;
  nodes: LessonNode[];
  nodeAnswers: LessonAnswer[];
  onUpdateNode: (updatedNode: LessonNode) => void;
  onMediaChange: (media: { type: string; url: string; alt: string } | null) => void;
  onAddAnswer: () => void;
  onUpdateAnswer: (answerId: string, updates: Partial<LessonAnswer>) => void;
  onDeleteAnswer: (answerId: string) => void;
}

interface ModuleLesson {
  id: string;
  title: string;
  description: string;
}

export const NodeEditor = ({
  selectedNode,
  nodes,
  nodeAnswers,
  onUpdateNode,
  onMediaChange,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer
}: NodeEditorProps) => {
  const [moduleLessons, setModuleLessons] = useState<ModuleLesson[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Fetch available module lessons
  useEffect(() => {
    const fetchModuleLessons = async () => {
      setLoadingModules(true);
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('id, title, description')
          .eq('is_module', true)
          .eq('status', 'published')
          .order('title');

        if (error) throw error;
        setModuleLessons(data || []);
      } catch (error) {
        console.error('Error fetching module lessons:', error);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModuleLessons();
  }, []);

  if (!selectedNode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Node</CardTitle>
          <CardDescription>
            Choose a node from the list to edit its properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Select a node from the left panel to edit its properties
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Edit Node {nodes.findIndex(n => n.id === selectedNode.id) + 1}
          </CardTitle>
          <CardDescription>
            Configure the selected node with enhanced content options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Node Type */}
            <div className="space-y-2">
              <Label>Node Type</Label>
              <select
                value={selectedNode.type}
                onChange={(e) => {
                  const nodeType = e.target.value as 'prompt' | 'question' | 'lesson';
                  onUpdateNode({ ...selectedNode, type: nodeType });
                }}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="prompt">Prompt (Blue Bubble)</option>
                <option value="question">Question (Yellow Bubble)</option>
                <option value="lesson">Embedded Lesson (Green Bubble)</option>
              </select>
            </div>

            {/* Embedded Lesson Selection (only for lesson type) */}
            {selectedNode.type === 'lesson' && (
              <div className="space-y-2">
                <Label>Select Module Lesson</Label>
                <Select
                  value={selectedNode.embedded_lesson_id || 'none'}
                  onValueChange={(value) =>
                    onUpdateNode({ 
                      ...selectedNode, 
                      embedded_lesson_id: value === 'none' ? undefined : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingModules ? "Loading modules..." : "Select a module lesson"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No module selected</SelectItem>
                    {moduleLessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedNode.embedded_lesson_id && (
                  <p className="text-sm text-muted-foreground">
                    This node will embed the selected lesson. Users will complete the embedded lesson before returning to this flow.
                  </p>
                )}
              </div>
            )}

            {/* Enhanced Content Editor */}
            <EnhancedTextEditor
              label="Content"
              value={selectedNode.content}
              onChange={(content) =>
                onUpdateNode({ ...selectedNode, content })
              }
              placeholder="Enter the node content with emojis and variables..."
              rows={4}
            />

            {/* Next Node Selection (only for prompts) */}
            {selectedNode.type === 'prompt' && (
              <div className="space-y-2">
                <Label>Next Node (for automatic flow)</Label>
                <Select
                  value={selectedNode.next_node_id || 'none'}
                  onValueChange={(value) =>
                    onUpdateNode({ 
                      ...selectedNode, 
                      next_node_id: value === 'none' ? undefined : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select next node" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No automatic flow</SelectItem>
                    {nodes.filter(n => n.id !== selectedNode.id).map((node, nodeIndex) => (
                      <SelectItem key={node.id} value={node.id}>
                        → Node {nodes.findIndex(n2 => n2.id === node.id) + 1} ({node.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Answer Options (only for questions) */}
            {selectedNode.type === 'question' && (
              <AnswerManager
                selectedNode={selectedNode}
                nodes={nodes}
                nodeAnswers={nodeAnswers}
                onAddAnswer={onAddAnswer}
                onUpdateAnswer={onUpdateAnswer}
                onDeleteAnswer={onDeleteAnswer}
                onUpdateNode={(updates) => onUpdateNode({ ...selectedNode, ...updates })}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Upload Panel */}
      <MediaUpload
        mediaType={selectedNode.media_type}
        mediaUrl={selectedNode.media_url}
        mediaAlt={selectedNode.media_alt}
        onMediaChange={onMediaChange}
      />
    </div>
  );
};