import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  ConnectionMode,
  MarkerType,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowchartNode } from './FlowchartNode';
import { FlowchartContent } from './FlowchartContent';
import { FlowchartEditorProps, LessonNode } from '@/types/flowchart';

const nodeTypes: NodeTypes = {
  flowchartNode: FlowchartNode,
};

export const FlowchartEditor = ({
  nodes: lessonNodes,
  answers,
  lessonId,
  onNodeUpdate,
  onNodePositionChange,
  onCreateNode,
  onDeleteNode,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
  onMediaChange,
}: FlowchartEditorProps) => {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Convert lesson nodes to flow nodes with hierarchical layout
  useEffect(() => {
    // Calculate node levels based on the flow structure
    const calculateNodeLevels = () => {
      const levels = new Map<string, number>();
      const visited = new Set<string>();
      
      // Find start nodes (nodes with no incoming connections)
      const allTargetIds = new Set([
        ...answers.map(a => a.next_node_id).filter(Boolean),
        ...lessonNodes.filter(n => n.next_node_id).map(n => n.next_node_id)
      ]);
      
      const startNodes = lessonNodes.filter(node => !allTargetIds.has(node.id));
      
      // BFS to assign levels
      const queue: { nodeId: string; level: number }[] = startNodes.map(node => ({ nodeId: node.id, level: 0 }));
      
      while (queue.length > 0) {
        const { nodeId, level } = queue.shift()!;
        
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        levels.set(nodeId, level);
        
        // Find all nodes this node connects to
        const nextNodes = [
          ...answers.filter(a => a.node_id === nodeId && a.next_node_id).map(a => a.next_node_id!),
          ...lessonNodes.filter(n => n.id === nodeId && n.next_node_id).map(n => n.next_node_id!)
        ];
        
        nextNodes.forEach(nextNodeId => {
          if (!visited.has(nextNodeId)) {
            queue.push({ nodeId: nextNodeId, level: level + 1 });
          }
        });
      }
      
      return levels;
    };
    
    const nodeLevels = calculateNodeLevels();
    
    // Group nodes by level
    const nodesByLevel = new Map<number, string[]>();
    lessonNodes.forEach(node => {
      const level = nodeLevels.get(node.id) ?? 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node.id);
    });
    
    const convertedNodes: Node[] = lessonNodes.map((node, index) => {
      const level = nodeLevels.get(node.id) ?? 0;
      const nodesAtLevel = nodesByLevel.get(level) ?? [];
      const nodeIndex = nodesAtLevel.indexOf(node.id);
      const totalNodesAtLevel = nodesAtLevel.length;
      
      // Center nodes horizontally at each level
      const baseX = 400; // Center position
      const horizontalSpacing = 300;
      const startX = baseX - ((totalNodesAtLevel - 1) * horizontalSpacing) / 2;
      
      return {
        id: node.id,
        type: 'flowchartNode',
        position: { 
          // Use stored position if available, otherwise use hierarchical layout
          x: node.position_x ?? (startX + nodeIndex * horizontalSpacing),
          y: node.position_y ?? (level * 250) // Vertical spacing between levels
        },
        data: {
          ...node,
          nodeNumber: index + 1, // Add node number (1-based index)
          isSelected: node.id === selectedNodeId,
          onClick: () => setSelectedNodeId(node.id),
        },
      };
    });

    setFlowNodes(convertedNodes);
  }, [lessonNodes, answers, selectedNodeId, setFlowNodes]);

  // Convert answers and prompt connections to edges
  useEffect(() => {
    const answerEdges: Edge[] = answers
      .filter(answer => {
        const hasNextNode = answer.next_node_id;
        const targetExists = lessonNodes.some(node => node.id === answer.next_node_id);
        const sourceExists = lessonNodes.some(node => node.id === answer.node_id);
        
        return hasNextNode && targetExists && sourceExists;
      })
      .map(answer => ({
        id: `edge-${answer.id}`,
        source: answer.node_id,
        target: answer.next_node_id!,
        sourceHandle: 'source',
        targetHandle: 'target',
        label: answer.text,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--learning-accent))', strokeWidth: 2 },
        labelStyle: { fontSize: 12, fontWeight: 500 },
        labelBgStyle: { fill: 'hsl(var(--learning-surface))', fillOpacity: 0.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--learning-accent))',
        },
      }));

    const promptEdges: Edge[] = lessonNodes
      .filter(node => node.type === 'prompt' && node.next_node_id)
      .filter(node => lessonNodes.some(targetNode => targetNode.id === node.next_node_id))
      .map(node => ({
        id: `prompt-edge-${node.id}`,
        source: node.id,
        target: node.next_node_id!,
        sourceHandle: 'source',
        targetHandle: 'target',
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--learning-primary))', strokeWidth: 2 },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--learning-primary))',
        },
      }));

    const lessonEdges: Edge[] = lessonNodes
      .filter(node => node.type === 'lesson' && node.next_node_id)
      .filter(node => lessonNodes.some(targetNode => targetNode.id === node.next_node_id))
      .map(node => ({
        id: `lesson-edge-${node.id}`,
        source: node.id,
        target: node.next_node_id!,
        sourceHandle: 'source',
        targetHandle: 'target',
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--learning-accent))', strokeWidth: 2 },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--learning-accent))',
        },
      }));

    const allEdges = [...answerEdges, ...promptEdges, ...lessonEdges];
    setEdges(allEdges);
  }, [answers, lessonNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const sourceNode = lessonNodes.find(node => node.id === params.source);
      if (!sourceNode) return;
      
      if (sourceNode.type === 'prompt' || sourceNode.type === 'lesson') {
        // For prompt and lesson nodes, update the next_node_id directly
        onNodeUpdate({ ...sourceNode, next_node_id: params.target });
      } else if (sourceNode.type === 'question') {
        // For question nodes, first add a new answer, then update it
        onAddAnswer(params.source);
        // The answer will be created with a default ID, we need to update it after creation
        setTimeout(() => {
          // Find the most recently created answer for this node
          const nodeAnswers = answers.filter(a => a.node_id === params.source);
          const latestAnswer = nodeAnswers[nodeAnswers.length - 1];
          if (latestAnswer) {
            onUpdateAnswer(latestAnswer.id, { 
              text: 'New connection',
              next_node_id: params.target 
            });
          }
        }, 100);
      }
    },
    [lessonNodes, onNodeUpdate, onAddAnswer, onUpdateAnswer, answers]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodePositionChange(node.id, node.position);
    },
    [onNodePositionChange]
  );

  // Create a ref to store the ReactFlow instance for position calculations
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    if (!reactFlowInstance) return;
    
    // Use screen coordinates directly - screenToFlowPosition handles the conversion
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    onCreateNode(position);
  }, [reactFlowInstance, onCreateNode]);

  return (
    <div className="w-full h-[800px] relative">
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={handlePaneClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        className="bg-learning-background border border-learning-border rounded-lg"
      >
        <FlowchartContent
          lessonNodes={lessonNodes}
          answers={answers}
          lessonId={lessonId}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          onNodeUpdate={onNodeUpdate}
          onNodePositionChange={onNodePositionChange}
          onCreateNode={onCreateNode}
          onDeleteNode={onDeleteNode}
          onAddAnswer={onAddAnswer}
          onUpdateAnswer={onUpdateAnswer}
          onDeleteAnswer={onDeleteAnswer}
          onMediaChange={onMediaChange}
        />
      </ReactFlow>
    </div>
  );
};