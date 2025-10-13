import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LessonNode, LessonAnswer } from '@/types/flowchart';

export const useLessonDataImproved = (lessonId: string) => {
  const [nodes, setNodes] = useState<LessonNode[]>([]);
  const [answers, setAnswers] = useState<LessonAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Fetch nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('lesson_nodes')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at');

      if (nodesError) throw nodesError;

      // Fetch answers for all nodes
      const nodeIds = nodesData?.map(node => node.id) || [];
      const { data: answersData, error: answersError } = await supabase
        .from('lesson_answers')
        .select('*')
        .in('node_id', nodeIds);

      if (answersError) throw answersError;

      // Transform data
      const transformedNodes = nodesData?.map(node => ({
        ...node,
        type: node.type as 'prompt' | 'question' | 'lesson',
        answers: answersData?.filter(answer => answer.node_id === node.id) || []
      })) || [];

      setNodes(transformedNodes);
      setAnswers(answersData || []);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLessonData = async () => {
    try {
      setSaving(true);
      console.log('Starting improved save operation...');
      
      // Get existing nodes from database
      const { data: existingNodes, error: existingError } = await supabase
        .from('lesson_nodes')
        .select('*')
        .eq('lesson_id', lessonId);

      if (existingError) throw existingError;

      const existingNodeMap = new Map(existingNodes?.map(node => [node.id, node]) || []);
      const currentNodeMap = new Map(nodes.map(node => [node.id, node]));

      // Find nodes to insert, update, or delete
      const nodesToInsert: LessonNode[] = [];
      const nodesToUpdate: LessonNode[] = [];
      const nodesToDelete: string[] = [];

      // Check for nodes to insert or update
      for (const currentNode of nodes) {
        const existingNode = existingNodeMap.get(currentNode.id);
        
        if (!existingNode) {
          // New node - insert
          nodesToInsert.push(currentNode);
        } else {
          // Existing node - check if content changed
          const contentChanged = 
            currentNode.content !== existingNode.content ||
            currentNode.media_alt !== existingNode.media_alt ||
            currentNode.media_url !== existingNode.media_url ||
            currentNode.media_type !== existingNode.media_type ||
            currentNode.next_node_id !== existingNode.next_node_id ||
            currentNode.type !== existingNode.type ||
            currentNode.allow_multiple !== existingNode.allow_multiple ||
            currentNode.max_selections !== existingNode.max_selections ||
            currentNode.min_selections !== existingNode.min_selections;

          if (contentChanged) {
            nodesToUpdate.push(currentNode);
          }
        }
      }

      // Check for nodes to delete
      for (const existingNode of existingNodes || []) {
        if (!currentNodeMap.has(existingNode.id)) {
          nodesToDelete.push(existingNode.id);
        }
      }

      console.log(`Save operation: ${nodesToInsert.length} to insert, ${nodesToUpdate.length} to update, ${nodesToDelete.length} to delete`);

      // Delete nodes that no longer exist
      if (nodesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('lesson_answers')
          .delete()
          .in('node_id', nodesToDelete);

        if (deleteError) throw deleteError;

        const { error: deleteNodesError } = await supabase
          .from('lesson_nodes')
          .delete()
          .in('id', nodesToDelete);

        if (deleteNodesError) throw deleteNodesError;
      }

      // Insert new nodes
      if (nodesToInsert.length > 0) {
        const nodesToInsertData = nodesToInsert.map(node => ({
          id: node.id,
          lesson_id: lessonId,
          type: node.type,
          content: node.content,
          position_x: node.position_x ? Math.round(node.position_x) : null,
          position_y: node.position_y ? Math.round(node.position_y) : null,
          next_node_id: node.next_node_id || null,
          media_type: node.media_type,
          media_url: node.media_url,
          media_alt: node.media_alt,
          embedded_lesson_id: node.embedded_lesson_id || null,
          allow_multiple: node.type === 'question' ? (node.allow_multiple || false) : null,
          max_selections: node.type === 'question' ? (node.max_selections || 1) : null,
          min_selections: node.type === 'question' ? (node.min_selections || 1) : null,
        }));

        const { error: insertError } = await supabase
          .from('lesson_nodes')
          .insert(nodesToInsertData);

        if (insertError) throw insertError;
      }

      // Update changed nodes
      for (const node of nodesToUpdate) {
        const updateData = {
          type: node.type,
          content: node.content,
          position_x: node.position_x ? Math.round(node.position_x) : null,
          position_y: node.position_y ? Math.round(node.position_y) : null,
          next_node_id: node.next_node_id || null,
          media_type: node.media_type,
          media_url: node.media_url,
          media_alt: node.media_alt,
          embedded_lesson_id: node.embedded_lesson_id || null,
          allow_multiple: node.type === 'question' ? (node.allow_multiple || false) : null,
          max_selections: node.type === 'question' ? (node.max_selections || 1) : null,
          min_selections: node.type === 'question' ? (node.min_selections || 1) : null,
        };

        const { error: updateError } = await supabase
          .from('lesson_nodes')
          .update(updateData)
          .eq('id', node.id);

        if (updateError) throw updateError;
      }

      // Handle answers (simplified - delete and reinsert for now)
      const allNodeIds = nodes.map(node => node.id);
      
      // Delete existing answers for all current nodes
      if (allNodeIds.length > 0) {
        const { error: deleteAnswersError } = await supabase
          .from('lesson_answers')
          .delete()
          .in('node_id', allNodeIds);

        if (deleteAnswersError) throw deleteAnswersError;
      }

      // Insert all answers
      const answersToInsert = answers.map(answer => ({
        id: answer.id,
        node_id: answer.node_id,
        text: answer.text,
        next_node_id: answer.next_node_id || null,
        score: answer.score,
        is_correct: answer.is_correct,
        explanation: answer.explanation
      }));

      if (answersToInsert.length > 0) {
        const { error: insertAnswersError } = await supabase
          .from('lesson_answers')
          .insert(answersToInsert);

        if (insertAnswersError) throw insertAnswersError;
      }

      // Update lesson start node - find the visually first node (top-left position)
      if (nodes.length > 0) {
        // Sort nodes by position: first by Y (top to bottom), then by X (left to right)
        const sortedNodes = [...nodes].sort((a, b) => {
          const aY = a.position_y || 0;
          const bY = b.position_y || 0;
          if (Math.abs(aY - bY) < 50) { // If Y positions are close, sort by X
            const aX = a.position_x || 0;
            const bX = b.position_x || 0;
            return aX - bX;
          }
          return aY - bY;
        });
        
        const startNodeId = sortedNodes[0].id;
        console.log(`Setting start node to: ${startNodeId} (${sortedNodes[0].content})`);
        
        const { error: lessonError } = await supabase
          .from('lessons')
          .update({ start_node_id: startNodeId })
          .eq('id', lessonId);

        if (lessonError) throw lessonError;
      }

      console.log('Save operation completed successfully');
      return true;
    } catch (error) {
      console.error('Error saving lesson data:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  return {
    nodes,
    setNodes,
    answers,
    setAnswers,
    loading,
    saving,
    saveLessonData,
    refresh: fetchLessonData
  };
};
