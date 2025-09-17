import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageCircle, HelpCircle, Trash2 } from 'lucide-react';
import { LessonNode } from '@/types/flowchart';

interface NodeListProps {
  nodes: LessonNode[];
  selectedNode: LessonNode | null;
  onNodeSelect: (node: LessonNode) => void;
  onCreateNode: () => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeList = ({ 
  nodes, 
  selectedNode, 
  onNodeSelect, 
  onCreateNode, 
  onDeleteNode 
}: NodeListProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Decision Tree Nodes</CardTitle>
          <Button size="sm" onClick={onCreateNode}>
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
        </div>
        <CardDescription>
          Create prompts (blue) and questions (yellow) with enhanced content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedNode?.id === node.id 
                  ? 'border-learning-accent bg-learning-accent/5' 
                  : 'border-learning-border hover:border-learning-accent/50'
              }`}
              onClick={() => onNodeSelect(node)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {node.type === 'prompt' ? (
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="font-medium">Node {index + 1}</span>
                  <Badge variant={node.type === 'prompt' ? 'default' : 'secondary'}>
                    {node.type}
                  </Badge>
                  {node.media_url && (
                    <Badge variant="outline" className="text-xs">
                      📎 Media
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNode(node.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {node.content || 'Empty node'}
              </p>
            </div>
          ))}
          
          {nodes.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No nodes created yet</p>
              <Button size="sm" className="mt-2" onClick={onCreateNode}>
                Create First Node
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};