'use server';
/**
 * @fileOverview Calculates RWA based on provided context and user inputs.
 *
 * - calculateRwa - Performs RWA calculation.
 * - CalculateRwaInput - Input type for calculateRwa.
 * - CalculateRwaOutput - Output type for calculateRwa.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateRwaInputSchema = z.object({
  rwaContext: z
    .string()
    .describe(
      'The context or summary of the RWA calculation logic, often derived from a previous analysis or chatbot response. This should reference relevant CFR Title 12 sections.'
    ),
  providedInputs: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .describe(
      "An object where keys are the machine-readable names of input parameters (e.g., 'exposureAmount') and values are the data provided by the user."
    ),
});
export type CalculateRwaInput = z.infer<typeof CalculateRwaInputSchema>;

const CalculateRwaOutputSchema = z.object({
  calculatedRwa: z
    .number()
    .describe('The final calculated Risk-Weighted Asset (RWA) value.'),
  calculationMethod: z
    .string()
    .describe('The RWA calculation method applied, referencing specific CFR Title 12 provisions (standardized approach).'),
  calculationSteps: z
    .string()
    .describe(
      'A step-by-step explanation of how the RWA was calculated using the provided inputs and the identified logic from CFR Title 12.'
    ),
});
export type CalculateRwaOutput = z.infer<typeof CalculateRwaOutputSchema>;

export async function calculateRwa(
  input: CalculateRwaInput
): Promise<CalculateRwaOutput> {
  return calculateRwaFlow(input);
}
const cfrLink = 'https://www.ecfr.gov/current/title-12';
const calculateRwaPrompt = ai.definePrompt({
  name: 'calculateRwaPrompt',
  input: {schema: CalculateRwaInputSchema},
  output: {schema: CalculateRwaOutputSchema},
  prompt: `You are an AI expert in U.S. banking regulations, specifically performing Risk-Weighted Assets (RWA) calculations under the standardized approach as defined in CFR Title 12. Your calculations must be based SOLELY on the rules found at ${cfrLink}.

Context for the RWA calculation (derived from previous analysis or user query, referencing CFR Title 12):
'''
{{{rwaContext}}}
'''

User-provided inputs:
'''
{{#each providedInputs}}
- {{@key}}: {{this}}
{{/each}}
'''

Your tasks:
1.  **Verify Inputs and Context**: Ensure the provided inputs are appropriate for the RWA calculation method described in the 'rwaContext' and CFR Title 12.
2.  **Calculate RWA**: Perform the RWA calculation using the standardized approach outlined in CFR Title 12, based on the 'rwaContext' and 'providedInputs'.
3.  **Document Method**: Clearly state the RWA calculation method applied, including specific citations to CFR Title 12 (e.g., "Standardized approach for corporate exposures under 12 CFR § X.Y(z)").
4.  **Explain Steps**: Provide a detailed, step-by-step explanation of how the RWA was derived. Show all intermediate calculations and reference the specific CFR Title 12 rules applied at each step. If an input is a percentage (e.g., riskWeightPercentage = 50), interpret it as 50% or 0.50 in calculations as appropriate. If an input is a boolean (e.g. prudentlyUnderwritten = true), interpret it accordingly.

If the provided information is insufficient or ambiguous for a precise calculation according to CFR Title 12, clearly state what's missing or unclear. Do not make assumptions beyond what is explicitly stated in CFR Title 12 or reasonably inferred from the inputs.

Output the calculated RWA, the method used, and the step-by-step explanation in the specified JSON format.
`,
});

const calculateRwaFlow = ai.defineFlow(
  {
    name: 'calculateRwaFlow',
    inputSchema: CalculateRwaInputSchema,
    outputSchema: CalculateRwaOutputSchema,
  },
  async (input) => {
    // Convert numeric string inputs to numbers, and common boolean-like strings to booleans.
    const processedInputs: Record<string, string | number | boolean> = {};
    for (const key in input.providedInputs) {
      const value = input.providedInputs[key];
      if (typeof value === 'string') {
        // Check if it's a numeric string
        if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
          processedInputs[key] = parseFloat(value);
        } else {
          // Check if it's a boolean-like string
          const lowerValue = value.toLowerCase();
          if (lowerValue === 'yes' || lowerValue === 'true') {
            processedInputs[key] = true;
          } else if (lowerValue === 'no' || lowerValue === 'false') {
            processedInputs[key] = false;
          } else {
            // Keep as string if not a clear boolean or number
            processedInputs[key] = value;
          }
        }
      } else {
        // Value is already a number or boolean
        processedInputs[key] = value;
      }
    }
    
    const {output} = await calculateRwaPrompt({
        ...input,
        providedInputs: processedInputs,
    });

    if (!output) {
      throw new Error('Failed to calculate RWA.');
    }
    return output;
  }
);