import type { AnswerRegQQuestionOutput } from '@/ai/flows/answer-regq-question';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  text?: string; // For user messages
  response?: AnswerRegQQuestionOutput; // For bot messages, now includes calculationExamples
  suggestions?: string[]; // For bot messages offering suggestions
  timestamp: Date;
  isEditing?: boolean; // Added for StructuredResponse state management
  isEditedByUser?: boolean; // To indicate if the user has edited the bot's response
}

export interface ChatSession {
  id: string;
  startTime: Date;
  messages: ChatMessage[];
  summary?: string; // Added for AI-generated session summary
}
