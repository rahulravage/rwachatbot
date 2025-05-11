"use client";

import type { ChatMessage as ChatMessageType } from '@/types/chat';
import type { AnswerRegQQuestionOutput } from '@/ai/flows/answer-regq-question';
import StructuredResponse from './StructuredResponse';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ChatMessageProps {
  message: ChatMessageType;
  onSaveResponse: (messageId: string, editedResponse: AnswerRegQQuestionOutput) => Promise<void>;
  isSavingResponse: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSaveResponse, isSavingResponse }) => {
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
            onSave={(editedResponse) => onSaveResponse(message.id, editedResponse)}
            isSaving={isSavingResponse}
          />
        )}
        <p className={`text-xs text-muted-foreground mt-1.5 px-1`}>
          {message.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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
