import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowchartNode } from './FlowchartNode';
import { LessonNode, LessonAnswer } from '@/types/flowchart';

interface FlowchartCanvasProps {
  nodes: LessonNode[];
  answers: LessonAnswer[];
  onNodeSelect: (node: LessonNode) => void;
  onNodePositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  selectedNodeId?: string;
}

const nodeTypes: NodeTypes = {
  flowchartNode: FlowchartNode,
};

export const FlowchartCanvas = ({
  nodes: lessonNodes,
  answers,
  onNodeSelect,
  onNodePositionChange,
  selectedNodeId,
}: FlowchartCanvasProps) => {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
    
    const convertedNodes: Node[] = lessonNodes.map((node) => {
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
          isSelected: node.id === selectedNodeId,
          onClick: () => onNodeSelect(node),
        },
      };
    });

    setFlowNodes(convertedNodes);
  }, [lessonNodes, answers, selectedNodeId, setFlowNodes, onNodeSelect]);

  // Convert answers and prompt connections to edges
  useEffect(() => {
    // Create edges from answers (question nodes to next nodes)
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
        label: answer.text,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--learning-accent))' },
        labelStyle: { fontSize: 12, fontWeight: 500 },
        labelBgStyle: { fill: 'hsl(var(--learning-surface))', fillOpacity: 0.8 },
      }));

    // Create edges from prompt nodes (direct node-to-node connections)
    const promptEdges: Edge[] = lessonNodes
      .filter(node => node.type === 'prompt' && node.next_node_id)
      .filter(node => lessonNodes.some(targetNode => targetNode.id === node.next_node_id))
      .map(node => ({
        id: `prompt-edge-${node.id}`,
        source: node.id,
        target: node.next_node_id!,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--learning-primary))' },
        animated: true,
      }));

    const allEdges = [...answerEdges, ...promptEdges];
    setEdges(allEdges);
  }, [answers, lessonNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodePositionChange(node.id, node.position);
    },
    [onNodePositionChange]
  );

  return (
    <div className="w-full h-[600px] border border-learning-border rounded-lg overflow-hidden bg-learning-background">
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeStrokeColor={(n) => n.data.type === 'question' ? '#F59E0B' : '#3B82F6'}
          nodeColor={(n) => n.data.type === 'question' ? '#FEF3C7' : '#DBEAFE'}
        />
      </ReactFlow>
    </div>
  );
};