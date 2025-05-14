"use client";

import type { ChatMessage as ChatMessageType } from '@/types/chat';
import type { AnswerRegQQuestionOutput } from '@/ai/flows/answer-regq-question';
import StructuredResponse from './StructuredResponse';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bot, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ChatMessageProps {
  message: ChatMessageType;
  onSaveResponse?: (messageId: string, editedResponse: AnswerRegQQuestionOutput) => Promise<void>;
  isSavingResponse?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  isHistoryView?: boolean; // New prop
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onSaveResponse, 
  isSavingResponse, 
  onSuggestionClick,
  isHistoryView = false // Default to false
}) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex gap-2.5 my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 self-start mt-1 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser && message.text && (
          <Card className="bg-primary text-primary-foreground rounded-xl shadow-md">
            <CardContent className="p-2.5">
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </CardContent>
          </Card>
        )}
        {!isUser && message.response && (
          <StructuredResponse 
            response={message.response} 
            onSave={!isHistoryView && onSaveResponse ? (editedResponse) => onSaveResponse(message.id, editedResponse) : undefined}
            isSaving={isSavingResponse}
            isHistoryView={isHistoryView} // Pass down
          />
        )}
        {!isUser && message.suggestions && message.suggestions.length > 0 && !isHistoryView && onSuggestionClick && (
          <div className="mt-2 flex flex-wrap gap-2 p-2.5 bg-card border border-border rounded-lg shadow-sm">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1 px-2.5 bg-background hover:bg-primary/10 border-primary/40 text-primary hover:text-primary focus:ring-primary/50 shadow-sm rounded-md"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
        <p className={`text-xs text-muted-foreground mt-1.5 px-1`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
         <Avatar className="h-8 w-8 self-start mt-1 shrink-0">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
