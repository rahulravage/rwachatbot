'use server';

/**
 * @fileOverview This file defines a Genkit flow for editing and saving the chatbot's answer to Regulation Q questions.
 *
 * - correctRegQAnswer - A function that handles the editing and saving process.
 * - CorrectRegQAnswerInput - The input type for the correctRegQAnswer function.
 * - CorrectRegQAnswerOutput - The return type for the correctRegQAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectRegQAnswerInputSchema = z.object({
  originalAnswer: z.string().describe('The original answer from the chatbot.'),
  editedAnswer: z.string().describe('The edited answer provided by the user.'),
});
export type CorrectRegQAnswerInput = z.infer<typeof CorrectRegQAnswerInputSchema>;

const CorrectRegQAnswerOutputSchema = z.object({
  savedAnswer: z.string().describe('The saved, corrected answer.'),
});
export type CorrectRegQAnswerOutput = z.infer<typeof CorrectRegQAnswerOutputSchema>;

export async function correctRegQAnswer(input: CorrectRegQAnswerInput): Promise<CorrectRegQAnswerOutput> {
  return correctRegQAnswerFlow(input);
}

const correctRegQAnswerFlow = ai.defineFlow(
  {
    name: 'correctRegQAnswerFlow',
    inputSchema: CorrectRegQAnswerInputSchema,
    outputSchema: CorrectRegQAnswerOutputSchema,
  },
  async input => {
    // In a real application, you would save the editedAnswer to a database or other storage.
    // This example simply returns the edited answer as the saved answer.
    return {savedAnswer: input.editedAnswer};
  }
);
