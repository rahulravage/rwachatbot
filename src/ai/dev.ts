
import { config } from 'dotenv';
config();

import '@/ai/flows/answer-regq-question.ts';
import '@/ai/flows/correct-regq-answer.ts';
import '@/ai/flows/process-rwa-text-flow.ts';
import '@/ai/flows/calculate-rwa-flow.ts';
import '@/ai/flows/summarize-chat-session-flow.ts';
import '@/ai/flows/parse-regulatory-document-flow.ts'; // Added new flow

