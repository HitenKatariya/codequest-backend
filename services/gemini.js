function requiredEnv(name) {
  let value = process.env[name];
  if (!value) {
    const error = new Error(`${name} is required`);
    error.statusCode = 500;
    throw error;
  }
  value = String(value).trim();
  // Support common .env quoting styles: KEY="..." or KEY='...'
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function normalizeModelId(model) {
  const raw = String(model || '').trim();
  if (!raw) return '';
  // Accept both "gemini-..." and "models/gemini-..." forms.
  return raw.startsWith('models/') ? raw.slice('models/'.length) : raw;
}

let cachedGenerateContentModelId = '';

async function listModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    const parsed = await parseGeminiError(response);
    const error = new Error(parsed.message);
    error.statusCode = parsed.statusCode;
    throw error;
  }

  const data = await response.json();
  const models = Array.isArray(data?.models) ? data.models : [];
  return models
    .map((m) => ({
      name: typeof m?.name === 'string' ? m.name : '',
      methods: Array.isArray(m?.supportedGenerationMethods) ? m.supportedGenerationMethods : [],
    }))
    .filter((m) => m.name);
}

async function pickAlternateGenerateContentModelId(apiKey, excludeModelId) {
  const exclude = normalizeModelId(excludeModelId);
  const models = await listModels(apiKey);
  const supportsGenerate = models
    .filter((m) => m.methods.includes('generateContent'))
    .map((m) => normalizeModelId(m.name))
    .filter(Boolean)
    .filter((id) => id !== exclude);

  if (supportsGenerate.length === 0) return '';

  // If flash is overloaded, try a non-flash model first.
  const excludeIsFlash = exclude.toLowerCase().includes('flash');
  if (excludeIsFlash) {
    return supportsGenerate.find((id) => !id.toLowerCase().includes('flash')) || supportsGenerate[0];
  }

  // Otherwise prefer flash if present.
  return supportsGenerate.find((id) => id.toLowerCase().includes('flash')) || supportsGenerate[0];
}

async function pickGenerateContentModelId(apiKey) {
  if (cachedGenerateContentModelId) return cachedGenerateContentModelId;

  const models = await listModels(apiKey);

  const supportsGenerate = models.filter((m) => m.methods.includes('generateContent'));

  // Prefer flash models when available, otherwise any generateContent-capable model.
  const preferred =
    supportsGenerate.find((m) => m.name.toLowerCase().includes('flash')) ||
    supportsGenerate[0];

  cachedGenerateContentModelId = normalizeModelId(preferred?.name || '');
  return cachedGenerateContentModelId;
}

function normalizeTextParts(parts) {
  if (!Array.isArray(parts)) return '';
  return parts
    .map((p) => (typeof p?.text === 'string' ? p.text : ''))
    .filter(Boolean)
    .join('')
    .trim();
}

function stripCodeFences(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  const withoutStart = trimmed.replace(/^```[a-zA-Z]*\s*/m, '');
  return withoutStart.replace(/\s*```\s*$/m, '').trim();
}

function extractJson(text) {
  const s = stripCodeFences(text);

  try {
    return JSON.parse(s);
  } catch {
    // continue
  }

  const startObj = s.indexOf('{');
  const endObj = s.lastIndexOf('}');
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    const candidate = s.slice(startObj, endObj + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }
  }

  const startArr = s.indexOf('[');
  const endArr = s.lastIndexOf(']');
  if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
    const candidate = s.slice(startArr, endArr + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }
  }

  const error = new Error('Gemini returned invalid JSON. Please try again.');
  error.statusCode = 502;
  error.raw = s.slice(0, 2000);
  throw error;
}

async function parseGeminiError(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message =
    payload?.error?.message ||
    payload?.message ||
    response.statusText ||
    'Gemini API request failed';

  if (
    response.status === 400 &&
    typeof message === 'string' &&
    message.toLowerCase().includes('api key not valid')
  ) {
    return {
      statusCode: 401,
      message:
        'Invalid Gemini API key. Create a key in Google AI Studio (Gemini API), enable the Generative Language API for that project, then set it as GEMINI_API_KEY on the server and restart/redeploy.',
    };
  }

  if (response.status === 404) {
    return {
      statusCode: 404,
      message:
        'Gemini model not found/unsupported for this API key. Set GEMINI_MODEL to an available model, or allow the server to auto-pick from ListModels.',
    };
  }

  if (response.status === 503) {
    return {
      statusCode: 503,
      message:
        'Gemini is temporarily overloaded (high demand). Please try again in a moment.',
    };
  }

  // Map common cases to user-friendly status codes
  if (response.status === 401) {
    return {
      statusCode: 401,
      message:
        'Gemini authentication failed. Verify GEMINI_API_KEY is correct and active on the server environment.',
    };
  }

  if (response.status === 429) {
    return {
      statusCode: 429,
      message:
        'Gemini rate limit exceeded. Please try again later (or reduce request frequency).',
    };
  }

  const statusCode =
    typeof response.status === 'number' && response.status >= 400 && response.status <= 599
      ? response.status
      : 502;
  return { statusCode, message: `Gemini API error (${response.status}): ${message}` };
}

export async function callGeminiText({ system, user, model, responseMimeType }) {
  const apiKey = requiredEnv('GEMINI_API_KEY');
  const envModel = process.env.GEMINI_MODEL;
  const requestedModel = normalizeModelId(model || envModel || '');
  const usedModel = requestedModel || (await pickGenerateContentModelId(apiKey)) || 'gemini-1.5-flash';

  const makeUrl = (modelId) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      normalizeModelId(modelId)
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.3,
      ...(responseMimeType ? { responseMimeType } : null),
    },
  };

  const attempt = async (modelId) => {
    const maxRetries = 2;

    for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex += 1) {
      const response = await fetch(makeUrl(modelId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return normalizeTextParts(data?.candidates?.[0]?.content?.parts);
      }

      const parsed = await parseGeminiError(response);

      const retryable = parsed.statusCode === 429 || parsed.statusCode === 503;
      const shouldRetry = retryable && attemptIndex < maxRetries;
      if (shouldRetry) {
        const baseDelayMs = 350;
        const jitterMs = Math.floor(Math.random() * 120);
        const delayMs = baseDelayMs * Math.pow(2, attemptIndex) + jitterMs;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      const error = new Error(parsed.message);
      error.statusCode = parsed.statusCode;
      throw error;
    }

    const error = new Error('Gemini request failed after retries. Please try again.');
    error.statusCode = 503;
    throw error;
  };

  try {
    return await attempt(usedModel);
  } catch (error) {
    // If the caller set a model (or env var) and it 404s, try auto-pick once.
    if ((error?.statusCode === 404 || error?.message?.includes('model not found')) && requestedModel) {
      const fallback = await pickGenerateContentModelId(apiKey);
      if (fallback && fallback !== requestedModel) {
        return await attempt(fallback);
      }
    }

    // If Gemini is overloaded, try an alternate model once.
    if (error?.statusCode === 503) {
      const alt = await pickAlternateGenerateContentModelId(apiKey, usedModel);
      if (alt && alt !== usedModel) {
        return await attempt(alt);
      }
    }
    throw error;
  }
}

export async function callGeminiJson({ system, user, schemaHint, model }) {
  // We request JSON via prompting (works across models/versions).
  const fullSystem =
    `${system || ''}`.trim() +
    (schemaHint
      ? `\n\nReturn STRICT JSON only (no markdown, no backticks). Match this schema:\n${schemaHint}`
      : '\n\nReturn STRICT JSON only (no markdown, no backticks).');

  const text = await callGeminiText({
    system: fullSystem,
    user,
    model,
    responseMimeType: 'application/json',
  });

  return extractJson(text);
}
