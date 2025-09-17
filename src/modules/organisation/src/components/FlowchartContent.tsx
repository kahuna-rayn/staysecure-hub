import React, { useState, useCallback, useEffect } from 'react';
import {
  Node,
  Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react';
import { NodeEditorPanel } from './NodeEditorPanel';
import { LessonNode, LessonAnswer } from '@/types/flowchart';

interface FlowchartContentProps {
  lessonNodes: LessonNode[];
  answers: LessonAnswer[];
  lessonId: string; // Add lesson ID to prevent self-referencing
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  onNodeUpdate: (updatedNode: LessonNode) => void;
  onNodePositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onCreateNode: (position: { x: number; y: number }) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddAnswer: (nodeId: string) => void;
  onUpdateAnswer: (answerId: string, updates: Partial<LessonAnswer>) => void;
  onDeleteAnswer: (answerId: string) => void;
  onMediaChange: (nodeId: string, media: { type: string; url: string; alt: string } | null) => void;
}

export const FlowchartContent = ({
  lessonNodes,
  answers,
  lessonId,
  selectedNodeId,
  setSelectedNodeId,
  onNodeUpdate,
  onNodePositionChange,
  onCreateNode,
  onDeleteNode,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
  onMediaChange,
}: FlowchartContentProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const selectedNode = lessonNodes.find(node => node.id === selectedNodeId);
  const nodeAnswers = answers.filter(answer => answer.node_id === selectedNodeId);

  // Open editor when node is selected
  useEffect(() => {
    if (selectedNodeId) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [selectedNodeId]);


  const handleUpdateNode = (updates: Partial<LessonNode>) => {
    if (!selectedNode) return;
    onNodeUpdate({ ...selectedNode, ...updates });
  };

  const handleMediaChange = (media: { type: string; url: string; alt: string } | null) => {
    if (!selectedNodeId) return;
    onMediaChange(selectedNodeId, media);
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    onDeleteNode(selectedNodeId);
    setSelectedNodeId(null);
    setIsEditing(false);
  };

  return (
    <>
      <Background />
      <Controls />
      <MiniMap 
        nodeStrokeColor={(n) => n.data.type === 'question' ? '#F59E0B' : '#3B82F6'}
        nodeColor={(n) => n.data.type === 'question' ? '#FEF3C7' : '#DBEAFE'}
      />
      
      <Panel position="top-left">
        <div className="bg-learning-surface p-3 rounded-lg border border-learning-border shadow-sm">
          <p className="text-sm font-medium text-learning-primary mb-2">Quick Actions</p>
          <p className="text-xs text-muted-foreground">Click on empty space to create a node</p>
          <p className="text-xs text-muted-foreground">Click on a node to edit it</p>
          <p className="text-xs text-muted-foreground">Drag from node handles to connect them</p>
        </div>
      </Panel>

      {/* Node Editor Panel */}
      {isEditing && selectedNode && (
        <NodeEditorPanel
          selectedNode={selectedNode}
          lessonNodes={lessonNodes}
          nodeAnswers={nodeAnswers}
          lessonId={lessonId}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onClose={() => setIsEditing(false)}
          onAddAnswer={() => onAddAnswer(selectedNode.id)}
          onUpdateAnswer={onUpdateAnswer}
          onDeleteAnswer={onDeleteAnswer}
          onMediaChange={handleMediaChange}
        />
      )}
    </>
  );
};