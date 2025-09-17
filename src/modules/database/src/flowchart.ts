export interface LessonNode {
  id: string;
  type: 'prompt' | 'question' | 'lesson';
  content: string;
  position_x?: number;
  position_y?: number;
  next_node_id?: string;
  media_type?: string;
  media_url?: string;
  media_alt?: string;
  // New fields for multiple selection support
  allow_multiple?: boolean;
  max_selections?: number;
  min_selections?: number;
  // New field for embedded lesson
  embedded_lesson_id?: string;
}

export interface LessonAnswer {
  id: string;
  node_id: string;
  text: string;
  next_node_id?: string;
  score?: number | null;
  is_correct?: boolean;
  explanation?: string;
}

// New interfaces for behavior tracking
export interface UserAnswerResponse {
  id: string;
  user_id: string;
  lesson_id: string;
  node_id: string;
  answer_ids: string[];
  scores: number[];
  total_score: number;
  response_time_ms?: number;
  created_at: string;
}

export interface UserBehaviorAnalytics {
  id: string;
  user_id: string;
  lesson_id: string;
  session_id: string;
  total_time_spent: number;
  nodes_visited: string[];
  completion_path: string[];
  retry_count: number;
  completed_at: string;
  created_at: string;
}

// Enhanced interface for lesson session tracking
export interface LessonSession {
  session_id: string;
  lesson_id: string;
  user_id: string;
  start_time: number;
  current_node_id: string;
  visited_nodes: string[];
  selected_answers: Map<string, string[]>; // node_id -> answer_ids[]
  session_data: {
    total_time_spent: number;
    response_times: Map<string, number>; // node_id -> response_time_ms
  };
}

export interface FlowchartEditorProps {
  nodes: LessonNode[];
  answers: LessonAnswer[];
  lessonId: string; // Add lesson ID to prevent self-referencing in embedded lessons
  onNodeUpdate: (node: LessonNode) => void;
  onNodePositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onCreateNode: (position: { x: number; y: number }) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddAnswer: (nodeId: string) => void;
  onUpdateAnswer: (answerId: string, updates: Partial<LessonAnswer>) => void;
  onDeleteAnswer: (answerId: string) => void;
  onMediaChange: (nodeId: string, media: { type: string; url: string; alt: string } | null) => void;
  onUpdateNode: (updatedNode: LessonNode) => void;
}