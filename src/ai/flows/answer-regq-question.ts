
'use server';
/**
 * @fileOverview Answers questions about Regulation Q (CFR Title 12).
 *
 * - answerRegQQuestion - A function that answers a question about Regulation Q.
 * - AnswerRegQQuestionInput - The input type for the answerRegQQuestion function.
 * - AnswerRegQQuestionOutput - The return type for the answerRegQQuestion function.
 * - ConversationTurn - The type for a single turn in the conversation history.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationTurnSchema = z.object({
  speaker: z.string().describe("Identifies who spoke, e.g., 'User' or 'AI Summary'"),
  text: z.string().describe("The text of that turn.")
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

const AnswerRegQQuestionInputSchema = z.object({
  question: z.string().describe('The question about Regulation Q.'),
  conversationHistoryItems: z.array(ConversationTurnSchema).optional().describe('Previous turns in the conversation, where speaker is "User" or "AI Summary".'),
});
export type AnswerRegQQuestionInput = z.infer<typeof AnswerRegQQuestionInputSchema>;

const AnswerRegQQuestionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the answer.'),
  explanation: z.string().describe('A detailed explanation of the answer.'),
  references: z.string().describe('Relevant references to Regulation Q sections.'),
  calculationLogic: z.string().optional().describe('Any necessary calculation logic.'),
  referenceTables: z.string().optional().describe('Any reference tables needed.'),
  calculationExamples: z.string().optional().describe('Calculation examples for various scenarios related to the user query, particularly for RWA calculations under the standardized approach. Include step-by-step examples where applicable.'),
});
export type AnswerRegQQuestionOutput = z.infer<typeof AnswerRegQQuestionOutputSchema>;

export async function answerRegQQuestion(input: AnswerRegQQuestionInput): Promise<AnswerRegQQuestionOutput> {
  return answerRegQQuestionFlow(input);
}
const cfrLink = 'https://www.ecfr.gov/current/title-12/chapter-II/subchapter-A/part-217';
const answerRegQQuestionPrompt = ai.definePrompt({
  name: 'answerRegQQuestionPrompt',
  input: {schema: AnswerRegQQuestionInputSchema},
  output: {schema: AnswerRegQQuestionOutputSchema},
  prompt: `You are an AI assistant specializing in U.S. banking regulations, specifically those found in Title 12 of the Code of Federal Regulations (CFR). Your primary reference is the official eCFR website: ${cfrLink}.

When answering questions, particularly those concerning Risk-Weighted Assets (RWA) calculations, you must adhere to the **standardized approach** as implemented under Basel III and codified within CFR Title 12.

{{#if conversationHistoryItems}}
Here is the conversation history (user questions and AI summaries):
{{#each conversationHistoryItems}}
  {{this.speaker}}: {{this.text}}
{{/each}}
---
{{/if}}

Considering the conversation history above (if any), please answer the following new question from the user.
User's new question: {{{question}}}

Please provide:
1.  A concise summary of the answer.
2.  A detailed explanation. Consider relevant product types related to the user's query (e.g., corporate loans, residential mortgages, derivatives, etc.) when formulating your explanation.
3.  Relevant references to specific sections within CFR Title 12. All such references must be current and linkable to their source on ${cfrLink}.
4.  Any necessary calculation logic, especially if related to RWA under the standardized approach.
5.  Any relevant reference tables, if applicable.
6.  Detailed calculation examples for each possible scenario relevant to the user's query. For RWA calculations, demonstrate the standardized approach with step-by-step examples.

Crucially:
-   Base ALL your answers ONLY on information found at ${cfrLink}.
-   Ensure your answers are derived from legal provisions that are currently in effect and have not been repealed, as reflected on the eCFR website.
-   If the information required to answer the question is not present on the eCFR website, or if the question pertains to a provision that has been repealed or is no longer in effect, you must clearly state this.
`,
});

const answerRegQQuestionFlow = ai.defineFlow(
  {
    name: 'answerRegQQuestionFlow',
    inputSchema: AnswerRegQQuestionInputSchema,
    outputSchema: AnswerRegQQuestionOutputSchema,
  },
  async input => {
    const {output} = await answerRegQQuestionPrompt(input);
    return output!;
  }
);

