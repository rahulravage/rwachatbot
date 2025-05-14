
'use server';
/**
 * @fileOverview Parses a regulatory document (e.g., from eCFR) to extract key obligations and rules.
 *
 * - parseRegulatoryDocument - A function that takes a URL and attempts to extract obligations.
 * - ParseRegulatoryDocumentInput - The input type for the parseRegulatoryDocument function.
 * - ParseRegulatoryDocumentOutput - The return type for the parseRegulatoryDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ObligationSchema = z.object({
  obligation: z
    .string()
    .describe(
      'A concise description of the regulatory obligation or requirement.'
    ),
  rule: z
    .string()
    .describe(
      "The specific rule, section, or citation (e.g., '12 CFR § 217.10')."
    ),
  details: z
    .string()
    .describe(
      'Additional context, summary, or key details about the obligation.'
    ),
});

const ParseRegulatoryDocumentInputSchema = z.object({
  documentUrl: z
    .string()
    .url()
    .describe(
      'The URL of the regulatory document to parse, preferably an eCFR link.'
    ),
});
export type ParseRegulatoryDocumentInput = z.infer<
  typeof ParseRegulatoryDocumentInputSchema
>;

const ParseRegulatoryDocumentOutputSchema = z.object({
  sourceTitle: z
    .string()
    .optional()
    .describe(
      'The title of the regulatory document, if identifiable from the content or URL.'
    ),
  obligations: z
    .array(ObligationSchema)
    .describe('A list of extracted obligations and rules.'),
});
export type ParseRegulatoryDocumentOutput = z.infer<
  typeof ParseRegulatoryDocumentOutputSchema
>;

export async function parseRegulatoryDocument(
  input: ParseRegulatoryDocumentInput
): Promise<ParseRegulatoryDocumentOutput> {
  return parseRegulatoryDocumentFlow(input);
}

const parseRegulatoryDocumentPrompt = ai.definePrompt({
  name: 'parseRegulatoryDocumentPrompt',
  input: {schema: ParseRegulatoryDocumentInputSchema},
  output: {schema: ParseRegulatoryDocumentOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing U.S. regulatory documents, particularly from the eCFR (Electronic Code of Federal Regulations).

Given the following URL: {{{documentUrl}}}

Your task is to:
1.  If possible, identify the title of the document (e.g., "Part 217 - Capital Adequacy of Bank Holding Companies, Savings and Loan Holding Companies, and State Member Banks"). Set this as 'sourceTitle'. If not clearly identifiable, this can be omitted.
2.  Thoroughly analyze the content typically found at such an eCFR URL. Extract key regulatory obligations, requirements, or prohibitions.
3.  For each identified obligation:
    *   Provide a concise 'obligation' description.
    *   Specify the 'rule' or citation it relates to (e.g., "12 CFR § 217.10(a)(1)").
    *   Summarize relevant 'details' or context for that obligation.
4.  Return these as an array under 'obligations'.

Focus on actionable obligations and rules. Ensure that the extracted information is based on the content expected at the provided eCFR link. If the URL doesn't seem to point to a standard eCFR page or similar regulatory text, or if no clear obligations can be derived, return an empty 'obligations' array.

Example eCFR link structure: https://www.ecfr.gov/current/title-12/chapter-II/part-217/subpart-A/section-217.1

Prioritize accuracy and conciseness.
`,
});

const parseRegulatoryDocumentFlow = ai.defineFlow(
  {
    name: 'parseRegulatoryDocumentFlow',
    inputSchema: ParseRegulatoryDocumentInputSchema,
    outputSchema: ParseRegulatoryDocumentOutputSchema,
  },
  async (input) => {
    // Basic validation for eCFR links (can be expanded)
    if (!input.documentUrl.includes('ecfr.gov')) {
        // For non-eCFR links, the LLM might still attempt, but quality may vary.
        // Or, we could return an error or a specific message here.
        // For now, we let the LLM try but it's prompted to focus on eCFR.
    }
    const {output} = await parseRegulatoryDocumentPrompt(input);
    if (!output) {
      throw new Error('Failed to parse regulatory document.');
    }
    return output;
  }
);

