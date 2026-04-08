import { callOpenAIJson, callOpenAIText } from './openai.js';
import { callGeminiJson, callGeminiText } from './gemini.js';

function pickProvider() {
  const explicit = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'openai' || explicit === 'gemini') return explicit;

  // Backward-compatible default: if GEMINI_API_KEY is set, prefer Gemini.
  if (process.env.GEMINI_API_KEY) return 'gemini';

  return 'openai';
}

export async function callLLMText({ system, user, model }) {
  const provider = pickProvider();
  if (provider === 'gemini') {
    return callGeminiText({ system, user, model });
  }
  return callOpenAIText({ system, user, model });
}

export async function callLLMJson({ system, user, schemaHint, model }) {
  const provider = pickProvider();
  if (provider === 'gemini') {
    return callGeminiJson({ system, user, schemaHint, model });
  }
  return callOpenAIJson({ system, user, schemaHint, model });
}
