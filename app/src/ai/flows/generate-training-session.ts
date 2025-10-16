'use server';

/**
 * @fileOverview An AI agent for generating futsal training sessions.
 *
 * - generateTrainingSession - A function that generates a training session plan.
 * - GenerateTrainingSessionInput - The input type for the generateTrainingSession function.
 * - GenerateTrainingSessionOutput - The return type for the generateTrainingSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTrainingSessionInputSchema = z.object({
  teamDescription: z.string().describe('Description of the team, including age group and skill level.'),
  trainingGoals: z.string().describe('Specific training goals for the session.'),
  sessionFocus: z.string().describe('The main focus of the training session (e.g., attack-defense transitions).'),
  preferredSessionLengthMinutes: z.number().describe('The desired length of the session in minutes.'),
});
export type GenerateTrainingSessionInput = z.infer<typeof GenerateTrainingSessionInputSchema>;

const GenerateTrainingSessionOutputSchema = z.object({
  warmUp: z.string().describe('Detailed description of the warm-up exercise.'),
  mainExercises: z.array(z.string()).describe('Array of detailed descriptions for the main exercises.'),
  coolDown: z.string().describe('Detailed description of the cool-down exercise.'),
  coachNotes: z.string().describe('General notes and key points for the coach.'),
});
export type GenerateTrainingSessionOutput = z.infer<typeof GenerateTrainingSessionOutputSchema>;

export async function generateTrainingSession(input: GenerateTrainingSessionInput): Promise<GenerateTrainingSessionOutput> {
  return generateTrainingSessionFlow(input);
}

const generateTrainingSessionPrompt = ai.definePrompt({
  name: 'generateTrainingSessionPrompt',
  input: {schema: GenerateTrainingSessionInputSchema},
  output: {schema: GenerateTrainingSessionOutputSchema},
  prompt: `You are LaPizarra AI, an expert futsal coach. Your task is to design a complete, coherent, and effective training session based on the user's requirements.

Team Description: {{{teamDescription}}}
Training Goals: {{{trainingGoals}}}
Session Focus: {{{sessionFocus}}}
Preferred Session Length: {{{preferredSessionLengthMinutes}}} minutes

Ensure the session is well-structured, with clear instructions and appropriate exercises for each phase (warm-up, main exercises, cool-down).  Provide coach notes at the end that summarize the session and highlight key coaching points.

Warm-up description:

Main exercises: (Provide an array of descriptions)

Cool-down description:

Coach notes: `,
});

const generateTrainingSessionFlow = ai.defineFlow(
  {
    name: 'generateTrainingSessionFlow',
    inputSchema: GenerateTrainingSessionInputSchema,
    outputSchema: GenerateTrainingSessionOutputSchema,
  },
  async input => {
    const {output} = await generateTrainingSessionPrompt(input);
    return output!;
  }
);
