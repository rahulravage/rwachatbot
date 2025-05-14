
'use server';
/**
 * @fileOverview Summarizes a chat session.
 *
 * - summarizeChatSession - A function that generates a summary for a given chat session.
 * - SummarizeChatSessionInput - The input type for the summarizeChatSession function.
 * - SummarizeChatSessionOutput - The return type for the summarizeChatSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ConversationTurn } from './answer-regq-question'; // Reusing this type

const ConversationTurnSchema = z.object({
  speaker: z.string().describe("Identifies who spoke, e.g., 'User' or 'AI'"),
  text: z.string().describe("The text of that turn.")
});

const SummarizeChatSessionInputSchema = z.object({
  messages: z.array(ConversationTurnSchema).describe('The messages in the chat session.'),
});
export type SummarizeChatSessionInput = z.infer<typeof SummarizeChatSessionInputSchema>;

const SummarizeChatSessionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the chat session.'),
});
export type SummarizeChatSessionOutput = z.infer<typeof SummarizeChatSessionOutputSchema>;

export async function summarizeChatSession(input: SummarizeChatSessionInput): Promise<SummarizeChatSessionOutput> {
  return summarizeChatSessionFlow(input);
}

const summarizeChatSessionPrompt = ai.definePrompt({
  name: 'summarizeChatSessionPrompt',
  input: {schema: SummarizeChatSessionInputSchema},
  output: {schema: SummarizeChatSessionOutputSchema},
  prompt: `Please provide a concise summary (1-2 sentences) of the following chat conversation. Focus on the main topics discussed and any key outcomes or questions resolved.

Conversation History:
{{#each messages}}
  {{this.speaker}}: {{this.text}}
{{/each}}

Summary:
`,
});

const summarizeChatSessionFlow = ai.defineFlow(
  {
    name: 'summarizeChatSessionFlow',
    inputSchema: SummarizeChatSessionInputSchema,
    outputSchema: SummarizeChatSessionOutputSchema,
  },
  async (input) => {
    if (input.messages.length === 0) {
        return { summary: "This session has no messages to summarize." };
    }
    const {output} = await summarizeChatSessionPrompt(input);
    if (!output) {
        throw new Error('Failed to generate chat session summary.');
    }
    return output;
  }
);
