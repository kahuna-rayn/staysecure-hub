import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FlowchartEditor } from './FlowchartEditor';
import { useLessonDataImproved } from '@/hooks/useLessonDataImproved';
import { LessonNode, LessonAnswer } from '@/types/flowchart';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface DecisionTreeBuilderProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
  onClose: () => void;
}

export const DecisionTreeBuilder = ({ lessonId, lessonTitle, onBack, onClose }: DecisionTreeBuilderProps) => {
  const { nodes, setNodes, answers, setAnswers, loading, saveLessonData } = useLessonDataImproved(lessonId);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const { toast } = useToast();



  const handleUpdateNode = (updatedNode: LessonNode) => {
    setNodes(nodes.map(node => node.id === updatedNode.id ? updatedNode : node));
  };

  const handleNodePositionChange = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(nodes.map(node => 
      node.id === nodeId 
        ? { ...node, position_x: position.x, position_y: position.y }
        : node
    ));
  };


  const handleDeleteNode = (nodeId: string) => {
    setNodeToDelete(nodeId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteNode = () => {
    if (!nodeToDelete) return;
    
    setNodes(nodes.filter(node => node.id !== nodeToDelete));
    setAnswers(answers.filter(answer => answer.node_id !== nodeToDelete));
    
    setNodeToDelete(null);
  };


  const handleUpdateAnswer = (answerId: string, updates: Partial<LessonAnswer>) => {
    setAnswers(answers.map(answer => 
      answer.id === answerId ? { ...answer, ...updates } : answer
    ));
  };

  const handleDeleteAnswer = (answerId: string) => {
    setAnswers(answers.filter(answer => answer.id !== answerId));
  };

  const handleSaveLesson = async () => {
    setSaving(true);
    const success = await saveLessonData();
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-learning-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lesson builder...</p>
        </div>
      </div>
    );
  }

  const handleCreateNodeAtPosition = (position: { x: number; y: number }) => {
    const newNode: LessonNode = {
      id: `node_${Date.now()}`,
      type: 'prompt',
      content: 'New node content...',
      position_x: position.x,
      position_y: position.y,
    };
    setNodes([...nodes, newNode]);
  };

  const handleMediaChangeForNode = (nodeId: string, media: { type: string; url: string; alt: string } | null) => {
    setNodes(nodes.map(node => 
      node.id === nodeId 
        ? {
            ...node,
            media_type: media?.type,
            media_url: media?.url,
            media_alt: media?.alt,
          }
        : node
    ));
  };

  const handleAddAnswerForNode = (nodeId: string) => {
    const newAnswer: LessonAnswer = {
      id: `answer_${Date.now()}`,
      node_id: nodeId,
      text: 'New answer option...'
    };
    setAnswers([...answers, newAnswer]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-learning-primary">{lessonTitle}</h2>
            <p className="text-muted-foreground">Step 2: Visual Decision Tree Builder</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveLesson} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Lesson'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <FlowchartEditor
        nodes={nodes}
        answers={answers}
        lessonId={lessonId}
        onUpdateNode={handleUpdateNode}
        onNodeUpdate={handleUpdateNode}
        onNodePositionChange={handleNodePositionChange}
        onCreateNode={handleCreateNodeAtPosition}
        onDeleteNode={handleDeleteNode}
        onAddAnswer={handleAddAnswerForNode}
        onUpdateAnswer={handleUpdateAnswer}
        onDeleteAnswer={handleDeleteAnswer}
        onMediaChange={handleMediaChangeForNode}
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Node"
        description="Are you sure you want to delete this node? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteNode}
        variant="destructive"
      />
    </div>
  );
};