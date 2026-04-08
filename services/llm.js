import { callOpenAIJson, callOpenAIText } from './openai.js';
import { callGeminiJson, callGeminiText } from './gemini.js';
import { callGroqJson, callGroqText } from './groq.js';

function pickProvider() {
  const explicit = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'openai' || explicit === 'gemini' || explicit === 'groq') return explicit;

  // Default priority: use whatever key is present.
  // Prefer Groq over Gemini to avoid Gemini's frequent free-tier throttling.
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.GEMINI_API_KEY) return 'gemini';

  return 'openai';
}

export async function callLLMText({ system, user, model }) {
  const provider = pickProvider();
  if (provider === 'gemini') {
    return callGeminiText({ system, user, model });
  }
  if (provider === 'groq') {
    return callGroqText({ system, user, model });
  }
  return callOpenAIText({ system, user, model });
}

export async function callLLMJson({ system, user, schemaHint, model }) {
  const provider = pickProvider();
  if (provider === 'gemini') {
    return callGeminiJson({ system, user, schemaHint, model });
  }
  if (provider === 'groq') {
    return callGroqJson({ system, user, schemaHint, model });
  }
  return callOpenAIJson({ system, user, schemaHint, model });
}
