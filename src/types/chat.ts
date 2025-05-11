import type { AnswerRegQQuestionOutput } from '@/ai/flows/answer-regq-question';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  text?: string; // For user messages
  response?: AnswerRegQQuestionOutput; // For bot messages, now includes calculationExamples
  suggestions?: string[]; // For bot messages offering suggestions
  timestamp: Date;
}
