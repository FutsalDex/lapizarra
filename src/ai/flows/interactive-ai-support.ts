'use server';

/**
 * @fileOverview Provides an interactive AI support flow for subscribed users to get coaching advice.
 *
 * - interactiveAiSupport - A function that handles the interaction with the AI coach.
 * - InteractiveAiSupportInput - The input type for the interactiveAiSupport function.
 * - InteractiveAiSupportOutput - The return type for the interactiveAiSupport function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const InteractiveAiSupportInputSchema = z.object({
  query: z.string().describe('The user query for the AI coach.'),
});
export type InteractiveAiSupportInput = z.infer<typeof InteractiveAiSupportInputSchema>;

const InteractiveAiSupportOutputSchema = z.object({
  response: z.string().describe('The response from the AI coach.'),
});
export type InteractiveAiSupportOutput = z.infer<typeof InteractiveAiSupportOutputSchema>;

export async function interactiveAiSupport(input: InteractiveAiSupportInput): Promise<InteractiveAiSupportOutput> {
  return interactiveAiSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interactiveAiSupportPrompt',
  input: {schema: InteractiveAiSupportInputSchema},
  output: {schema: InteractiveAiSupportOutputSchema},
  prompt: `You are LaPizarra AI, an expert futsal coach providing guidance and support.

  Respond to the following user query with helpful advice related to training strategies, exercise selection, and team management:

  User Query: {{{query}}}

  Consider the user is a futsal coach looking for advice.
  Provide a concise and informative response. Focus on practical suggestions and actionable insights.
  Do not act as the user, only provide output as yourself, the LaPizarra AI coach.
  Do not mention that you are an AI.
  `,
});

const interactiveAiSupportFlow = ai.defineFlow(
  {
    name: 'interactiveAiSupportFlow',
    inputSchema: InteractiveAiSupportInputSchema,
    outputSchema: InteractiveAiSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
