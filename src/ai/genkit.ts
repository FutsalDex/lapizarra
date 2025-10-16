import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from 'genkit/google-cloud'

export const ai = genkit({
  plugins: [googleAI(), googleCloud({projectId: 'lapizarra-95eqd'})],
  model: 'googleai/gemini-2.5-flash',
});
