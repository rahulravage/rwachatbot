'use server';
/**
 * @fileOverview Answers questions about Regulation Q (CFR Title 12).
 *
 * - answerRegQQuestion - A function that answers a question about Regulation Q.
 * - AnswerRegQQuestionInput - The input type for the answerRegQQuestion function.
 * - AnswerRegQQuestionOutput - The return type for the answerRegQQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerRegQQuestionInputSchema = z.object({
  question: z.string().describe('The question about Regulation Q.'),
});
export type AnswerRegQQuestionInput = z.infer<typeof AnswerRegQQuestionInputSchema>;

const AnswerRegQQuestionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the answer.'),
  explanation: z.string().describe('A detailed explanation of the answer.'),
  references: z.string().describe('Relevant references to Regulation Q sections.'),
  calculationLogic: z.string().optional().describe('Any necessary calculation logic.'),
  referenceTables: z.string().optional().describe('Any reference tables needed.'),
});
export type AnswerRegQQuestionOutput = z.infer<typeof AnswerRegQQuestionOutputSchema>;

export async function answerRegQQuestion(input: AnswerRegQQuestionInput): Promise<AnswerRegQQuestionOutput> {
  return answerRegQQuestionFlow(input);
}
const cfrLink = 'https://www.ecfr.gov/current/title-12';
const answerRegQQuestionPrompt = ai.definePrompt({
  name: 'answerRegQQuestionPrompt',
  input: {schema: AnswerRegQQuestionInputSchema},
  output: {schema: AnswerRegQQuestionOutputSchema},
  prompt: `You are an expert on Regulation Q (CFR Title 12) and will answer questions based on it.

Question: {{{question}}}

Provide a concise summary, a detailed explanation, relevant references to the regulation, and any calculation logic or reference tables if needed.
Use ONLY the information available on this resource: ${cfrLink} to answer the question.
Ensure that your answers are based on legal provisions that are currently in effect and have not been repealed, as reflected on the eCFR website.
If the information is NOT present on the eCFR website or the question pertains to a repealed provision, mention that this tool cannot answer it or that the provision is no longer in effect.
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
