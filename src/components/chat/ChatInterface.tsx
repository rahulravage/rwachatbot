
"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { answerRegQQuestion, type AnswerRegQQuestionOutput, type ConversationTurn } from '@/ai/flows/answer-regq-question';
import { correctRegQAnswer } from '@/ai/flows/correct-regq-answer';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import { SendHorizonal, Sparkles, Bot } from 'lucide-react';
import { Card, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { saveChatMessage, getStoredHistory, setStoredHistory } from '@/lib/localStorage'; // Import localStorage utilities

const MAX_HISTORY_TURNS = 5; // Number of user/bot turn pairs to include in history

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingResponseForId, setIsSavingResponseForId] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    // Initialize session
    if (!currentSessionIdRef.current) {
      currentSessionIdRef.current = crypto.randomUUID();
      sessionStartTimeRef.current = new Date();
    }

    const initialSuggestions = [
        "What is the risk weight for a AAA-rated corporate exposure?",
        "Explain the standardized approach for credit risk.",
        "How are off-balance sheet items treated for RWA calculation?",
        "Detail the RWA for residential mortgage exposures under the standardized approach."
    ];
    const initialBotMessage: ChatMessageType = {
      id: 'initial-bot-message',
      type: 'bot',
      response: {
        summary: 'Welcome to the Basel 3 SA Chatbot!',
        explanation: 'I can help you with questions about U.S. banking regulations (CFR Title 12), focusing on Risk-Weighted Assets (RWA) calculations based on the standardized approach. Ask me anything, or try one of these suggestions:',
      },
      suggestions: initialSuggestions,
      timestamp: new Date(),
    };
    setMessages([initialBotMessage]);
    
    // DO NOT Save initial bot message to history
    inputRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => viewport.scrollTop = viewport.scrollHeight, 0);
      }
    }
  }, [messages]);
  
  const stringifyResponse = (res: AnswerRegQQuestionOutput): string => {
    return `Summary: ${res.summary}\nExplanation: ${res.explanation}\nReferences: ${res.references || 'N/A'}\nCalculation Logic: ${res.calculationLogic || 'N/A'}\nReference Tables: ${res.referenceTables || 'N/A'}\nCalculation Examples: ${res.calculationExamples || 'N/A'}`;
  };

  const addMessageAndSave = (message: ChatMessageType) => {
    setMessages(prev => [...prev, message]);
    if (currentSessionIdRef.current && sessionStartTimeRef.current) {
      saveChatMessage(currentSessionIdRef.current, message, sessionStartTimeRef.current);
    }
  };

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!currentQuery.trim() || isLoading || !currentSessionIdRef.current) return;

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: currentQuery,
      timestamp: new Date(),
    };
    addMessageAndSave(userMessage);
    
    const questionToAsk = currentQuery;
    setCurrentQuery('');
    setIsLoading(true);

    const historyToSend: ConversationTurn[] = [];
    const recentMessages = messages.filter(msg => msg.id !== 'initial-bot-message').slice(-(MAX_HISTORY_TURNS * 2));

    recentMessages.forEach(msg => {
      if (msg.type === 'user' && msg.text) {
        historyToSend.push({ speaker: 'User', text: msg.text });
      } else if (msg.type === 'bot' && msg.response) {
        historyToSend.push({ speaker: 'AI Summary', text: msg.response.summary });
      }
    });

    try {
      const botResponseData = await answerRegQQuestion({
        question: questionToAsk,
        conversationHistoryItems: historyToSend.length > 0 ? historyToSend : undefined,
      });
      const botMessage: ChatMessageType = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        response: botResponseData,
        timestamp: new Date(),
      };
      addMessageAndSave(botMessage);
    } catch (error) {
      console.error('Error fetching bot response:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get response. Please try again.',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSaveResponse = async (messageId: string, editedData: AnswerRegQQuestionOutput) => {
    const sessionId = currentSessionIdRef.current;
    if (!sessionId) return;

    const originalMessageIndex = messages.findIndex(msg => msg.id === messageId && msg.type === 'bot');
    if (originalMessageIndex === -1 || !messages[originalMessageIndex].response) {
      toast({ variant: "destructive", title: "Error", description: "Original message not found." });
      return;
    }

    setIsSavingResponseForId(messageId);
    try {
      const originalAnswerStr = stringifyResponse(messages[originalMessageIndex].response!);
      const editedAnswerStr = stringifyResponse(editedData);
      
      await correctRegQAnswer({ originalAnswer: originalAnswerStr, editedAnswer: editedAnswerStr });
      
      const updatedMessages = messages.map(msg =>
        msg.id === messageId ? { ...msg, response: editedData, timestamp: new Date(), isEditing: false, isEditedByUser: true } : msg
      );
      setMessages(updatedMessages);
      
      // Update the specific message in localStorage for the current session
      const allHistory = getStoredHistory();
      if (allHistory[sessionId]) {
        const sessionToUpdate = allHistory[sessionId];
        const messageIndexInSession = sessionToUpdate.messages.findIndex(m => m.id === messageId);
        
        if (messageIndexInSession !== -1) {
          sessionToUpdate.messages[messageIndexInSession].response = editedData;
          sessionToUpdate.messages[messageIndexInSession].timestamp = new Date(); // Update timestamp
          sessionToUpdate.messages[messageIndexInSession].isEditedByUser = true; // Mark as edited
        }
        setStoredHistory(allHistory); // Save the modified history
      }
      
      toast({ title: "Success", description: "Answer updated and saved." });
    } catch (error) {
      console.error("Error saving answer:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save answer." });
    } finally {
      setIsSavingResponseForId(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentQuery(suggestion);
    inputRef.current?.focus(); 
    setTimeout(() => {
        if(inputRef.current?.form) {
            inputRef.current.form.requestSubmit();
        }
    }, 0);
  };

  return (
    <Card className="w-full max-w-3xl flex-grow flex flex-col shadow-xl rounded-lg overflow-hidden border my-4">
      <CardHeader className="border-b p-4 bg-card">
        <CardTitle className="text-lg md:text-xl font-semibold flex items-center gap-2 text-card-foreground">
          <Sparkles className="text-primary h-5 w-5 md:h-6 md:w-6" />
          Basel 3 SA Chatbot
        </CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-grow p-3 md:p-4 bg-background" ref={scrollAreaRef}>
        <div className="space-y-1">
          {messages.map(msg => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              onSaveResponse={handleSaveResponse} 
              isSavingResponse={isSavingResponseForId === msg.id}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
          {isLoading && messages.length > 0 && messages[messages.length-1].type === 'user' && (
            <div className="flex items-center gap-2.5 my-3 p-2 rounded-md">
                <Avatar className="h-8 w-8 self-start mt-1 shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                        <Bot size={18} />
                    </AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 p-2.5 rounded-lg shadow-sm">
                    <LoadingSpinner size={18} className="mr-2 inline-block" />
                    <span className="text-sm text-muted-foreground italic">Bot is thinking...</span>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardFooter className="p-3 md:p-4 border-t bg-card">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={currentQuery}
            onChange={e => setCurrentQuery(e.target.value)}
            placeholder="Ask about CFR Title 12 or RWA..."
            className="flex-grow text-sm focus-visible:ring-primary/50 h-10"
            disabled={isLoading || !!isSavingResponseForId}
            aria-label="Chat input"
          />
          <Button type="submit" disabled={isLoading || !!isSavingResponseForId || !currentQuery.trim()} size="lg" className="bg-primary hover:bg-primary/90 h-10 px-4">
            <SendHorizonal className="h-4 w-4 md:h-5 md:w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default ChatInterface;
