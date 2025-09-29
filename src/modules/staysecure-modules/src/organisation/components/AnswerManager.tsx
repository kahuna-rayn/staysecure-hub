import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { LessonNode, LessonAnswer } from '@/types/flowchart';

interface AnswerManagerProps {
  selectedNode: LessonNode;
  nodes: LessonNode[];
  nodeAnswers: LessonAnswer[];
  onAddAnswer: () => void;
  onUpdateAnswer: (answerId: string, updates: Partial<LessonAnswer>) => void;
  onDeleteAnswer: (answerId: string) => void;
  onUpdateNode: (updates: Partial<LessonNode>) => void;
}

export const AnswerManager = ({
  selectedNode,
  nodes,
  nodeAnswers,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
  onUpdateNode
}: AnswerManagerProps) => {
  if (selectedNode.type !== 'question') {
    return null;
  }

  const handleScoreChange = (answerId: string, score: string) => {
    const numScore = parseInt(score) || 0;
    // Ensure score is within 0-7 range
    const clampedScore = Math.max(0, Math.min(7, numScore));
    onUpdateAnswer(answerId, { score: clampedScore });
  };

  const handleCorrectChange = (answerId: string, isCorrect: boolean) => {
    onUpdateAnswer(answerId, { is_correct: isCorrect });
  };

  const handleDeleteAnswer = (answerId: string) => {
    // Delete the answer
    onDeleteAnswer(answerId);
    
    // If multiple selection is enabled, adjust max_selections if needed
    if (selectedNode.allow_multiple && nodeAnswers.length > 1) {
      const remainingAnswers = nodeAnswers.length - 1;
      if (selectedNode.max_selections > remainingAnswers) {
        onUpdateNode({ 
          max_selections: remainingAnswers,
          min_selections: Math.min(remainingAnswers, selectedNode.min_selections || 1)
        });
      }
    }
  };

  const totalPossibleScore = nodeAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0);

  return (
    <div className="space-y-6">
      {/* Multiple Selection Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={selectedNode.allow_multiple || false}
            disabled={nodeAnswers.length === 0}
            onCheckedChange={(checked) => 
              onUpdateNode({ 
                allow_multiple: checked as boolean,
                max_selections: checked ? Math.min(selectedNode.max_selections || 2, nodeAnswers.length) : 1,
                min_selections: checked ? Math.min(selectedNode.min_selections || 1, nodeAnswers.length) : 1
              })
            }
          />
          <Label className={nodeAnswers.length === 0 ? "text-muted-foreground" : ""}>
            Allow Multiple Answers {nodeAnswers.length === 0 && "(add answers first)"}
          </Label>
        </div>
        
        {selectedNode.allow_multiple && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Selections</Label>
              <Input
                type="number"
                min="1"
                max={nodeAnswers.length}
                value={selectedNode.min_selections || 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  const clampedValue = Math.max(1, Math.min(nodeAnswers.length, value));
                  onUpdateNode({ 
                    min_selections: clampedValue,
                    // Ensure max_selections is at least as high as min_selections
                    max_selections: Math.max(clampedValue, selectedNode.max_selections || 1)
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Selections</Label>
              <Input
                type="number"
                min="1"
                max={nodeAnswers.length}
                value={selectedNode.max_selections || 2}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 2;
                  const clampedValue = Math.max(1, Math.min(nodeAnswers.length, value));
                  onUpdateNode({ 
                    max_selections: clampedValue,
                    // Ensure min_selections doesn't exceed max_selections
                    min_selections: Math.min(clampedValue, selectedNode.min_selections || 1)
                  });
                }}
              />
            </div>
            {nodeAnswers.length === 0 && (
              <div className="col-span-2">
                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Add at least one answer option to enable multiple selection
                </p>
              </div>
            )}
            {nodeAnswers.length > 0 && selectedNode.max_selections > nodeAnswers.length && (
              <div className="col-span-2">
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ Maximum selections ({selectedNode.max_selections}) cannot exceed number of answers ({nodeAnswers.length})
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Answer Options</Label>
          <Button size="sm" onClick={onAddAnswer}>
            <Plus className="w-3 h-3 mr-1" />
          </Button>
        </div>
        
                <div className="space-y-4">
          {nodeAnswers.map((answer, index) => (
            <div key={answer.id} className="border rounded-lg p-4 space-y-4">
              {/* Answer Text - Full Width */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Answer Text</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteAnswer(answer.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Textarea
                  value={answer.text}
                  onChange={(e) =>
                    onUpdateAnswer(answer.id, { text: e.target.value })
                  }
                  placeholder={`Answer option ${index + 1}`}
                  rows={2}
                  className="w-full"
                />
              </div>

              {/* Next Node Selection - Full Width */}
              <div className="space-y-2">
                <Label>Next Node</Label>
                <div className="flex gap-2">
                  <Select
                    value={answer.next_node_id || 'none'}
                    onValueChange={(value) =>
                      onUpdateAnswer(answer.id, { next_node_id: value === 'none' ? undefined : value })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select next node" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">End conversation</SelectItem>
                      {nodes.filter(n => n.id !== selectedNode.id).map((node, nodeIndex) => (
                        <SelectItem key={node.id} value={node.id}>
                          → Node {nodes.findIndex(n2 => n2.id === node.id) + 1} ({node.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scoring Section */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Score (0-7, optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="7"
                    value={answer.score || ''}
                    onChange={(e) => handleScoreChange(answer.id, e.target.value)}
                    placeholder="Leave empty for no score"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={answer.is_correct || false}
                      onCheckedChange={(checked) => handleCorrectChange(answer.id, checked as boolean)}
                    />
                    <Label>Correct Answer</Label>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <Label>Explanation (optional)</Label>
                <Textarea
                  value={answer.explanation || ''}
                  onChange={(e) =>
                    onUpdateAnswer(answer.id, { explanation: e.target.value })
                  }
                  placeholder="Explain why this answer is correct or incorrect..."
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

                 {/* Score Summary */}
         {totalPossibleScore > 0 && (
           <div className="mt-4 p-3 bg-blue-50 rounded-lg">
             <div className="text-sm font-medium text-blue-900">
               Total Possible Score: {totalPossibleScore} points (7-point scale)
             </div>
             <div className="text-xs text-blue-700">
               {nodeAnswers.filter(a => a.is_correct).length} correct answer(s) out of {nodeAnswers.length} total
             </div>
             <div className="text-xs text-blue-600 mt-1">
               {nodeAnswers.filter(a => a.score !== undefined && a.score !== null).length} of {nodeAnswers.length} answers have scores
             </div>
           </div>
         )}
      </div>
    </div>
  );
};