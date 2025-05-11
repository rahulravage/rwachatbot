'use server';
/**
 * @fileOverview Processes RWA-related text to identify calculation logic and required inputs.
 *
 * - processRwaText - Identifies RWA calculation logic and extracts required parameters from text.
 * - ProcessRwaTextInput - Input type for processRwaText.
 * - ProcessRwaTextOutput - Output type for processRwaText.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InputParameterSchema = z.object({
  name: z
    .string()
    .describe(
      "A concise, machine-readable name for the input field (e.g., 'exposureAmount', 'riskWeightPercentage'). Use camelCase."
    ),
  label: z
    .string()
    .describe(
      "A user-friendly label for the input field (e.g., 'Exposure Amount ($)', 'Applicable Risk Weight (%)')."
    ),
  type: z
    .enum(['number', 'text', 'percentage'])
    .describe(
      "The type of input expected. 'percentage' implies a number that will be used as a percentage (e.g., 50 for 50%)."
    ),
  description: z
    .string()
    .optional()
    .describe('A brief description or help text for the input field, referencing CFR Title 12 if applicable.'),
});

const ProcessRwaTextInputSchema = z.object({
  rwaText: z
    .string()
    .describe(
      'Text containing RWA calculation logic and examples, typically copied from the chatbot response.'
    ),
});
export type ProcessRwaTextInput = z.infer<typeof ProcessRwaTextInputSchema>;

const ProcessRwaTextOutputSchema = z.object({
  logicSummary: z
    .string()
    .describe(
      'A summary of the RWA calculation logic identified in the text, referencing specific CFR Title 12 sections.'
    ),
  requiredInputs: z
    .array(InputParameterSchema)
    .describe(
      'An array of input parameters required for the RWA calculation, derived from CFR Title 12 and the provided text.'
    ),
});
export type ProcessRwaTextOutput = z.infer<typeof ProcessRwaTextOutputSchema>;

export async function processRwaText(
  input: ProcessRwaTextInput
): Promise<ProcessRwaTextOutput> {
  return processRwaTextFlow(input);
}
const cfrLink = 'https://www.ecfr.gov/current/title-12';
const processRwaTextPrompt = ai.definePrompt({
  name: 'processRwaTextPrompt',
  input: {schema: ProcessRwaTextInputSchema},
  output: {schema: ProcessRwaTextOutputSchema},
  prompt: `You are an AI assistant specializing in U.S. banking regulations, specifically Risk-Weighted Assets (RWA) calculations under the standardized approach as defined in CFR Title 12. Your primary reference is ${cfrLink}.

Given the following text, which describes RWA calculation logic and may include examples:
'''
{{{rwaText}}}
'''

Your tasks are:
1.  **Identify and Summarize Logic**: Analyze the text to understand the specific RWA calculation being described. Provide a concise summary of this logic. This summary MUST reference the relevant sections of CFR Title 12 that govern this calculation.
2.  **Determine Required Inputs**: Based on the identified logic and the rules in CFR Title 12 (standardized approach), list all the input parameters a user would need to provide to perform this RWA calculation. For each parameter:
    *   Define a machine-readable 'name' (camelCase).
    *   Create a user-friendly 'label'.
    *   Specify the 'type' ('number', 'text', or 'percentage'). For percentages, the user will input a number (e.g., 50 for 50%).
    *   Optionally, provide a brief 'description' or help text, citing specific CFR Title 12 provisions if it clarifies the input.

Focus exclusively on the standardized approach for RWA calculations as codified in CFR Title 12. Ensure all references and interpretations are current and accurate according to ${cfrLink}.

Output the logic summary and the list of required inputs in the specified JSON format.
`,
});

const processRwaTextFlow = ai.defineFlow(
  {
    name: 'processRwaTextFlow',
    inputSchema: ProcessRwaTextInputSchema,
    outputSchema: ProcessRwaTextOutputSchema,
  },
  async (input) => {
    const {output} = await processRwaTextPrompt(input);
    if (!output) {
      throw new Error('Failed to process RWA text and identify inputs.');
    }
    return output;
  }
);
