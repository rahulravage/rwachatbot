
// src/lib/localStorage.ts
'use client';

import type { ChatMessage, ChatSession } from '@/types/chat';

const CHAT_HISTORY_KEY = 'regqChatHistory';

// Helper to safely parse JSON from localStorage
export const getStoredHistory = (): Record<string, ChatSession> => {
  if (typeof window === 'undefined') return {};
  try {
    const rawHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    const parsed = rawHistory ? JSON.parse(rawHistory) : {};
    // Ensure startTime and message timestamps are Date objects
    Object.keys(parsed).forEach(sessionId => {
      parsed[sessionId].startTime = new Date(parsed[sessionId].startTime);
      parsed[sessionId].messages = parsed[sessionId].messages.map((msg: ChatMessage) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      // summary is optional and a string, so no conversion needed here unless complex object
    });
    return parsed;
  } catch (error) {
    console.error("Error reading chat history from localStorage:", error);
    localStorage.removeItem(CHAT_HISTORY_KEY); // Clear corrupted data
    return {};
  }
};

// Helper to safely stringify and set JSON to localStorage
export const setStoredHistory = (history: Record<string, ChatSession>): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving chat history to localStorage:", error);
  }
};

export const saveChatMessage = (
  sessionId: string,
  message: ChatMessage,
  sessionStartTime?: Date
): void => {
  if (typeof window === 'undefined') return;
  const history = getStoredHistory();
  
  let currentSession = history[sessionId];
  if (!currentSession) {
    currentSession = {
      id: sessionId,
      startTime: sessionStartTime || new Date(),
      messages: [],
      summary: undefined, // Initialize summary
    };
  }
  
  // Ensure message timestamp is a Date object before pushing
  const messageToSave = { ...message, timestamp: new Date(message.timestamp) };
  currentSession.messages.push(messageToSave);
  
  // Ensure startTime is a Date object
  currentSession.startTime = new Date(currentSession.startTime);

  history[sessionId] = currentSession;
  setStoredHistory(history);
};

export const updateSessionSummary = (sessionId: string, summary: string): void => {
  if (typeof window === 'undefined') return;
  const history = getStoredHistory();
  if (history[sessionId]) {
    history[sessionId].summary = summary;
    setStoredHistory(history);
  }
};

export const getAllChatSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return [];
  const history = getStoredHistory();
  return Object.values(history)
    .map(session => ({
      ...session,
      startTime: new Date(session.startTime), 
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp) 
      })),
      // summary is already part of the session object
    }))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); 
};


export const getSession = (sessionId: string): ChatSession | null => {
  if (typeof window === 'undefined') return null;
  const history = getStoredHistory();
  const session = history[sessionId];
  if (session) {
    return {
      ...session,
      startTime: new Date(session.startTime),
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      // summary is already part of the session object
    };
  }
  return null;
};

export const clearChatHistory = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAT_HISTORY_KEY);
};

export const deleteChatSession = (sessionId: string): void => {
  if (typeof window === 'undefined') return;
  const history = getStoredHistory();
  if (history[sessionId]) {
    delete history[sessionId];
    setStoredHistory(history);
  }
};
