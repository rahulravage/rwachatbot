
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Trash2, HistoryIcon, AlertTriangle } from 'lucide-react';
import ChatMessage from '@/components/chat/ChatMessage';
import type { ChatSession } from '@/types/chat';
import { getAllChatSessions, clearChatHistory as clearHistoryUtil, deleteChatSession as deleteSessionUtil } from '@/lib/localStorage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import LoadingSpinner from '@/components/chat/LoadingSpinner'; 
import { useToast } from '@/hooks/use-toast';


export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      setSessions(getAllChatSessions());
      setIsLoading(false);
    }
  }, []);

  const loadSessions = () => {
    setSessions(getAllChatSessions());
  }

  const handleClearAllHistory = () => {
    setIsClearing(true);
    clearHistoryUtil();
    loadSessions(); // Reload sessions
    setIsClearing(false);
    toast({ title: "Chat History Cleared", description: "All chat sessions have been deleted." });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSessionUtil(sessionId);
    loadSessions(); // Reload sessions
    setSessionToDelete(null); // Close dialog
    toast({ title: "Session Deleted", description: `Session ${sessionId.substring(0,8)}... has been deleted.` });
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: 'numeric', minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center flex-grow bg-background p-4 md:p-6 lg:p-8">
        <LoadingSpinner size={48} />
        <p className="mt-4 text-muted-foreground">Loading chat history...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center flex-grow bg-background p-4 md:p-6 lg:p-8 space-y-6">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-primary">
              <HistoryIcon className="h-6 w-6" />
              Chat History
            </CardTitle>
            <CardDescription>Review your past chat sessions.</CardDescription>
          </div>
          {sessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isClearing}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isClearing ? "Clearing..." : "Clear All History"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" />Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete ALL your chat history from this browser.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllHistory} disabled={isClearing} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete all history
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <ScrollText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                No chat history found.
              </p>
              <p className="text-sm text-muted-foreground">
                Your conversations will appear here once you start chatting.
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {sessions.map((session) => (
                <AccordionItem value={`session-${session.id}`} key={session.id} className="bg-muted/30 rounded-lg border shadow-sm">
                  <div className="flex items-center pr-2">
                    <AccordionTrigger className="flex-grow px-4 py-3 hover:bg-muted/50 rounded-t-lg text-sm font-medium text-primary">
                       Session started: {formatDate(session.startTime)} ({session.messages.length} messages)
                    </AccordionTrigger>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive ml-2 shrink-0 p-1 h-7 w-7"
                            onClick={(e) => {e.stopPropagation(); setSessionToDelete(session.id);}} // Prevent accordion toggle
                          >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete session</span>
                        </Button>
                      </AlertDialogTrigger>
                      {/* This content could be a shared component if we have more confirmation dialogs */}
                      {sessionToDelete === session.id && ( 
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" />Delete this session?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this chat session ({formatDate(session.startTime)}) from your history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSession(session.id)} className="bg-destructive hover:bg-destructive/90">
                              Yes, delete session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
                  </div>
                  <AccordionContent className="p-4 border-t bg-background rounded-b-lg">
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2"> {/* Added scroll for long sessions */}
                      {session.messages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          message={msg}
                          isHistoryView={true} 
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

