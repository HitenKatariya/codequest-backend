function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`${name} is required`);
    error.statusCode = 500;
    throw error;
  }
  return value;
}

function normalizeTextParts(parts) {
  if (!Array.isArray(parts)) return '';
  return parts
    .map((p) => (typeof p?.text === 'string' ? p.text : ''))
    .filter(Boolean)
    .join('')
    .trim();
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

  return { statusCode: 502, message: `Gemini API error (${response.status}): ${message}` };
}

export async function callGeminiText({ system, user, model }) {
  const apiKey = requiredEnv('GEMINI_API_KEY');
  const usedModel = model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    usedModel
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.3,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const parsed = await parseGeminiError(response);
    const error = new Error(parsed.message);
    error.statusCode = parsed.statusCode;
    throw error;
  }

  const data = await response.json();
  const text = normalizeTextParts(data?.candidates?.[0]?.content?.parts);
  return text;
}

export async function callGeminiJson({ system, user, schemaHint, model }) {
  // We request JSON via prompting (works across models/versions).
  const fullSystem =
    `${system || ''}`.trim() +
    (schemaHint
      ? `\n\nReturn STRICT JSON only (no markdown, no backticks). Match this schema:\n${schemaHint}`
      : '\n\nReturn STRICT JSON only (no markdown, no backticks).');

  const text = await callGeminiText({ system: fullSystem, user, model });

  try {
    return JSON.parse(text);
  } catch {
    const error = new Error('Gemini returned invalid JSON. Please try again.');
    error.statusCode = 502;
    throw error;
  }
}
