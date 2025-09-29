import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';
import { EnhancedTextEditor } from './EnhancedTextEditor';
import { MediaUpload } from './MediaUpload';
import { AnswerManager } from './AnswerManager';
import { LessonNode, LessonAnswer } from '@/types/flowchart';
import { supabase } from '@/integrations/supabase/client';

interface NodeEditorPanelProps {
  selectedNode: LessonNode;
  lessonNodes: LessonNode[];
  nodeAnswers: LessonAnswer[];
  lessonId: string; // Add lesson ID to prevent self-referencing
  onUpdateNode: (updates: Partial<LessonNode>) => void;
  onDeleteNode: () => void;
  onClose: () => void;
  onAddAnswer: () => void;
  onUpdateAnswer: (answerId: string, updates: Partial<LessonAnswer>) => void;
  onDeleteAnswer: (answerId: string) => void;
  onMediaChange: (media: { type: string; url: string; alt: string } | null) => void;
}

  interface ModuleLesson {
    id: string;
    title: string;
    description: string;
    status: string;
  }

export const NodeEditorPanel = ({
  selectedNode,
  lessonNodes,
  nodeAnswers,
  lessonId,
  onUpdateNode,
  onDeleteNode,
  onClose,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
  onMediaChange,
}: NodeEditorPanelProps) => {
  const [moduleLessons, setModuleLessons] = useState<ModuleLesson[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Fetch available module lessons
  useEffect(() => {
    const fetchModuleLessons = async () => {
      setLoadingModules(true);
      try {
        console.log('Fetching module lessons...');
        const { data, error } = await supabase
          .from('lessons')
          .select('id, title, description, is_module, status')
          .eq('is_module', true)
          .neq('id', lessonId) // Exclude the current lesson to prevent infinite loops
          .order('title');

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Module lessons fetched:', data);
        setModuleLessons(data || []);
      } catch (error) {
        console.error('Error fetching module lessons:', error);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModuleLessons();
  }, []);

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-learning-surface border-l border-learning-border overflow-y-auto z-50">
      <Card className="border-0 rounded-none h-full">
        <CardHeader className="border-b border-learning-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Edit Node {lessonNodes.findIndex(n => n.id === selectedNode.id) + 1}
              </CardTitle>
              <CardDescription>
                Configure node properties and connections
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onDeleteNode}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-4">
          {/* Node Type */}
          <div className="space-y-2">
            <Label>Node Type</Label>
            <Select
              value={selectedNode.type}
              onValueChange={(value: 'prompt' | 'question' | 'lesson') =>
                onUpdateNode({ type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prompt">Prompt (Blue Bubble)</SelectItem>
                <SelectItem value="question">Question (Yellow Bubble)</SelectItem>
                <SelectItem value="lesson">Embedded Lesson (Green Bubble)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Embedded Lesson Selection (only for lesson type) */}
          {selectedNode.type === 'lesson' && (
            <div className="space-y-2">
              <Label>Select Module Lesson</Label>
              <Select
                value={selectedNode.embedded_lesson_id || 'none'}
                onValueChange={(value) =>
                  onUpdateNode({ 
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
                      {lesson.title} ({lesson.status})
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
            onChange={(content) => onUpdateNode({ content })}
            placeholder="Enter the node content with emojis and variables..."
            rows={4}
          />

          {/* Next Node Selection (for prompts and lessons) */}
          {(selectedNode.type === 'prompt' || selectedNode.type === 'lesson') && (
            <div className="space-y-2">
              <Label>Next Node (for automatic flow)</Label>
              <Select
                value={selectedNode.next_node_id || 'none'}
                onValueChange={(value) =>
                  onUpdateNode({ 
                    next_node_id: value === 'none' ? undefined : value 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select next node" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No automatic flow</SelectItem>
                  {lessonNodes.filter(n => n.id !== selectedNode.id).map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      → Node {lessonNodes.findIndex(n2 => n2.id === node.id) + 1} ({node.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedNode.type === 'lesson' && (
                <p className="text-sm text-muted-foreground">
                  This node will continue to the selected node after the embedded lesson is completed.
                </p>
              )}
            </div>
          )}

          {/* Answer Options (only for questions) */}
          {selectedNode.type === 'question' && (
            <AnswerManager
              selectedNode={selectedNode}
              nodes={lessonNodes}
              nodeAnswers={nodeAnswers}
              onAddAnswer={onAddAnswer}
              onUpdateAnswer={onUpdateAnswer}
              onDeleteAnswer={onDeleteAnswer}
              onUpdateNode={onUpdateNode}
            />
          )}

          {/* Media Upload */}
          <div className="border-t pt-4">
            <MediaUpload
              mediaType={selectedNode.media_type}
              mediaUrl={selectedNode.media_url}
              mediaAlt={selectedNode.media_alt}
              onMediaChange={onMediaChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};