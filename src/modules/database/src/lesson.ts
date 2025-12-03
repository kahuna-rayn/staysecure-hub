export interface LessonNode {
  id: string;
  type: 'prompt' | 'question' | 'lesson';
  content: string;
  answers?: LessonAnswer[];
  nextNode?: string; // For prompts without answers
  media?: {
    type: 'video' | 'image' | 'gif';
    url: string;
    alt?: string;
  };
  // New fields for multiple selection support
  allow_multiple?: boolean;
  max_selections?: number;
  min_selections?: number;
  // New field for embedded lesson
  embedded_lesson_id?: string;
}

export interface LessonAnswer {
  id: string;
  text: string;
  nextNodeId: string;
  // New fields for answer scoring (7-point scale, optional)
  score?: number | null; // 0-7 or null for no score
  is_correct?: boolean;
  explanation?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  nodes: LessonNode[];
  startNodeId: string;
  is_module?: boolean;
}

export interface LessonProgress {
  lessonId: string;
  currentNodeId: string;
  completedNodes: string[];
  startedAt: Date;
  lastUpdated: Date;
  completed: boolean;
}

// New interface for embedded lesson state
export interface EmbeddedLessonState {
  lessonId: string;
  currentNodeId: string;
  visitedNodes: string[];
  messageHistory: Array<{ node: LessonNode; selectedAnswer?: LessonAnswer; selectedAnswers?: LessonAnswer[] }>;
  returnToNodeId: string; // The node to return to after completing the embedded lesson
}